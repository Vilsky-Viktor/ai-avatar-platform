import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateAvatarStepper from "../../components/createAvatar/CreateAvatarStepper";
import FullscreenModal from "../../components/createAvatar/FullscreenModal";
import JobPhotoCard from "../../components/createAvatar/JobPhotoCard";
import ImageCropperModal from "../../components/createAvatar/ImageCropperModal";
import PhotoUploadGrid from "../../components/createAvatar/PhotoUploadGrid";
import { AvatarStatus, type Avatar } from '../../types/avatar';
import { updateAvatar, restartJobById, genTrainingTwinIdPhotos } from '../../services/apiGateway';
import { JobStatuses, type Job, type TrainingJobRequest } from '../../types/job';
import { useApp } from '../../providers/ContextProvider';
import { uploadMediaToBucket, getMediaUrlFromPath } from '../../services/storage';
import { type Point, type Area } from 'react-easy-crop';
import { 
    GENERAL_STORAGE_KEY,  
    ID_PHOTO_STORAGE_KEY, 
    getLocalStorageData,
    saveLocalStorageData,
    initialUploadedIdPhotoSet
} from '../../utils/avatarCreation';
import BottomDock from '../../components/createAvatar/BottomDock';
import { type IdPhotoStepData, type GeneralStepData, type UploadedIdPhoto, type UploadedPhotoPaths } from "../../types/avatarCreation";
import type { QuerySnapshot } from 'firebase/firestore';
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
    const restartingJobIds = useRef<Set<string>>(new Set());

    const VIEW_CONFIG = [
        { label: 'Front', name: 'front', ref: useRef<HTMLInputElement>(null) },
        { label: 'Front smile', name: 'frontSmile', ref: useRef<HTMLInputElement>(null) },
        { label: 'Right quarter', name: 'rightQuarter', ref: useRef<HTMLInputElement>(null) },
        { label: 'Left quarter', name: 'leftQuarter', ref: useRef<HTMLInputElement>(null) },
    ];

    const [tempImage, setTempImage] = useState<string | null>(null);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    useEffect(() => { jobsRef.current = stepData.jobs; }, [stepData.jobs]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [])

    useEffect(() => {
        const savedPaths = stepData.uploadedPhotos;
        if (!savedPaths) return;

        VIEW_CONFIG.forEach((view, index) => {
            const mediaPath = savedPaths[view.name as keyof UploadedPhotoPaths];
            if (mediaPath) {
                getMediaUrlFromPath(mediaPath).then(url => {
                    if (url) updatePhotoAtIndex(index, url);
                });
            }
        });
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
        setStepData(prev => ({
            ...prev,
            uploadedPhotos: { ...prev.uploadedPhotos, [name]: mediaPath } as UploadedPhotoPaths,
        }));
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
            const jobs = await genTrainingTwinIdPhotos(jobRequest);
            setJobs(jobs);
        } catch (error) {
            console.log('Failed to create jobs for photo set')
        }
    }

    const restartJob = async (listIdx: number) => {
        const job = jobsRef.current[listIdx];
        if (!job?.id) return;

        restartingJobIds.current.add(job.id);
        setJob(listIdx, null);

        const restartedJob = await restartJobById(job.id);
        setJob(listIdx, restartedJob);
    }

    const photosUploaded = () => {
        const allPathsSaved = !!stepData.uploadedPhotos &&
            VIEW_CONFIG.every(v => !!stepData.uploadedPhotos![v.name as keyof UploadedPhotoPaths]);
        const allPhotosInState = uploadedPhotos.every((item) => item.photo);
        return allPathsSaved || allPhotosInState;
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

    return (
        <>
            <CreateAvatarStepper step={1} />

            <div className="mx-auto px-4 pt-12 mb-50">
                <ImageCropperModal
                    tempImage={tempImage}
                    crop={crop}
                    zoom={zoom}
                    setCrop={setCrop}
                    setZoom={setZoom}
                    onCropAreaChange={(_, pixels) => setCroppedAreaPixels(pixels)}
                    onClose={closeEditor}
                    onApply={handleCropComplete}
                />

                <PhotoUploadGrid
                    viewConfig={VIEW_CONFIG}
                    uploadedPhotos={uploadedPhotos}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onFileUpload={handleFileUpload}
                    onRemovePhoto={(index) => updatePhotoAtIndex(index, null)}
                />

                {photosUploaded() && (
                    <div className='text-center'>
                        <button
                            onClick={createJobs}
                            disabled={generatingStarted() || stepData.finished}
                            className="inline-flex items-center gap-3 px-12 py-4 my-12 rounded-2xl bg-primary text-primary-content text-sm font-semibold uppercase tracking-[0.35em] transition-all duration-300 hover:opacity-90 hover:scale-[1.005] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
                        >
                            {(generatingStarted() && !generatingCompleted()) && <span className="loading loading-spinner loading-xs"></span>}
                            <span>Generate Photos</span>
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {stepData.jobs.map((job, idx) => (
                        <JobPhotoCard
                            key={idx}
                            job={job}
                            idx={idx}
                            onPhotoClick={setFullscreenSrc}
                            onRetry={restartJob}
                            canRestart={!stepData.finished}
                        />
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

            <FullscreenModal src={fullscreenSrc} onClose={() => setFullscreenSrc(null)} />
        </>
    )
}

export default CreateTwinIdPhotosPage;