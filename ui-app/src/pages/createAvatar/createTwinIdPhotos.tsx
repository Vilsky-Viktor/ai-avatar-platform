import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateAvatarStepper from "../../components/createAvatar/CreateAvatarStepper";
import FullscreenModal from "../../components/createAvatar/FullscreenModal";
import MediaCard from "../../components/MediaCard";
import PhotoUploadGrid from "../../components/createAvatar/PhotoUploadGrid";
import { type Avatar } from '@loom24/shared/types';
import { Check, Sparkles, TriangleAlert } from 'lucide-react';
import { updateAvatar, restartJobById, genDigitalTwinIdPhotos, getJobsByGroupId, getAvatarById, cropPerson, normalizeJob } from '../../services/apiGateway';
import type { CropMode } from '../../services/apiGateway';
import { JobStatuses, type Job, type IdPhotoJobRequest } from '@loom24/shared/types';
import { useApp } from '../../providers/ContextProvider';
import { uploadMediaToBucket, getMediaUrlFromPath, deleteMediaFromBucket } from '../../services/storage';
import { 
    initialUploadedIdPhotoSet,
    getAvatarData,
    initialAvatarData,
    saveAvatarData,
    NUM_ID_PHOTOS,
} from '../../utils/avatarCreation';
import BottomDock from '../../components/createAvatar/BottomDock';
import { type UploadedIdPhoto, type NewAvatarData } from "../../types/avatarCreation";
import type { QuerySnapshot } from 'firebase/firestore';
import { listenToCollectionByGroupId } from '../../services/db';
import { scrollToTop } from '../../utils/scroller';


function CreateTwinIdPhotosPage() {
    const navigate = useNavigate();
    const { user } = useApp();

    const [newAvatarData, setNewAvatarData] = useState(() => getAvatarData());
    const [avatar, setAvatar] = useState(initialAvatarData);
    const [pageLoading, setPageLoading] = useState(true);

    const [jobs, setJobs] = useState([] as (Job | null)[]);
    const jobsRef = useRef<(Job | null)[]>([]);

    const [uploadedPhotos, setUploadedPhotos] = useState(initialUploadedIdPhotoSet as UploadedIdPhoto[]);
    const [fullscreen, setFullscreen] = useState<{ src: string; rect: DOMRect } | null>(null);
    const [croppingIndices, setCroppingIndices] = useState<number[]>([]);
    const [slotErrors, setSlotErrors] = useState<Record<number, string>>({});
    const [generateClicked, setGenerateClicked] = useState(false);

    const uploadedPhotosConfig: { label: string; name: string; ref: React.RefObject<HTMLInputElement | null>; mode: CropMode }[] = [
        { label: 'Front',         name: 'front',        ref: useRef<HTMLInputElement>(null), mode: 'front'     },
        { label: 'Front smile',   name: 'front-smile',   ref: useRef<HTMLInputElement>(null), mode: 'front'     },
        { label: 'Left quarter',  name: 'left-quarter',  ref: useRef<HTMLInputElement>(null), mode: 'quarter'   },
        { label: 'Right quarter', name: 'right-quarter', ref: useRef<HTMLInputElement>(null), mode: 'quarter'   },
        { label: 'Left side',     name: 'left-side',     ref: useRef<HTMLInputElement>(null), mode: 'side'      },
        { label: 'Right side',    name: 'right-side',    ref: useRef<HTMLInputElement>(null), mode: 'side'      },
        { label: 'Full body',     name: 'full-body',     ref: useRef<HTMLInputElement>(null), mode: 'full_body' },
    ];

    useEffect(() => {
        scrollToTop();
    }, []);

    useEffect(() => {
        initPage()
    }, []);

    useEffect(() => {
        saveAvatarData(newAvatarData);
    }, [newAvatarData]);

    useEffect(() => {
        if (!newAvatarData.groupId || !user?.id) return;

        const unsubscribe = listenToCollectionByGroupId('jobs', user.id, newAvatarData.groupId, async (querySnap: QuerySnapshot) => {
            await listener(querySnap);
        });

        return () => unsubscribe();
    }, [newAvatarData.groupId, user?.id]);

    useEffect(() => {
        jobsRef.current = jobs;
    }, [jobs]);

    const listener = async (querySnap: QuerySnapshot) => {
        for (const docSnap of querySnap.docs) {
            const job = normalizeJob(docSnap.data()) as Job;

            if (job.status === JobStatuses.completed && job.resultMediaPath) {
                job.resultMediaUrl = await getMediaUrlFromPath(job.resultMediaPath);
                if (job.resultThumbnailPath) {
                    job.resultThumbnailUrl = await getMediaUrlFromPath(job.resultThumbnailPath);
                }
            }

            const currentJobs = jobsRef.current;
            const jobIndex = currentJobs.findIndex((item) => item?.id === job.id);
            const oldJob = currentJobs[jobIndex];

            if (oldJob && oldJob?.status !== job.status) {
                setJob(jobIndex, job);
            }
        }
    }

    const initPage = async () => {
        const existingAvatar = await getAvatarById(newAvatarData.avatarId);
        const defaults: Record<string, string> = {
            height: 'average',
            bustSize: 'medium',
            bodyHair: 'none',
        };
        const params = { ...existingAvatar.parameters };
        for (const [key, val] of Object.entries(defaults)) {
            if (!params[key as keyof typeof params]) (params as Record<string, string>)[key] = val;
        }
        setAvatar({ ...existingAvatar, parameters: params });

        if (newAvatarData.groupId) {
            const fetchedJobs = await getJobsByGroupId(newAvatarData.groupId);
            const onlyIdPhotoJobs = fetchedJobs.filter((job: Job) => job.order! <= NUM_ID_PHOTOS);
            const enrichedJobs = await Promise.all(
                (onlyIdPhotoJobs as Job[]).map(async (job: Job) => {
                    const resultMediaUrl = job.resultMediaPath
                        ? await getMediaUrlFromPath(job.resultMediaPath).catch(() => undefined)
                        : undefined;
                    const resultThumbnailUrl = job.resultThumbnailPath
                        ? await getMediaUrlFromPath(job.resultThumbnailPath).catch(() => undefined)
                        : undefined;
                    return { ...job, resultMediaUrl, resultThumbnailUrl };
                })
            );
            setJobs(enrichedJobs as Job[]);
        }

        await loadUploadedPhotoUrls();
        setPageLoading(false);
    }

    const loadUploadedPhotoUrls = async () => {
        const mediaUrls = await Promise.all(
            uploadedPhotosConfig.map(config =>
                getMediaUrlFromPath(getUploadedMediaPath(config.name)).catch(() => null)
            )
        );

        setUploadedPhotos((prev: UploadedIdPhoto[]) =>
            prev.map((uploadedPhoto, idx) => ({ ...uploadedPhoto, mediaUrl: mediaUrls[idx] ?? undefined }))
        );
    }

    const getUploadedMediaPath = (name: string) => {
        return `media/${user?.id}-user/avatars/${newAvatarData.avatarId}-avatar/images/uploaded/${name}-cropped.png`;
    }

    const updatePhotoAtIndex = (index: number, photo: string | null) => {
        setUploadedPhotos((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], photo };
            return next;
        });
    };

    const removePhotoAtIndex = (index: number) => {
        const name = uploadedPhotosConfig[index].name;
        setUploadedPhotos(prev => {
            const next = [...prev];
            next[index] = { ...next[index], photo: null, mediaUrl: undefined };
            return next;
        });
        Promise.all([
            deleteMediaFromBucket(getRawMediaPath(name)).catch(() => {}),
            deleteMediaFromBucket(getUploadedMediaPath(name)).catch(() => {}),
        ]);
    };

    const setDraggingAtIndex = (index: number, isDragging: boolean) => {
        setUploadedPhotos((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], isDragging };
            return next;
        });
    };

    const getRawMediaPath = (name: string) => {
        return `media/${user?.id}-user/avatars/${newAvatarData.avatarId}-avatar/images/uploaded/${name}.png`;
    };

    const onFileSelected = async (index: number, file: File) => {
        if (!file.type.startsWith('image/')) return;

        setCroppingIndices(prev => [...prev, index]);
        setSlotErrors(prev => { const next = { ...prev }; delete next[index]; return next; });

        try {
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const config = uploadedPhotosConfig[index];
            const rawPath = getRawMediaPath(config.name);
            await uploadMediaToBucket(rawPath, dataUrl);

            const { path: croppedPath } = await cropPerson(rawPath, config.mode);
            const downloadUrl = await getMediaUrlFromPath(croppedPath);
            updatePhotoAtIndex(index, downloadUrl);
        } catch (error: any) {
            const message = error?.response?.data?.detail ?? 'Failed to process photo';
            setSlotErrors(prev => ({ ...prev, [index]: message }));
        } finally {
            setCroppingIndices(prev => prev.filter(i => i !== index));
        }
    };

    const handleFileUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelected(index, file);
            e.target.value = '';
        }
    };

    const handleDragOver = (index: number, e: React.DragEvent) => {
        e.preventDefault();
        if (!uploadedPhotos[index]?.photo) setDraggingAtIndex(index, true);
    };

    const handleDragLeave = (index: number, e: React.DragEvent) => {
        e.preventDefault();
        setDraggingAtIndex(index, false);
    };

    const handleDrop = (index: number, e: React.DragEvent) => {
        e.preventDefault();
        setDraggingAtIndex(index, false);
        if (uploadedPhotos[index]?.photo || croppingIndices.includes(index)) return;
        const file = e.dataTransfer.files?.[0];
        if (file) onFileSelected(index, file);
    };

    const setJob = (listIdx: number, job: Job | null) => {
        setJobs((prev: (Job | null)[]) => prev.map((oldJob, idx) => idx === listIdx ? job : oldJob));
    };

    const setGroupId = (groupId: string) => {
        setNewAvatarData((prev: NewAvatarData) => ({...prev, groupId}));
    }

    const jobsCreated = () => {
        return jobs.length > 0 && jobs.every(job => job !== null);
    }

    const createJobs = async () => {
        setGenerateClicked(true);
        const emptyJobs = Array(NUM_ID_PHOTOS).fill(null);
        setJobs(emptyJobs);

        const payload: Partial<Avatar> = {
            parameters: avatar.parameters,
        };
        await updateAvatar(newAvatarData.avatarId, payload);

        const jobRequest: IdPhotoJobRequest = {
            avatarId: newAvatarData.avatarId,
            parameters: avatar.parameters
        }

        try {
            const jobs = await genDigitalTwinIdPhotos(jobRequest);
            setJobs(jobs as Job[]);
            setGroupId(jobs[0].groupId!);
        } catch (error) {
            console.log('Failed to create jobs for photo set')
        }
    }

    const restartJob = async (jobId: string) => {
        const listIdx = jobs.findIndex(j => j?.id === jobId);
        if (listIdx === -1) return;

        setJob(listIdx, null);

        const restartedJob = await restartJobById(jobId);
        setJob(listIdx, restartedJob as Job);
    }

    const photosUploaded = () => {
        return uploadedPhotos.every((photo) => photo.photo || photo.mediaUrl);
    }

    const parametersFilled = () => {
        return avatar.parameters.bodyHair && avatar.parameters.height && avatar.parameters.bustSize;
    }

    const generatingStarted = () => {
        return jobs.length > 0;
    }

    const generatingCompleted = () => {
        return jobs.length > 0 && jobs.every((job: Job | null) => job && job.status === JobStatuses.completed);
    }

    const canProceed = () => {
        return generatingCompleted();
    };

    const stepLocked = () => {
        return Boolean(avatar.mainImagePath);
    }

    const nextStep = async () => {
        if (!canProceed()) return

        try {
            if (!stepLocked()) {
                const payload: Partial<Avatar> = {
                    mainImagePath: jobs[0]?.resultThumbnailPath || jobs[0]?.resultMediaPath
                };
                await updateAvatar(newAvatarData.avatarId, payload);
            }

            navigate('/avatar/create/assign-voice');
        } catch (error) {
            console.log(`Did not manage to update avatar: ${error}`);
        }
    }
        
    const previousStep = () => {
        navigate('/avatar/create/general');
    }

    return (
        <>
            <CreateAvatarStepper step={1} />

            {pageLoading ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <span className="loading loading-spinner loading-xl text-primary scale-150" />
                </div>
            ) : (
                <div className="max-w-7xl mx-auto px-4 pt-10 pb-32 flex gap-8 items-start">

                    {/* Left — Instructions + progress */}
                    <div className="w-80 flex-shrink-0 sticky top-6">
                        <div className="flex flex-col gap-2 pb-6 border-b border-base-content/5">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-px bg-primary/50" />
                                <h1 className="text-xl uppercase tracking-[0.2em] text-base-content/70">
                                    Upload photos
                                </h1>
                            </div>
                            <p className="text-sm text-base-content/40 pl-11 leading-relaxed">
                                Upload 7 high-quality photos from different angles so AI can accurately recreate your digital copy.
                            </p>
                        </div>

                        <div className="flex flex-col pt-2">
                            {uploadedPhotosConfig.map((config, index) => {
                                const uploaded = !!(uploadedPhotos[index]?.photo || uploadedPhotos[index]?.mediaUrl);
                                return (
                                    <div key={config.name} className="flex items-center gap-3 py-2.5 border-b border-base-content/5 last:border-0">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${uploaded ? 'border-primary bg-primary' : 'border-base-content/15'}`}>
                                            {uploaded && <Check size={8} strokeWidth={3.5} className="text-primary-content" />}
                                        </div>
                                        <span className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${uploaded ? 'text-base-content/60' : 'text-base-content/25'}`}>
                                            {config.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="relative mt-6 rounded-2xl bg-base-100 p-7 flex flex-col gap-4 overflow-hidden">
                            <TriangleAlert size={120} strokeWidth={0.8} className="absolute -top-5 -right-5 text-white/5 pointer-events-none" />
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-px bg-primary/50" />
                                <h2 className="text-xl uppercase tracking-[0.2em] text-base-content/70">Tips</h2>
                            </div>
                            <div className="flex flex-col gap-3">
                                {[
                                    'Good, even lighting',
                                    'Neutral background',
                                    'Neutral expression',
                                    'No glasses or hats',
                                    'Face fully visible',
                                    'Recent photos',
                                    'Same outfit in all photos'
                                ].map(tip => (
                                    <div key={tip} className="flex items-center gap-3">
                                        <span className="w-1 h-1 rounded-full bg-primary/40 flex-shrink-0" />
                                        <span className="text-sm text-base-content/50 leading-relaxed">{tip}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right — Upload grid + generate + results */}
                    <div className="flex-1 flex flex-col gap-8">
                        <PhotoUploadGrid
                            viewConfig={uploadedPhotosConfig}
                            uploadedPhotos={uploadedPhotos}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onFileUpload={handleFileUpload}
                            onRemovePhoto={removePhotoAtIndex}
                            removable={!generateClicked}
                            croppingIndices={croppingIndices}
                            slotErrors={slotErrors}
                        />

                        {photosUploaded() && parametersFilled() && (
                            <div className="flex justify-center">
                                <button
                                    onClick={createJobs}
                                    disabled={generatingStarted() || stepLocked()}
                                    className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-primary text-primary-content text-sm uppercase tracking-[0.3em] transition-all duration-300 hover:brightness-110 hover:scale-[1.02] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none"
                                >
                                    {generatingStarted() && !generatingCompleted()
                                        ? <span className="loading loading-spinner loading-xs" />
                                        : <Sparkles size={16} />
                                    }
                                    Generate photos
                                </button>
                            </div>
                        )}

                        {jobs.length > 0 && (
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-px bg-primary/50 flex-shrink-0" />
                                <p className="text-sm text-base-content/35 leading-relaxed">
                                    Review each photo — if the face or colors look off, hit regenerate.
                                </p>
                            </div>
                        )}

                        {jobs.length > 0 && (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                {jobs.map((job, idx) => (
                                    <MediaCard
                                        key={idx}
                                        job={job}
                                        idx={idx}
                                        onPhotoClick={(src, rect) => setFullscreen({ src, rect })}
                                        onRegenerate={restartJob}
                                        canRestart={!stepLocked()}
                                        showOrder={true}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <BottomDock
                avatarId={newAvatarData.avatarId}
                canProceed={canProceed}
                nextStep={nextStep}
                previousStep={previousStep}
                finish={false}
            />

            <FullscreenModal src={fullscreen?.src ?? null} rect={fullscreen?.rect ?? null} onClose={() => setFullscreen(null)} />
        </>
    )
}

export default CreateTwinIdPhotosPage;