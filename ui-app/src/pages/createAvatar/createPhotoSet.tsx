import CreateAvatarStepper from "../../components/createAvatar/CreateAvatarStepper";
import { useNavigate } from 'react-router-dom';
import { Sparkles, User, Clock, Loader2, CircleAlert } from 'lucide-react';
import { useState, useEffect, useRef } from "react";
import { JobStatuses, type Job, type JobRequest } from "../../types/job";
import { createPhotoSetJobs } from "../../services/apiGateway";
import { 
    ID_PHOTO_STORAGE_KEY, 
    GENERAL_STORAGE_KEY,  
    PHOTO_SET_STORAGE_KEY, 
    getLocalStorageData,
    saveLocalStorageData
} from '../../utils/avatarCreation';
import BottomDock from "../../components/createAvatar/BottomDock";
import { listenToDocChanges, listenToCollectionByGroupId } from '../../services/db';
import type { DocumentSnapshot, QuerySnapshot } from 'firebase/firestore';
import { getMediaUrlFromPath } from '../../services/storage';
import { useApp } from '../../providers/ContextProvider';
import { type IdPhotoStepData, type GeneralStepData, type PhotoSetStepData  } from "../../types/avatarCreation";
import { type Media, MediaTypes, MediaSections } from "../../types/media";
import { createMedia, updateAvatar } from '../../services/apiGateway';
import { type Avatar, AvatarStatus } from "../../types/avatar";


function CreatePhotoSetPage() {
    const navigate = useNavigate();
    const { user } = useApp();

    const generalData = getLocalStorageData<GeneralStepData>(GENERAL_STORAGE_KEY);
    const idPhotoData = getLocalStorageData<IdPhotoStepData>(ID_PHOTO_STORAGE_KEY)

    const [stepData, setStepData] = useState(() => getLocalStorageData<PhotoSetStepData>(PHOTO_SET_STORAGE_KEY));
    const [avgSimilarity, setAvgSimilarity] = useState(0);
    
    // ── New: state for fullscreen modal ────────────────────────────────
    const [fullscreenSrc, setFullscreenSrc] = useState<string | null>(null);

    const initialized = useRef<boolean>(false);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });

        const initialize = () => {
            if (initialized.current) return;
            initialized.current = true;

            if (stepData.jobs.every((job: Partial<Job> | null) => job === null)) {
                console.log("create jobs")
                createJobs();
            } else {
                console.log(stepData.jobs);
                setJobs(stepData.jobs);
                console.log("update jobs")
            }
        };

        initialize();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') initialize();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    useEffect(() => {
        saveLocalStorageData<PhotoSetStepData>(PHOTO_SET_STORAGE_KEY, stepData);
    }, [stepData]);

    useEffect(() => {
        if (!generatingStarted()) return 

        console.log("jobs updated")

        const groupId = stepData.jobs[0]?.groupId!;

        const unsubscribe = listenToCollectionByGroupId('jobs', user?.id!, groupId, async (querySnap: QuerySnapshot) => {
            await listener(querySnap);
        })

        const sumSimilarities = stepData.jobs.reduce((acc, job) => {
            return acc + (job?.result?.maxSimilarity && job?.result?.maxSimilarity > 0 ? job?.result?.maxSimilarity : 0);
        }, 0);
        const countSimilarities = stepData.jobs.filter(job => job?.result?.maxSimilarity && job?.result?.maxSimilarity > 0).length;

        setAvgSimilarity(countSimilarities > 0 ? sumSimilarities / countSimilarities : 0);

        return () => unsubscribe();
    }, [stepData.jobs]);

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

    const listener = async (querySnap: QuerySnapshot) => {
        console.log(`listener triggered`)

        for (const docSnap of querySnap.docs) {
            const job = docSnap.data() as Job;

            if (job.status === JobStatuses.completed && job.result?.mediaPath) {
                const downloadUrl = await getMediaUrlFromPath(job.result.mediaPath)
                job.result.mediaUrl = downloadUrl;
            }

            const jobIndex = stepData.jobs.findIndex((item) => item?.id === job.id);
            const oldJob = stepData.jobs[jobIndex];

            if (oldJob?.status !== job.status) {
                console.log(`job updated ${JSON.stringify(job)}`)
                setJob(jobIndex, job);
            }
        }
    }

    const generatingStarted = () => {
        return stepData.jobs[0] !== null;
    }

    const generatingCompleted = () => {
        const lastJob = stepData.jobs[stepData.jobs.length - 1];
        return lastJob && lastJob.status === JobStatuses.completed;
    }

    const canProceed = () => {
        return stepData.jobs.every((job: Partial<Job> | null) => job && job.status === JobStatuses.completed);
    };

    const filterJobData = (job: Job | (Partial<Job> | null)): Partial<Job> | null  => {
        if (!job) return null;

        const { id, status, groupId, order, input, result } = job;

        return {
            id,
            status,
            groupId,
            order,
            input: input ? { height: input.height, width: input.width } : undefined,
            result: result ? { mediaPath: result.mediaPath, mediaUrl: result.mediaUrl, maxSimilarity: result.maxSimilarity } : undefined
        };
    }

    const setJobs = (jobs: Job[] | (Partial<Job> | null)[]) => {
        const neededJobData = jobs.map((job: Job | (Partial<Job> | null)) => {
            return job ? filterJobData(job) : null;
        })
        setStepData((prev: PhotoSetStepData) => ({...prev, jobs: neededJobData}));
    }

    const setJob = (jobIndex: number, job: Partial<Job>) => {
        const filteredJob = filterJobData(job);

        setStepData((prev) => ({
            ...prev,
            jobs: prev.jobs.map((oldJob, idx) => idx === jobIndex ? filteredJob : oldJob)
        }));
    };

    const setFinished = () => {
        setStepData((prev: PhotoSetStepData) => ({...prev, finished: true}));
    }

    const createJobs = async () => {
        const job: JobRequest = {
            avatarId: generalData.avatarId,
            input: {
                gender: generalData.gender,
                idPhotoPaths: idPhotoData.idPhotoPaths,
                parameters: idPhotoData.parameters
            }
        }

        try {
            const jobs = await createPhotoSetJobs(job);
            setJobs(jobs);
        } catch (error) {
            console.log('Failed to create jobs for photo set')
        }
    }

    const nextStep = async () => {
        if (!canProceed) return;

        try {
            if (!stepData.finished) {
                const media: Media = {
                    userId: user?.id!,
                    avatarId: generalData.avatarId,
                    jobId: '',
                    type: MediaTypes.image,
                    section: MediaSections.avatar,
                    isRemovable: false,
                    isIdPhoto: false,
                    isPhotoSet: true,
                    path: '',
                    dimensions: '1024x1024',
                    upscaled: false,
                    order: 0,
                }

                let allMedia: Media[] = [];

                for (const [idx, job] of stepData.jobs.entries()) {
                    allMedia.push({
                        ...media, 
                        jobId: job?.id!, 
                        path: job?.result?.mediaPath!,
                        dimensions: `${job?.input?.height}x${job?.input?.width}`,
                        order: idx
                    })
                }

                await Promise.all(allMedia.map((media: Media) => createMedia(media)));

                const payload: Partial<Avatar> = {
                    status: AvatarStatus.photosetCreated, 
                };
                await updateAvatar(generalData.avatarId, payload);

                setFinished()
            }
        } catch (error) {
            console.log(`Did not manage to create a new media: ${error}`);
        }

        navigate('/avatar/create/assign-voice');
    }

    const previousStep = () => {
        navigate('/avatar/create/id-photo');
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
                <div className="flex relative rounded-[1rem] border border-dashed border-base-content/10 bg-transparent items-center justify-center min-h-[200px] py-8">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-15 h-15 rounded-2xl border border-base-content/5 bg-base-content/[0.01] flex items-center justify-center">
                            <User size={27} strokeWidth={0.5} className="text-base-content/10" />
                        </div>

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
                <div className="flex relative rounded-[1rem] border border-primary/20 bg-primary/[0.02] flex flex-col items-center justify-center min-h-[200px] py-8">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="w-15 h-15 rounded-2xl border border-base-content/5 flex items-center justify-center animate-pulse">
                                <Clock size={27} strokeWidth={0.5} className="text-base-content/30" />
                            </div>
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
                <div className="flex relative rounded-[1rem] border border-primary/20 bg-primary/[0.02] flex flex-col items-center justify-center min-h-[200px] py-8">
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
                <div className="flex relative rounded-[1rem] border border-error/20 bg-error/[0.02] flex flex-col items-center justify-center min-h-[200px] py-8">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="w-15 h-15 rounded-full border border-base-content/5 flex items-center justify-center animate-pulse">
                                <CircleAlert size={27} strokeWidth={0.5} className="text-base-content/30" />
                            </div>
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
                </div>
            );
        }

        if (job.status === JobStatuses.completed) {
            const url = job.result?.mediaUrl;
            const maxSimilarity = job.result?.maxSimilarity || 0;

            if (!url) {
                return (
                    <div className="relative rounded-[1rem] border border-base-content/10 bg-base-200/30 min-h-[200px]" />
                );
            }

            return (
                <div
                    className="group relative rounded-[1rem] border border-base-content/10 bg-base-200/30 overflow-hidden cursor-pointer min-h-[200px]"
                    onClick={() => setFullscreenSrc(url)}
                    >
                    <img
                        src={url}
                        alt={`Generated avatar photo ${idx + 1}`}
                        className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:opacity-90"
                    />

                    <div className="absolute top-1 left-1 z-10">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-[0.8rem] shadow-lg text-white text-xs font-medium">
                            <span className="font-bold">{job.order}</span>
                        </div>
                    </div>

                    {maxSimilarity > 0 && (
                        <div className="absolute bottom-1 right-1 z-10">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-[0.8rem] shadow-lg text-white text-xs font-medium">
                                <span className="font-bold">
                                    {(maxSimilarity * 100).toFixed(0)}%
                                </span>

                                <div
                                    className={`w-2 h-2 rounded-full ${
                                        maxSimilarity >= 0.7
                                        ? 'bg-green-400'
                                        : maxSimilarity >= 0.6
                                        ? 'bg-yellow-400'
                                        : maxSimilarity >= 0.55
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
            <CreateAvatarStepper step={2}/>

            <div className="max-w-6xl mx-auto px-4 pt-12 mb-30">

                <div className="flex justify-center w-full mb-8 items-center gap-8">
                    <div className="mt-8">
                        <div className="inline-flex items-center gap-2.5 px-5 py-3 rounded-[1em] bg-base-200/40 backdrop-blur-md border border-base-content/8 shadow-sm">
                            <span className="text-xs font-medium uppercase tracking-[0.14em] text-base-content/60">
                                AVG Match
                            </span>
                            <span className="text-2xl font-semibold text-primary tabular-nums">
                                {(avgSimilarity * 100).toFixed(0)}%
                            </span>
                            <div
                                className={`w-2 h-2 rounded-full ${
                                    avgSimilarity >= 0.7
                                    ? 'bg-green-400'
                                    : avgSimilarity >= 0.6
                                    ? 'bg-yellow-400'
                                    : avgSimilarity >= 0.5
                                    ? 'bg-orange-400'
                                    : 'bg-red-400'
                                }`}
                            />
                        </div>
                    </div>
                </div>

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

            {/* ── Fullscreen modal ──────────────────────────────────────── */}
            <FullscreenModal />
        </>
    );
}

export default CreatePhotoSetPage;