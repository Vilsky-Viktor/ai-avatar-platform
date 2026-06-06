import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateAvatarStepper from "../../components/createAvatar/CreateAvatarStepper";
import FullscreenModal from "../../components/createAvatar/FullscreenModal";
import MediaCard from "../../components/MediaCard";
import PhotoUploadGrid from "../../components/createAvatar/PhotoUploadGrid";
import { type Avatar } from '../../types/avatar';
import { updateAvatar, restartJobById, genDigitalTwinIdPhotos, getJobsByGroupId, getAvatarById, cropPerson } from '../../services/apiGateway';
import type { CropMode } from '../../services/apiGateway';
import { JobStatuses, type Job, type IdPhotoJobRequest } from '../../types/job';
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
import { scrollToTop, scrollToBottom } from '../../utils/scroller';


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
            const job = docSnap.data() as Job;

            if (job.status === JobStatuses.completed && job.resultMediaPath) {
                const downloadUrl = await getMediaUrlFromPath(job.resultMediaPath)
                job.resultMediaUrl = downloadUrl;
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
                    return { ...job, resultMediaUrl };
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
            setTimeout(() => scrollToBottom(), 500);
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
        setTimeout(() => scrollToBottom(), 500);
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
                    mainImagePath: jobs[0]?.resultMediaPath
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
                    <span className="loading loading-spinner loading-xl text-primary scale-150"></span>
                </div>
            ) : (
                <div className="mx-auto px-4 pt-12 mb-50">
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
                        <div className='text-center'>
                            <button
                                onClick={createJobs}
                                disabled={generatingStarted() || stepLocked()}
                                className="inline-flex items-center gap-3 px-12 py-4 my-12 rounded-2xl bg-primary text-primary-content text-sm font-semibold uppercase tracking-[0.35em] transition-all duration-300 hover:opacity-90 hover:scale-[1.005] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
                            >
                                {(generatingStarted() && !generatingCompleted()) && <span className="loading loading-spinner loading-xs"></span>}
                                <span>Generate Photos</span>
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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