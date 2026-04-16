import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateAvatarStepper from "../../components/createAvatar/CreateAvatarStepper";
import { Sparkles, User, Trash2, X, Check, Minus, Plus, Clock, Loader2, CircleOff, RefreshCcw } from 'lucide-react';
import { AvatarStatus, type Avatar } from '../../types/avatar';
import { updateAvatar, restartJobById, genTrainingIdPhotosFromUploaded } from '../../services/apiGateway';
import { JobStatuses, type Job, type TrainingJobRequest } from '../../types/job';
import { useApp } from '../../providers/ContextProvider';
import { uploadMediaToBucket } from '../../services/storage';
import Cropper, { type Point, type Area } from 'react-easy-crop';
import { 
    GENERAL_STORAGE_KEY,  
    ID_PHOTO_STORAGE_KEY, 
    getLocalStorageData,
    saveLocalStorageData,
    initialUploadedIdPhotoSet
} from '../../utils/avatarCreation';
import BottomDock from '../../components/createAvatar/BottomDock';
import { type IdPhotoStepData, type GeneralStepData, type UploadedIdPhoto } from "../../types/avatarCreation";
import type { QuerySnapshot } from 'firebase/firestore';
import { getMediaUrlFromPath } from '../../services/storage';
import { listenToCollectionByGroupId } from '../../services/db';


const CROP_SIZE = [1328, 1328]

const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<string> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement('canvas');
    canvas.width = CROP_SIZE[0];
    canvas.height = CROP_SIZE[1];
    const ctx = canvas.getContext('2d');

    if (!ctx) return "";

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        CROP_SIZE[0],
        CROP_SIZE[1]
    );

    return canvas.toDataURL('image/jpeg', 0.9);
};

function CreateTwinIdPhotosPage() {
    const navigate = useNavigate();
    const { user } = useApp();

    const generalData = getLocalStorageData<GeneralStepData>(GENERAL_STORAGE_KEY);
    const [stepData, setStepData] = useState(() => getLocalStorageData<IdPhotoStepData>(ID_PHOTO_STORAGE_KEY))
    const [uploadedPhotos, setUploadedPhotos] = useState(initialUploadedIdPhotoSet as UploadedIdPhoto[]);
    const [fullscreenSrc, setFullscreenSrc] = useState<string | null>(null);
    const jobsRef = useRef(stepData.jobs);
    useEffect(() => { jobsRef.current = stepData.jobs; }, [stepData.jobs]);
    const restartingJobIds = useRef<Set<string>>(new Set());

    const VIEW_CONFIG = [
        { label: 'Front', name: 'front', ref: useRef<HTMLInputElement>(null) },
        { label: 'Front smile', name: 'smile', ref: useRef<HTMLInputElement>(null) },
        { label: 'Right quarter', name: 'right', ref: useRef<HTMLInputElement>(null) },
        { label: 'Left quarter', name: 'left', ref: useRef<HTMLInputElement>(null) },
    ];

    const [tempImage, setTempImage] = useState<string | null>(null);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    useEffect(() => {
        saveLocalStorageData<IdPhotoStepData>(ID_PHOTO_STORAGE_KEY, stepData);
    }, [stepData]);

    useEffect(() => {
        if (!fullscreenSrc) return;

        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
            setFullscreenSrc(null);
            }
        };

        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [fullscreenSrc]);

    useEffect(() => {
        if (!jobsCreated()) return;

        console.log("jobs updated")

        const groupId = stepData.jobs[0]?.groupId!;

        const unsubscribe = listenToCollectionByGroupId('jobs', user?.id!, groupId, async (querySnap: QuerySnapshot) => {
            await listener(querySnap);
        })

        return () => unsubscribe();
    }, [stepData.jobs]);

    const listener = async (querySnap: QuerySnapshot) => {
        for (const docSnap of querySnap.docs) {
            const job = docSnap.data() as Job;

            if (job.status === JobStatuses.completed && job.result?.mediaPath) {
                const downloadUrl = await getMediaUrlFromPath(job.result.mediaPath)
                job.result.mediaUrl = downloadUrl;
            }

            if (job.id && restartingJobIds.current.has(job.id)) {
                if (job.status === JobStatuses.pending) restartingJobIds.current.delete(job.id);
                continue;
            }

            const jobIndex = jobsRef.current.findIndex((item) => item?.id === job.id);
            const oldJob = jobsRef.current[jobIndex];

            if (oldJob && oldJob?.status !== job.status) {
                console.log(`job updated ${job.id} with status ${job.status}`)
                setJob(jobIndex, job);
            }
        }
    }

    const updatePhotoAtIndex = (index: number, photo: string | null) => {
        setUploadedPhotos((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], photo };
            return next;
        });
    };

    const setDraggingAtIndex = (index: number, isDragging: boolean) => {
        setUploadedPhotos((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], isDragging };
            return next;
        });
    };

    const onFileSelected = (index: number, file: File) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = () => {
            setTempImage(reader.result as string);
            setActiveIndex(index);
            setZoom(1);
            setCrop({ x: 0, y: 0 });
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = useCallback(async () => {
        if (tempImage && activeIndex !== null && croppedAreaPixels) {
            const croppedResult = await getCroppedImg(tempImage, croppedAreaPixels);
            updatePhotoAtIndex(activeIndex, croppedResult);
            closeEditor();
            await uploadToBucket(VIEW_CONFIG[activeIndex].name, croppedResult);
        }
    }, [tempImage, activeIndex, croppedAreaPixels]);

    const closeEditor = () => {
        setTempImage(null);
        setActiveIndex(null);
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
        if (uploadedPhotos[index]?.photo) return;
        const file = e.dataTransfer.files?.[0];
        if (file) onFileSelected(index, file);
    };

    const setJobs = (jobs: (Job | null)[]) => {
        setStepData((prev: IdPhotoStepData) => ({...prev, jobs}));
    }

    const setJob = (listIdx: number, job: Job | null) => {
        setStepData((prev: IdPhotoStepData) => ({
            ...prev,
            jobs: prev.jobs.map((oldJob, idx) => idx === listIdx ? job : oldJob)
        }));
    };

    const setFinished = () => {
        setStepData((prev: IdPhotoStepData) => ({...prev, finished: true}));
    }

    const uploadToBucket = async (name: string, image: string) => {
        const mediaPath = `media/${user?.id}-user/avatars/${generalData.avatarId}-avatar/images/uploaded/${name}-${CROP_SIZE[0]}x${CROP_SIZE[1]}.png`;
        await uploadMediaToBucket(mediaPath, image);
    }

    const jobsCreated = () => {
        return stepData.jobs.length > 0 && stepData.jobs.every(job => job !== null);
    }

    const createJobs = async () => {
        const emptyJobs = Array(9).fill(null);
        setJobs(emptyJobs);

        const jobRequest: TrainingJobRequest = {
            avatarId: generalData.avatarId,
            parameters: generalData.parameters
        }

        try {
            const jobs = await genTrainingIdPhotosFromUploaded(jobRequest);
            setJobs(jobs);
        } catch (error) {
            console.log('Failed to create jobs for photo set')
        }
    }

    const restartJob = async (jobId: string, listIdx: number) => {
        if (listIdx === 0) {
            await createJobs();
        } else {
            restartingJobIds.current.add(jobId);
            setJob(listIdx, null);
            const restartedJob = await restartJobById(jobId);
            setJob(listIdx, restartedJob);
        }
    }

    const photosUploaded = () => {
        return uploadedPhotos.every((item) => item.photo);
    }

    const generatingStarted = () => {
        return stepData.jobs.length > 0;
    }

    const generatingCompleted = () => {
        return stepData.jobs.length > 0 && stepData.jobs.every((job: Job | null) => job && job.status === JobStatuses.completed);
    }

    const canProceed = () => {
        return generatingCompleted();
    };

    const nextStep = async () => {
        if (!canProceed) return

        try {
            if (!stepData.finished) {
                const payload: Partial<Avatar> = {
                    status: AvatarStatus.idCreated,
                    mainImagePath: stepData.jobs[0]?.result?.mediaPath,
                };
                await updateAvatar(generalData.avatarId, payload);

                setFinished();
            }

            navigate('/avatar/create/photo-set');
        } catch (error) {
            console.log(`Did not manage to update avatar: ${error}`);
        }
    }
        
    const previousStep = () => {
        navigate('/avatar/create/general');
    }

    const FullscreenModal = () => {
        if (!fullscreenSrc) return null;

        return (
            <div
            className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center backdrop-blur-sm transition-opacity duration-200"
            onClick={() => setFullscreenSrc(null)}
            >
            <button
                className="absolute top-5 right-6 z-10 text-white text-6xl font-light hover:scale-110 hover:rotate-6 transition-transform duration-200"
                onClick={() => setFullscreenSrc(null)}
                aria-label="Close fullscreen view"
            >
                ×
            </button>

            <img
                src={fullscreenSrc}
                alt="Full size generated avatar"
                className="max-w-[96vw] max-h-[96vh] object-contain rounded-xl shadow-2xl transition-transform duration-300 scale-100"
                onClick={(e) => e.stopPropagation()}
            />
            </div>
        );
    };

    const renderPhotoArea = (job: Partial<Job> | null, idx: number) => {
        if (job === null) {
            return (
                <div className="flex relative rounded-[1rem] border border-dashed border-base-content/10 bg-transparent items-center justify-center aspect-square">
                    <div className="flex flex-col items-center gap-4">
                        <User size={50} strokeWidth={1} className="text-base-content/10" />

                        <div className="text-center">
                            <span className="text-[12px] font-bold uppercase tracking-[0.4em] text-base-content/30">
                                Photo {idx + 1}
                            </span>

                            <p className="text-[9px] font-medium uppercase tracking-widest text-base-content/20 mt-1">
                                Click generate
                            </p>
                        </div>
                    </div>

                    <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-base-content/10 pointer-events-none" />
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-base-content/10 pointer-events-none" />
                </div>
            )
        }

        if (job.status === JobStatuses.pending) {
            return (
                <div className="flex relative rounded-[1rem] border border-primary/20 bg-primary/[0.02] flex flex-col items-center justify-center aspect-square">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <Clock size={50} strokeWidth={1} className="text-base-content/30 animate-pulse" />
                        </div>

                        <div className="text-center">
                            <span className="text-[12px] font-bold uppercase tracking-[0.4em] text-primary">
                                Waiting
                            </span>
                            <p className="text-[9px] font-medium uppercase tracking-widest text-base-content/20 mt-1">
                                Queue processing
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        if (job.status === JobStatuses.generating) {
            return (
                <div className="flex relative rounded-[1rem] border border-primary/20 bg-primary/[0.02] flex flex-col items-center justify-center aspect-square">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <>
                                <Loader2 size={60} strokeWidth={1} className="text-primary animate-spin" />
                                <Sparkles size={20} className="absolute -top-3 -right-3 text-primary animate-pulse" />
                            </>
                        </div>

                        <div className="text-center">
                            <span className="text-[12px] font-bold uppercase tracking-[0.4em] text-primary">
                                Generating
                            </span>
                            <p className="text-[9px] font-medium uppercase tracking-widest text-base-content/20 mt-1">
                                Creating a new life
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        if (job.status === JobStatuses.error) {
            return (
                <div className="flex relative rounded-[1rem] border border-error/20 bg-error/[0.02] flex flex-col items-center justify-center aspect-square">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <CircleOff size={50} strokeWidth={1} className="text-base-content/30 animate-pulse" />
                        </div>

                        <div className="text-center">
                            <span className="text-[12px] font-bold uppercase tracking-[0.4em] text-error">
                                Error
                            </span>

                            <p className="text-[9px] font-medium uppercase tracking-widest text-base-content/20 mt-1">
                                Something went wrong
                            </p>
                        </div>
                    </div>

                    {!stepData.finished && (
                        <button
                            className="absolute top-1 right-1 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-primary transition-colors cursor-pointer"
                            onClick={() => restartJob(job.id!, idx)}
                        >
                            <RefreshCcw size={18} className="text-white spin-once-on-hover" />
                        </button>
                    )}
                    
                </div>
            );
        }

        if (job.status === JobStatuses.completed) {
            const url = job.result?.mediaUrl;
            const bestFaceMatch = job.result?.bestFaceMatch ?? 0;

            if (!url) {
                return (
                    <div className="relative rounded-[1rem] border border-base-content/10 bg-base-200/30 aspect-square" />
                );
            }

            return (
                <div
                    className="group relative rounded-[1rem] border border-base-content/10 bg-base-200/30 overflow-hidden cursor-pointer aspect-square"
                    onClick={() => setFullscreenSrc(url)}
                    >
                    <img
                        src={url}
                        alt={`Generated avatar photo ${idx + 1}`}
                        className="absolute inset-0 w-full h-full object-cover object-top transition-all duration-500 group-hover:scale-105 group-hover:opacity-90"
                    />

                    <div className="absolute top-1 left-1 z-10">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-[0.8rem] shadow-lg text-white text-xs font-medium">
                            <span className="font-bold">{job.order}</span>
                        </div>
                    </div>

                    {!stepData.finished && (
                        <button
                            className="absolute top-1 right-1 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-primary transition-all cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); restartJob(job.id!, idx); }}
                        >
                            <RefreshCcw size={18} className="text-white spin-once-on-hover" />
                        </button>
                    )}

                    {bestFaceMatch > 0 && (
                        <div className="absolute bottom-1 right-1 z-10">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-[0.8rem] shadow-lg text-white text-xs font-medium">
                                <span className="font-bold">
                                    {(bestFaceMatch * 100).toFixed(0)}%
                                </span>

                                <div
                                    className={`w-2 h-2 rounded-full ${
                                        bestFaceMatch >= 0.7
                                        ? 'bg-green-400'
                                        : bestFaceMatch >= 0.6
                                        ? 'bg-yellow-400'
                                        : bestFaceMatch >= 0.55
                                        ? 'bg-orange-400'
                                        : 'bg-red-400'
                                    }`}
                                />
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return null;
    }

    return (
        <>
            <CreateAvatarStepper step={1} />

            <div className="mx-auto px-4 pt-12 mb-50">
                {tempImage && (
                    <div className="fixed inset-0 z-[100] bg-base-300/95 backdrop-blur-md flex flex-col items-center justify-center p-6">
                        <div className="w-full max-w-xl flex flex-col gap-6">
                            <div className="flex justify-between items-center text-white">
                                <h3 className="text-sm font-bold uppercase tracking-widest">Crop to square</h3>
                                <button onClick={closeEditor} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <X size={40} />
                                </button>
                            </div>

                            <div className="relative w-full aspect-square rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-black">
                                <Cropper
                                    image={tempImage}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                                />
                            </div>

                            <div className="flex flex-col gap-6 bg-base-100 p-8 rounded-[2rem] border border-white/5">
                                <div className="flex items-center gap-4">
                                    <Minus size={16} className="opacity-40" />
                                    <input 
                                        type="range" 
                                        min={1} 
                                        max={3} 
                                        step={0.1} 
                                        value={zoom} 
                                        onChange={(e) => setZoom(Number(e.target.value))}
                                        className="range range-primary range-xs flex-1"
                                    />
                                    <Plus size={16} className="opacity-40" />
                                </div>
                                
                                <div className="flex gap-3">
                                    <button onClick={closeEditor} className="btn btn-ghost flex-1 rounded-2xl">Cancel</button>
                                    <button onClick={handleCropComplete} className="btn btn-primary flex-1 rounded-2xl">
                                        <Check size={18} className="mr-2" /> Apply Crop
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!stepData.finished && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full mt-8">
                        {VIEW_CONFIG.map((view, index) => {
                            const photoData = uploadedPhotos[index];
                            const hasPhoto = !!photoData?.photo;
        
                            return (
                                <div 
                                    key={index}
                                    onDragOver={(e) => handleDragOver(index, e)}
                                    onDragLeave={(e) => handleDragLeave(index, e)}
                                    onDrop={(e) => handleDrop(index, e)}
                                    onClick={() => !hasPhoto && view.ref.current?.click()}
                                    className={`relative rounded-[1.5rem] border border-dashed flex flex-col items-center justify-center aspect-square group transition-all duration-700 overflow-hidden
                                        ${hasPhoto ? 'border-primary/20 bg-base-200' : 'border-base-content/15 bg-transparent cursor-pointer hover:border-primary/40'} 
                                        ${photoData?.isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : ''}`}
                                >
                                    <input 
                                        type="file" 
                                        ref={view.ref} 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={(e) => handleFileUpload(index, e)} 
                                    />
                                    
                                    {hasPhoto ? (
                                        <>
                                            <img 
                                                src={photoData.photo!} 
                                                className="absolute inset-0 w-full h-full object-contain z-0 rounded-[1.5rem]" 
                                                alt={view.label} 
                                            />
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    updatePhotoAtIndex(index, null); 
                                                }} 
                                                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center group-hover:hover:bg-error transition-all cursor-pointer"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-4 pointer-events-none">
                                            <div className="flex items-center justify-center group-hover:scale-105 transition-all duration-500">
                                                <User 
                                                    size={50} 
                                                    strokeWidth={0.8} 
                                                    className={`transition-colors ${photoData?.isDragging ? 'text-primary' : 'text-base-content/30 group-hover:text-primary'}`} 
                                                />
                                            </div>
                                            <div className="text-center">
                                                <span className={`text-[13px] font-bold uppercase tracking-[0.3em] transition-colors ${photoData?.isDragging ? 'text-primary' : 'text-base-content/40 group-hover:text-primary'}`}>
                                                    {photoData?.isDragging ? 'Drop Here' : view.label}
                                                </span>
                                                <p className="text-[10px] font-medium uppercase tracking-widest text-base-content/20 mt-2">Click or drag & drop</p>
                                            </div>
                                        </div>
                                    )}
        
                                    {!hasPhoto && (
                                        <>
                                            <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-base-content/10 pointer-events-none" />
                                            <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-base-content/10 pointer-events-none" />
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {photosUploaded() && !stepData.finished && (
                    <div className='text-center'>
                        <button
                            onClick={createJobs}
                            disabled={(generatingStarted() && !generatingCompleted()) || stepData.finished}
                            className={`btn btn-primary btn-dash group relative px-12 py-8 my-12 rounded-2xl transition-all duration-500 hover:scale-[1.01] ${(generatingStarted() && !generatingCompleted()) || stepData.finished ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                            {((generatingStarted() && !generatingCompleted())) && <span className="loading loading-spinner mr-2"></span>}
                            <span className="text-sm uppercase tracking-[0.4em]">{jobsCreated() ? 'Re-generate Photos' : 'Generate Photos'}</span>
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {stepData.jobs.map((job, idx) => (
                        <div key={idx}>
                            {renderPhotoArea(job, idx)}
                        </div>
                    ))}
                </div>
                
            </div>

            <BottomDock
                avatarId={generalData.avatarId}
                canProceed={canProceed}
                nextStep={nextStep}
                previousStep={previousStep}
                finish={false}
            />

            <FullscreenModal />
        </>
    )
}

export default CreateTwinIdPhotosPage;