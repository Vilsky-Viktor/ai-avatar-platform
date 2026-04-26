import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateAvatarStepper from "../../components/createAvatar/CreateAvatarStepper";
import FullscreenModal from "../../components/createAvatar/FullscreenModal";
import PhotoCard from "../../components/PhotoCard";
import ImageCropperModal from "../../components/createAvatar/ImageCropperModal";
import PhotoUploadGrid from "../../components/createAvatar/PhotoUploadGrid";
import PillSelect from '../../components/PillSelect';
import { type Avatar } from '../../types/avatar';
import { updateAvatar, restartJobById, genTrainingTwinIdPhotos, getJobsByGroupId, getAvatarById } from '../../services/apiGateway';
import { JobStatuses, type InferenceJob, type TrainingJobRequest } from '../../types/job';
import { useApp } from '../../providers/ContextProvider';
import { uploadMediaToBucket, getMediaUrlFromPath } from '../../services/storage';
import { type Point, type Area } from 'react-easy-crop';
import { getCroppedImg } from '../../utils/imageUtils';
import { 
    initialUploadedIdPhotoSet,
    getAvatarData,
    initialAvatarData,
    saveAvatarData,
    NUM_ID_PHOTOS,
    AVATAR_PARAMETER_OPTIONS
} from '../../utils/avatarCreation';
import BottomDock from '../../components/createAvatar/BottomDock';
import { type UploadedIdPhoto, type NewAvatarData } from "../../types/avatarCreation";
import type { QuerySnapshot } from 'firebase/firestore';
import { listenToCollectionByGroupId } from '../../services/db';
import { scrollToTop, scrollToBottom } from '../../utils/scroller';


const CROP_SIZE: [number, number] = [1328, 1328]


function CreateTwinIdPhotosPage() {
    const navigate = useNavigate();
    const { user } = useApp();

    const [newAvatarData, setNewAvatarData] = useState(() => getAvatarData());
    const [avatar, setAvatar] = useState(initialAvatarData);
    const [pageLoading, setPageLoading] = useState(true);

    const [jobs, setJobs] = useState([] as (InferenceJob | null)[]);
    const jobsRef = useRef<(InferenceJob | null)[]>([]);

    const [uploadedPhotos, setUploadedPhotos] = useState(initialUploadedIdPhotoSet as UploadedIdPhoto[]);
    const [fullscreen, setFullscreen] = useState<{ src: string; rect: DOMRect } | null>(null);
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const uploadedPhotosConfig = [
        { label: 'Front', name: 'front', ref: useRef<HTMLInputElement>(null) },
        { label: 'Front smile', name: 'frontSmile', ref: useRef<HTMLInputElement>(null) },
        { label: 'Right quarter', name: 'rightQuarter', ref: useRef<HTMLInputElement>(null) },
        { label: 'Left quarter', name: 'leftQuarter', ref: useRef<HTMLInputElement>(null) },
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
        if (!jobsCreated()) return;

        const groupId = jobs[0]?.groupId!;

        const unsubscribe = listenToCollectionByGroupId('jobs', user?.id!, groupId, async (querySnap: QuerySnapshot) => {
            await listener(querySnap);
        })

        return () => unsubscribe();
    }, [jobs]);

    useEffect(() => {
        jobsRef.current = jobs;
    }, [jobs]);

    const listener = async (querySnap: QuerySnapshot) => {
        for (const docSnap of querySnap.docs) {
            const job = docSnap.data() as InferenceJob;

            if (job.status === JobStatuses.completed && job.result?.mediaPath) {
                const downloadUrl = await getMediaUrlFromPath(job.result.mediaPath)
                job.result.mediaUrl = downloadUrl;
            }

            const currentJobs = jobsRef.current;
            const jobIndex = currentJobs.findIndex((item) => item?.id === job.id);
            const oldJob = currentJobs[jobIndex];

            if (oldJob && oldJob?.status !== job.status) {
                console.log(`job updated ${job.id} - "${oldJob.status}" status to status "${job.status}"`);
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
            const onlyIdPhotoJobs = fetchedJobs.filter((job: InferenceJob) => job.order! <= NUM_ID_PHOTOS);
            const enrichedJobs = await Promise.all(
                (onlyIdPhotoJobs as InferenceJob[]).map(async (job: InferenceJob) => {
                    const mediaUrl = job.result?.mediaPath
                        ? await getMediaUrlFromPath(job.result.mediaPath).catch(() => undefined)
                        : undefined;
                    return { ...job, result: { ...job.result, mediaUrl } };
                })
            );
            setJobs(enrichedJobs as InferenceJob[]);
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
        return `media/${user?.id}-user/avatars/${newAvatarData.avatarId}-avatar/images/uploaded/${name}-${CROP_SIZE[0]}x${CROP_SIZE[1]}.png`;
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
            const croppedResult = await getCroppedImg(tempImage, croppedAreaPixels, CROP_SIZE);
            updatePhotoAtIndex(activeIndex, croppedResult);
            closeEditor();
            await uploadToBucket(uploadedPhotosConfig[activeIndex].name, croppedResult);
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

    const setJob = (listIdx: number, job: InferenceJob | null) => {
        setJobs((prev: (InferenceJob | null)[]) => prev.map((oldJob, idx) => idx === listIdx ? job : oldJob));
    };

    const setGroupId = (groupId: string) => {
        setNewAvatarData((prev: NewAvatarData) => ({...prev, groupId}));
    }

    const setParameter = (key: string, value: string) => {
        setAvatar((avatar: Avatar) => ({...avatar, parameters: { ...avatar.parameters, [key]: value }}))
    }

    const uploadToBucket = async (name: string, image: string) => {
        const mediaPath = getUploadedMediaPath(name);
        await uploadMediaToBucket(mediaPath, image);
    }

    const jobsCreated = () => {
        return jobs.length > 0 && jobs.every(job => job !== null);
    }

    const createJobs = async () => {
        const emptyJobs = Array(NUM_ID_PHOTOS).fill(null);
        setJobs(emptyJobs);

        const payload: Partial<Avatar> = {
            parameters: avatar.parameters,
        };
        await updateAvatar(newAvatarData.avatarId, payload);

        const jobRequest: TrainingJobRequest = {
            avatarId: newAvatarData.avatarId,
            parameters: avatar.parameters
        }

        try {
            const jobs = await genTrainingTwinIdPhotos(jobRequest);
            setJobs(jobs as InferenceJob[]);
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
        setJob(listIdx, restartedJob as InferenceJob);
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
        return jobs.length > 0 && jobs.every((job: InferenceJob | null) => job && job.status === JobStatuses.completed);
    }

    const canProceed = () => {
        return generatingCompleted();
    };

    const stepLocked = () => {
        return Boolean(avatar.mainImagePath);
    }

    const nextStep = async () => {
        if (!canProceed) return

        try {
            if (!stepLocked()) {
                const payload: Partial<Avatar> = {
                    mainImagePath: jobs[0]?.result?.mediaPath
                };
                await updateAvatar(newAvatarData.avatarId, payload);
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

            {pageLoading ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <span className="loading loading-spinner loading-xl text-primary scale-150"></span>
                </div>
            ) : (
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
                        viewConfig={uploadedPhotosConfig}
                        uploadedPhotos={uploadedPhotos}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onFileUpload={handleFileUpload}
                        onRemovePhoto={(index) => updatePhotoAtIndex(index, null)}
                        removable={!stepLocked() && !generatingStarted()}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-12">
                        {[
                            { label: "Height", key: "height", opts: AVATAR_PARAMETER_OPTIONS.height },
                            { label: "Bust Size", key: "bustSize", opts: AVATAR_PARAMETER_OPTIONS.bustSize },
                            { label: "Body Hair", key: "bodyHair", opts: AVATAR_PARAMETER_OPTIONS.bodyHair },
                        ].map(field => (
                            <PillSelect
                                key={field.key}
                                label={field.label}
                                fieldKey={field.key}
                                opts={field.opts}
                                value={avatar.parameters[field.key as keyof typeof avatar.parameters]}
                                disabled={stepLocked()}
                                onChange={setParameter}
                            />
                        ))}
                    </div>

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

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {jobs.map((job, idx) => (
                            <PhotoCard
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