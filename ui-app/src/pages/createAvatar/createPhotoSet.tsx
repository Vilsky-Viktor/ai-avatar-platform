import CreateAvatarStepper from "../../components/createAvatar/CreateAvatarStepper";
import { useNavigate } from 'react-router-dom';
import { Sparkles, User, Clock, Loader2, CircleOff, RefreshCcw } from 'lucide-react';
import { useState, useEffect, useRef } from "react";
import { JobStatuses, type Job, type TrainingJobRequest } from "../../types/job";
import { genTrainingPhotoSet, restartJobById, updateAvatar } from "../../services/apiGateway";
import {
    ID_PHOTO_STORAGE_KEY,
    GENERAL_STORAGE_KEY,
    PHOTO_SET_STORAGE_KEY,
    getLocalStorageData,
    saveLocalStorageData,
} from '../../utils/avatarCreation';
import BottomDock from "../../components/createAvatar/BottomDock";
import { listenToCollectionByGroupId } from '../../services/db';
import type { QuerySnapshot } from 'firebase/firestore';
import { getMediaUrlFromPath } from '../../services/storage';
import { useApp } from '../../providers/ContextProvider';
import { type IdPhotoStepData, type GeneralStepData, type PhotoSetStepData  } from "../../types/avatarCreation";
import { type Avatar, AvatarStatus, AvatarTypes } from "../../types/avatar";


function CreatePhotoSetPage() {
    const navigate = useNavigate();
    const { user } = useApp();

    const generalData = getLocalStorageData<GeneralStepData>(GENERAL_STORAGE_KEY);
    const idPhotoData = getLocalStorageData<IdPhotoStepData>(ID_PHOTO_STORAGE_KEY)
    const [stepData, setStepData] = useState(() => getLocalStorageData<PhotoSetStepData>(PHOTO_SET_STORAGE_KEY));
    const [fullscreenSrc, setFullscreenSrc] = useState<string | null>(null);

    const initialized = useRef<boolean>(false);
    const jobsRef = useRef(stepData.jobs);
    useEffect(() => { jobsRef.current = stepData.jobs; }, [stepData.jobs]);
    const restartingJobIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });

        const initialize = () => {
            if (initialized.current) return;
            initialized.current = true;

            if (stepData.jobs.every((job: Job | null) => job === null)) {
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
        if (!jobsCreated()) return;

        console.log("jobs updated")

        const groupId = stepData.jobs[0]?.groupId!;

        const unsubscribe = listenToCollectionByGroupId('jobs', user?.id!, groupId, async (querySnap: QuerySnapshot) => {
            await listener(querySnap);
        })

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

    const generatingCompleted = () => {
        return stepData.jobs.length > 0 && stepData.jobs.every((job: Job | null) => job && job.status === JobStatuses.completed);
    }

    const canProceed = () => {
        return generatingCompleted();
    };

    const setJobs = (jobs: (Job | null)[]) => {
        setStepData((prev: PhotoSetStepData) => ({...prev, jobs}));
    }

    const setJob = (listIdx: number, job: Job | null) => {
        setStepData((prev) => ({
            ...prev,
            jobs: prev.jobs.map((oldJob, idx) => idx === listIdx ? job : oldJob)
        }));
    };

    const setFinished = () => {
        setStepData((prev: PhotoSetStepData) => ({...prev, finished: true}));
    }

    const jobsCreated = () => {
        return stepData.jobs.length > 0 && stepData.jobs.every(job => job !== null);
    }

    const createJobs = async () => {
        const emptyJobs = Array(34).fill(null);
        setJobs(emptyJobs);

        const job: TrainingJobRequest = {
            groupId: idPhotoData.jobs[0]?.groupId,
            avatarId: generalData.avatarId,
            parameters: generalData.parameters,
        }

        try {
            const jobs = await genTrainingPhotoSet(job);
            setJobs(jobs);
        } catch (error) {
            console.log('Failed to create jobs for photo set')
        }
    }

    const restartJob = async (jobId: string, listIdx: number) => {
        restartingJobIds.current.add(jobId);
        setJob(listIdx, null);
        const restartedJob = await restartJobById(jobId);
        setJob(listIdx, restartedJob);
    }

    const nextStep = async () => {
        if (!canProceed) return;

        try {
            if (!stepData.finished) {
                const payload: Partial<Avatar> = {
                    status: AvatarStatus.photosetCreated, 
                };

                await updateAvatar(generalData.avatarId, payload);

                setFinished()
            }

            navigate('/avatar/create/assign-voice');
        } catch (error) {
            console.log(`Did not manage to update avatar: ${error}`);
        }
    }

    const previousStep = () => {
        if (generalData.type === AvatarTypes.digitalTwin) {
            navigate('/avatar/create/twin-id-photos');
        } else {
            navigate('/avatar/create/synthetic-id-photos');
        }
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
            <CreateAvatarStepper step={2}/>

            <div className="max-w-6xl mx-auto px-4 pt-12 mb-50">
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
    );
}

export default CreatePhotoSetPage;