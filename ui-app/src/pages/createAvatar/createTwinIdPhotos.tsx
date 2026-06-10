import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateAvatarStepper from "../../components/createAvatar/CreateAvatarStepper";
import Loading from "../../components/Loading";
import { type Avatar } from '@loom24/shared/types';
import { Check, TriangleAlert, Trash2, CircleOff, ArrowLeft, ArrowRight, ArrowDownLeft, ArrowDownRight, User, PersonStanding, RefreshCcw } from 'lucide-react';
import { updateAvatar, genDigitalTwinIdPhoto, getJobsByGroupId, getAvatarById, normalizeJob, deleteJobById } from '../../services/apiGateway';
import { CropperModes, Directions, JobStatuses, type Job, type IdPhotoJobRequest } from '@loom24/shared/types';
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
import FullscreenModal from '../../components/createAvatar/FullscreenModal';
import { type UploadedIdPhoto, type NewAvatarData } from "../../types/avatarCreation";
import type { QuerySnapshot } from 'firebase/firestore';
import { listenToCollectionByGroupId } from '../../services/db';
import { scrollToTop } from '../../utils/scroller';

const DIRECTION_DESCRIPTIONS: Record<string, string> = {
    'front':         'Look at camera, neutral expression',
    'front-smile':   'Look at camera, gentle smile with teeth',
    'left-quarter':  'Turn to show three-quarters',
    'right-quarter': 'Turn to show three-quarters',
    'left-side':     'Turn to show side profile',
    'right-side':    'Turn to show side profile',
    'full-body':     'Stand straight, face forward',
};

const DIRECTION_ICONS: Record<string, React.ElementType> = {
    'front':         User,
    'front-smile':   User,
    'left-quarter':  ArrowDownLeft,
    'right-quarter': ArrowDownRight,
    'left-side':     ArrowLeft,
    'right-side':    ArrowRight,
    'full-body':     PersonStanding,
};

const DirectionIcon = ({ name, active }: { name: string; active: boolean }) => {
    const Icon = DIRECTION_ICONS[name] ?? User;
    const color = active ? 'text-primary' : 'text-base-content/25 group-hover:text-primary/60';
    return <Icon size={36} strokeWidth={1.2} className={`transition-colors duration-300 ${color}`} />;
};

function CreateTwinIdPhotosPage() {
    const navigate = useNavigate();
    const { user } = useApp();

    const [newAvatarData, setNewAvatarData] = useState(() => getAvatarData());
    const [avatar, setAvatar] = useState(initialAvatarData);
    const [pageLoading, setPageLoading] = useState(true);

    const [jobs, setJobs] = useState<(Job | null)[]>(Array(NUM_ID_PHOTOS).fill(null));
    const jobsRef = useRef<(Job | null)[]>([]);

    const [uploadedPhotos, setUploadedPhotos] = useState(initialUploadedIdPhotoSet as UploadedIdPhoto[]);
    const [uploadingIndices, setUploadingIndices] = useState<number[]>([]);
    const [slotErrors, setSlotErrors] = useState<Record<number, string>>({});
    const [fullscreen, setFullscreen] = useState<{ src: string; rect: DOMRect | null; thumbnailSrc?: string } | null>(null);

    const uploadedPhotosConfig: { 
        label: string; name: string; ref: React.RefObject<HTMLInputElement | null>; mode: CropperModes; direction: Directions 
    }[] = [
        { label: 'Front',         name: 'front',         ref: useRef<HTMLInputElement>(null), mode: CropperModes.front,   direction: Directions.front },
        { label: 'Front smile',   name: 'front-smile',   ref: useRef<HTMLInputElement>(null), mode: CropperModes.front,   direction: Directions.front },
        { label: '45° to the left',  name: 'left-quarter',  ref: useRef<HTMLInputElement>(null), mode: CropperModes.quarter, direction: Directions.leftQuarter },
        { label: '45° to the right', name: 'right-quarter', ref: useRef<HTMLInputElement>(null), mode: CropperModes.quarter, direction: Directions.rightQuarter },
        { label: '90° to the left',     name: 'left-side',     ref: useRef<HTMLInputElement>(null), mode: CropperModes.side,    direction: Directions.leftSide },
        { label: '90° to the right',    name: 'right-side',    ref: useRef<HTMLInputElement>(null), mode: CropperModes.side,    direction: Directions.rightSide },
        { label: 'Front full body',     name: 'full-body',     ref: useRef<HTMLInputElement>(null), mode: CropperModes.body,    direction: Directions.front },
    ];

    useEffect(() => {
        scrollToTop();
    }, []);

    useEffect(() => {
        initPage();
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

            setJobs(prev => {
                const idx = prev.findIndex(j => j?.id === job.id);
                if (idx === -1 || prev[idx]?.status === job.status) return prev;
                if (job.status === JobStatuses.error) {
                    setSlotErrors(errors => ({ ...errors, [idx]: 'Processing failed' }));
                }
                return prev.map((j, i) => i === idx ? job : j);
            });
        }
    };

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

        if (!newAvatarData.groupId) {
            setNewAvatarData((prev: NewAvatarData) => {
                const updated = { ...prev, groupId: crypto.randomUUID() };
                saveAvatarData(updated);
                return updated;
            });
        }

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
            const slottedJobs: (Job | null)[] = Array(NUM_ID_PHOTOS).fill(null);
            for (const job of enrichedJobs) {
                if (job.order && job.order <= NUM_ID_PHOTOS) {
                    slottedJobs[job.order - 1] = job;
                }
            }
            setJobs(slottedJobs);
        }

        await loadUploadedPhotoUrls();
        setPageLoading(false);
    };

    const loadUploadedPhotoUrls = async () => {
        const mediaUrls = await Promise.all(
            uploadedPhotosConfig.map(config =>
                getMediaUrlFromPath(getRawMediaPath(config.name)).catch(() => null)
            )
        );

        setUploadedPhotos((prev: UploadedIdPhoto[]) =>
            prev.map((uploadedPhoto, idx) => ({ ...uploadedPhoto, mediaUrl: mediaUrls[idx] ?? undefined }))
        );
    };

    const getRawMediaPath = (name: string) => {
        return `media/${user?.id}-user/avatars/${newAvatarData.avatarId}-avatar/images/uploaded/${name}.png`;
    };

    const updatePhotoAtIndex = (index: number, photo: string | null) => {
        setUploadedPhotos((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], photo };
            return next;
        });
    };

    const removePhotoAtIndex = (index: number) => {
        const name = uploadedPhotosConfig[index].name;
        const job = jobs[index];

        setUploadedPhotos(prev => {
            const next = [...prev];
            next[index] = { ...next[index], photo: null, mediaUrl: undefined };
            return next;
        });
        setJobs(prev => {
            const next = [...prev];
            next[index] = null;
            return next;
        });
        setSlotErrors(prev => { const next = { ...prev }; delete next[index]; return next; });

        deleteMediaFromBucket(getRawMediaPath(name)).catch(error => console.error(`Failed to delete raw media for slot ${index}:`, error));

        if (job?.resultMediaPath) {
            deleteMediaFromBucket(job.resultMediaPath).catch(error => console.error(`Failed to delete result media for slot ${index}:`, error));
        }
        if (job?.resultThumbnailPath) {
            deleteMediaFromBucket(job.resultThumbnailPath).catch(error => console.error(`Failed to delete result thumbnail for slot ${index}:`, error));
        }
        if (job?.id) {
            deleteJobById(job.id).catch(error => console.error(`Failed to delete job ${job.id}:`, error));
        }
    };

    const setDraggingAtIndex = (index: number, isDragging: boolean) => {
        setUploadedPhotos((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], isDragging };
            return next;
        });
    };

    const onFileSelected = async (index: number, file: File) => {
        if (!file.type.startsWith('image/')) return;

        setUploadingIndices(prev => [...prev, index]);
        setSlotErrors(prev => { const next = { ...prev }; delete next[index]; return next; });

        try {
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            updatePhotoAtIndex(index, dataUrl);

            const config = uploadedPhotosConfig[index];
            const rawPath = getRawMediaPath(config.name);
            await uploadMediaToBucket(rawPath, dataUrl);

            const jobRequest: IdPhotoJobRequest = {
                groupId: newAvatarData.groupId,
                avatarId: newAvatarData.avatarId,
                parameters: avatar.parameters,
                idPhotoPath: rawPath,
                order: index + 1,
                mode: config.mode,
                direction: config.direction,
            };

            const job = await genDigitalTwinIdPhoto(jobRequest);

            setJobs(prev => {
                const next = [...prev];
                next[index] = job;
                return next;
            });
        } catch (error: any) {
            const message = error?.response?.data?.detail ?? 'Failed to process photo';
            setSlotErrors(prev => ({ ...prev, [index]: message }));
            updatePhotoAtIndex(index, null);
        } finally {
            setUploadingIndices(prev => prev.filter(uploadIndex => uploadIndex !== index));
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
        const occupied = uploadedPhotos[index]?.photo || uploadedPhotos[index]?.mediaUrl || jobs[index];
        if (!occupied) setDraggingAtIndex(index, true);
    };

    const handleDragLeave = (index: number, e: React.DragEvent) => {
        e.preventDefault();
        setDraggingAtIndex(index, false);
    };

    const handleDrop = (index: number, e: React.DragEvent) => {
        e.preventDefault();
        setDraggingAtIndex(index, false);
        const occupied = uploadedPhotos[index]?.photo || uploadedPhotos[index]?.mediaUrl || jobs[index];
        if (occupied || uploadingIndices.includes(index)) return;
        const file = e.dataTransfer.files?.[0];
        if (file) onFileSelected(index, file);
    };


    const stepLocked = () => {
        return Boolean(avatar.mainImagePath);
    };

    const generatingCompleted = () => {
        return jobs.some((job: Job | null) => job && job.status === JobStatuses.completed);
    };

    const canProceed = () => {
        return generatingCompleted();
    };

    const nextStep = async () => {
        if (!canProceed()) return;

        try {
            if (!stepLocked()) {
                const payload: Partial<Avatar> = {
                    mainImagePath: jobs[0]?.resultThumbnailPath || jobs[0]?.resultMediaPath
                };
                await updateAvatar(newAvatarData.avatarId, payload);
            }

            navigate('/avatar/create/assign-voice');
        } catch (error) {
            console.error(`Failed to update avatar: ${error}`);
        }
    };

    const previousStep = () => {
        navigate('/avatar/create/general');
    };

    return (
        <>
            <CreateAvatarStepper step={1} />

            {pageLoading ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loading />
                </div>
            ) : (
                <div className="max-w-7xl mx-auto px-4 pt-10 pb-32 flex gap-8 items-start">

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
                                const job = jobs[index];
                                const isJobCompleted = job?.status === JobStatuses.completed;
                                const isActive = uploadingIndices.includes(index) || (!!job && job.status !== JobStatuses.completed);
                                return (
                                    <div key={config.name} className="flex items-center gap-3 py-2.5 border-b border-base-content/5 last:border-0">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isJobCompleted ? 'border-primary bg-primary' : isActive ? 'border-primary/50 animate-pulse' : 'border-base-content/15'}`}>
                                            {isJobCompleted && <Check size={8} strokeWidth={3.5} className="text-primary-content" />}
                                        </div>
                                        <span className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${isJobCompleted ? 'text-base-content/60' : 'text-base-content/25'}`}>
                                            {config.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="relative mt-6 rounded-2xl bg-base-100 p-7 flex flex-col gap-4 overflow-hidden">
                            <TriangleAlert size={100} strokeWidth={0.8} className="absolute -top-5 -right-5 text-white/5 pointer-events-none" />
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-px bg-primary/50" />
                                <h2 className="text-xl uppercase tracking-[0.2em] text-base-content/70">Tips</h2>
                            </div>
                            <div className="flex flex-col gap-3">
                                {[
                                    'Good, even lighting (daylight or studio light)',
                                    'Neutral background without objects and other people',
                                    'Neutral expression (passport style)',
                                    'No glasses, hats or covers',
                                    'Face fully visible, in sharp focus',
                                    'Recent photos',
                                    'Same outfit in all photos',
                                    'No blur or motion'
                                ].map(tip => (
                                    <div key={tip} className="flex items-center gap-3">
                                        <span className="w-1 h-1 rounded-full bg-primary/40 flex-shrink-0" />
                                        <span className="text-sm text-base-content/50 leading-relaxed">{tip}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-8">
                        {generatingCompleted() && (
                            <div className="flex items-start gap-4 px-5 py-4 rounded-2xl border border-primary/15 bg-primary/[0.04]">
                                <span className="w-8 h-px bg-primary/50 mt-[9px] flex-shrink-0" />
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm text-base-content/70">Review each photo before continuing.</p>
                                    <p className="text-xs text-base-content/35 leading-relaxed">Make sure nothing is cut off, the image is sharp, and the quality is high. If a photo looks off — remove it and upload another one.</p>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-3 gap-4 w-full">
                            {uploadedPhotosConfig.map((config, index) => {
                                const photoData = uploadedPhotos[index];
                                const job = jobs[index];
                                const isUploading = uploadingIndices.includes(index);
                                const isJobError = job?.status === JobStatuses.error;
                                const isProcessing = !isUploading && !!job && job.status !== JobStatuses.completed && !isJobError;
                                const isCompleted = job?.status === JobStatuses.completed;
                                const slotError = slotErrors[index];
                                const hasError = isJobError || !!slotError;
                                const rawImageSrc = photoData?.photo || photoData?.mediaUrl;
                                const displaySrc = isCompleted ? (job.resultThumbnailUrl || job.resultMediaUrl) : rawImageSrc;
                                const hasPhoto = !!displaySrc;
                                return (
                                    <div
                                        key={index}
                                        onDragOver={(e) => !hasPhoto && !isUploading && !hasError && handleDragOver(index, e)}
                                        onDragLeave={(e) => handleDragLeave(index, e)}
                                        onDrop={(e) => !hasPhoto && !isUploading && !hasError && handleDrop(index, e)}
                                        onClick={(event) => {
                                            if (isUploading || isProcessing) return;
                                            if (isCompleted && displaySrc) {
                                                setFullscreen({ src: job.resultMediaUrl!, rect: event.currentTarget.getBoundingClientRect(), thumbnailSrc: job.resultThumbnailUrl });
                                                return;
                                            }
                                            if (!hasPhoto && !hasError) config.ref.current?.click();
                                        }}
                                        className={`relative rounded-2xl border border-dashed flex flex-col items-center justify-center aspect-square group transition-all duration-300 overflow-hidden
                                            ${isUploading || isProcessing ? 'border-primary/20 bg-primary/[0.02] cursor-not-allowed'
                                            : hasError ? 'border-error/20 bg-base-200 cursor-pointer'
                                            : isCompleted ? 'border-primary/20 bg-base-200 cursor-pointer'
                                            : hasPhoto ? 'border-primary/20 bg-base-200'
                                            : 'border-base-content/10 bg-transparent cursor-pointer hover:border-primary/30'}
                                            ${photoData?.isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : ''}`}
                                    >
                                        <input
                                            type="file"
                                            ref={config.ref}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload(index, e)}
                                        />

                                        {isUploading ? (
                                            <div className="flex flex-col items-center gap-4">
                                                <Loading size="md" className="" />
                                                <span className="text-[11px] uppercase tracking-[0.35em] text-primary">Uploading</span>
                                            </div>
                                        ) : hasPhoto ? (
                                            <>
                                                <img
                                                    src={displaySrc!}
                                                    className={`absolute inset-0 w-full h-full object-cover object-top z-0 rounded-2xl transition-all duration-500${isCompleted ? ' group-hover:scale-105 group-hover:opacity-90' : ''}`}
                                                    alt={config.label}
                                                />
                                                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent pointer-events-none z-[1]" />
                                                <div className="absolute bottom-2 left-2 z-10">
                                                    <span className="px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-lg text-[9px] uppercase tracking-[0.2em] text-white/50">{config.label}</span>
                                                </div>
                                                {isProcessing && (
                                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 rounded-2xl gap-3 pointer-events-none">
                                                        <Loading size="md" color="text-white" className="" />
                                                        <span className="text-[11px] uppercase tracking-[0.35em] text-white/80">Processing</span>
                                                    </div>
                                                )}
                                                {hasError && (
                                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 rounded-2xl gap-3">
                                                        <CircleOff size={28} strokeWidth={1} className="text-error/80" />
                                                        <span className="text-[11px] uppercase tracking-[0.35em] text-white/80">Failed</span>
                                                        <button
                                                            onClick={(event) => { event.stopPropagation(); removePhotoAtIndex(index); }}
                                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md text-[10px] uppercase tracking-widest text-white/70 hover:bg-error hover:text-white transition-all cursor-pointer mt-1"
                                                        >
                                                            <RefreshCcw size={13} />
                                                            Try again
                                                        </button>
                                                    </div>
                                                )}
                                                {!isProcessing && !hasError && (
                                                    <>
                                                        <div className="tooltip tooltip-left absolute top-3 right-3 z-20" data-tip="Remove">
                                                            <button
                                                                onClick={(event) => { event.stopPropagation(); removePhotoAtIndex(index); }}
                                                                className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-error transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Trash2 size={17} />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        ) : hasError ? (
                                            <div className="flex flex-col items-center gap-4 px-4">
                                                <CircleOff size={40} strokeWidth={1} className="text-error/50 animate-pulse" />
                                                <span className="text-[11px] uppercase tracking-[0.35em] text-error">Failed</span>
                                                <p className="text-[9px] text-error/50 text-center leading-snug">
                                                    Check that the view, direction<br/>and angle are correct
                                                </p>
                                                <button
                                                    onClick={(event) => { event.stopPropagation(); removePhotoAtIndex(index); }}
                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-error/10 text-[10px] uppercase tracking-widest text-error/80 hover:bg-error hover:text-white transition-all cursor-pointer"
                                                >
                                                    <Trash2 size={13} />
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 pointer-events-none px-2">
                                                <DirectionIcon name={config.name} active={!!photoData?.isDragging} />
                                                <div className="text-center flex flex-col gap-1">
                                                    <span className={`text-[11px] uppercase tracking-[0.25em] transition-colors duration-300 ${photoData?.isDragging ? 'text-primary' : 'text-base-content/50 group-hover:text-base-content/70'}`}>
                                                        {photoData?.isDragging ? 'Drop here' : config.label}
                                                    </span>
                                                    {!photoData?.isDragging && (
                                                        <p className="text-[9px] text-base-content/25 leading-snug">
                                                            {DIRECTION_DESCRIPTIONS[config.name]}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {!hasPhoto && !isUploading && !hasError && !isProcessing && (
                                            <>
                                                <div className="absolute top-6 left-6 w-5 h-5 border-t border-l border-base-content/8 pointer-events-none" />
                                                <div className="absolute bottom-6 right-6 w-5 h-5 border-b border-r border-base-content/8 pointer-events-none" />
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
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

            <FullscreenModal
                src={fullscreen?.src ?? null}
                rect={fullscreen?.rect ?? null}
                thumbnailSrc={fullscreen?.thumbnailSrc}
                onClose={() => setFullscreen(null)}
            />

        </>
    );
}

export default CreateTwinIdPhotosPage;
