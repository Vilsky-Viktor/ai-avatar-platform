import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateAvatarStepper from "../../components/createAvatar/CreateAvatarStepper";
import { Sparkles, User, Trash2, X, Check, Minus, Plus, Clock, Loader2, CircleAlert, RefreshCcw, ChevronDown, CircleOff } from 'lucide-react';
import { AvatarStatus, type Avatar } from '../../types/avatar';
import { updateAvatar, restartJobById, genTrainingIdPhotos } from '../../services/apiGateway';
import { JobStatuses, type Job, type TrainingJobRequest } from '../../types/job';
import { useApp } from '../../providers/ContextProvider';
import { 
    GENERAL_STORAGE_KEY,  
    ID_PHOTO_STORAGE_KEY, 
    getLocalStorageData,
    saveLocalStorageData,
    initialUploadedIdPhotoSet,
    AVATAR_PARAMETER_OPTIONS
} from '../../utils/avatarCreation';
import BottomDock from '../../components/createAvatar/BottomDock';
import { type IdPhotoStepData, type GeneralStepData, type UploadedIdPhoto } from "../../types/avatarCreation";
import type { QuerySnapshot } from 'firebase/firestore';
import { getMediaUrlFromPath } from '../../services/storage';
import { listenToCollectionByGroupId } from '../../services/db';
import { type AvatarParameters } from "../../types/avatar";


function CreateSyntheticIdPhotosPage() {
    const navigate = useNavigate();
    const { user } = useApp();

    const [generalData, setGeneralData] = useState(() => getLocalStorageData<GeneralStepData>(GENERAL_STORAGE_KEY))
    const [stepData, setStepData] = useState(() => getLocalStorageData<IdPhotoStepData>(ID_PHOTO_STORAGE_KEY))
    const [fullscreenSrc, setFullscreenSrc] = useState<string | null>(null);
    const jobsRef = useRef(stepData.jobs);
    useEffect(() => { jobsRef.current = stepData.jobs; }, [stepData.jobs]);
    const restartingJobIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    useEffect(() => {
        saveLocalStorageData<IdPhotoStepData>(ID_PHOTO_STORAGE_KEY, stepData);
    }, [stepData]);

    useEffect(() => {
        saveLocalStorageData<GeneralStepData>(GENERAL_STORAGE_KEY, generalData)
    }, [generalData]);

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

    const setJobs = (jobs: (Job | null)[]) => {
        setStepData((prev: IdPhotoStepData) => ({...prev, jobs}));
    }

    const setJob = (listIdx: number, job: Job | null) => {
        setStepData((prev: IdPhotoStepData) => ({
            ...prev,
            jobs: prev.jobs.map((oldJob, idx) => idx === listIdx ? job : oldJob)
        }));
    };

    const setParameters = (parameters: AvatarParameters) => {
        setGeneralData((prev: GeneralStepData) => ({...prev, parameters}));
    }

    const setFinished = () => {
        setStepData((prev: IdPhotoStepData) => ({...prev, finished: true}));
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
            const jobs = await genTrainingIdPhotos(jobRequest);
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

    const generatingStarted = () => {
        return stepData.jobs.length > 0;
    }

    const generatingCompleted = () => {
        return stepData.jobs.length > 0 && stepData.jobs.every((job: Job | null) => job && job.status === JobStatuses.completed);
    }

    const parametersFilled = () => {
        return Object.values(generalData.parameters).every((value) => value !== '');
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
                <div className="grid grid-cols-3 gap-8">
                    {[
                        { label: "Ethnicity", key: "ethnicity", opts: AVATAR_PARAMETER_OPTIONS.ethnicity },
                        { label: "Skin Color", key: "skinColor", opts: AVATAR_PARAMETER_OPTIONS.skinColor },
                        { label: "Age", key: "age", opts: AVATAR_PARAMETER_OPTIONS.age },
                        { label: "Attractiveness", key: "attractiveness", opts: AVATAR_PARAMETER_OPTIONS[generalData.parameters.gender].attractiveness },
                        { label: "Face", key: "face", opts: AVATAR_PARAMETER_OPTIONS[generalData.parameters.gender].face },
                        { label: "Hair Style", key: "hairStyle", opts: AVATAR_PARAMETER_OPTIONS[generalData.parameters.gender].hairStyle },
                        { label: "Hair Color", key: "hairColor", opts: AVATAR_PARAMETER_OPTIONS[generalData.parameters.gender].hairColor },
                        { label: "Ears", key: "ears", opts: AVATAR_PARAMETER_OPTIONS.ears },
                        { label: "Nose", key: "nose", opts: AVATAR_PARAMETER_OPTIONS.nose },
                        { label: "Lips", key: "lips", opts: AVATAR_PARAMETER_OPTIONS.lips },
                        { label: "Eyes", key: "eyes", opts: AVATAR_PARAMETER_OPTIONS.eyes }, // Fixed the typo here
                        { label: "Eye Lashes", key: "eyeLashes", opts: AVATAR_PARAMETER_OPTIONS.eyeLashes },
                        { label: "Eye Brows", key: "eyeBrows", opts: AVATAR_PARAMETER_OPTIONS.eyeBrows },
                        { label: "Skin", key: "skin", opts: AVATAR_PARAMETER_OPTIONS[generalData.parameters.gender].skin },
                        { label: "Facial Hair", key: "facialHair", opts: AVATAR_PARAMETER_OPTIONS[generalData.parameters.gender].facialHair },
                    ].map((field) => (
                        <div key={field.key} className={`group flex flex-col gap-0.5 ${stepData.finished ? 'opacity-50' : 'opacity-100'}`}>
                            <label className="text-[10px] font-medium uppercase tracking-[0.3em] text-base-content/20">
                                {field.label}
                            </label>

                            <div className="relative">
                                <select
                                    value={generalData.parameters[field.key as keyof typeof generalData.parameters]}
                                    disabled={stepData.finished}
                                    onChange={(e) => setParameters({...generalData.parameters, [field.key]: e.target.value})}
                                    className="w-full py-1.5 bg-transparent border-b border-base-content/10 focus:border-primary transition-all duration-500 outline-none text-base font-medium tracking-tight appearance-none cursor-pointer pr-8"
                                >
                                    <option value="" disabled>Select</option>
                                    {field.opts.map(o => <option key={o} value={o}>{o}</option>)}

                                </select>

                                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-base-content/20 group-hover:text-primary transition-colors">
                                    <ChevronDown size={16} strokeWidth={2.5} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {parametersFilled() && (
                    <div className='text-center'>
                        <button
                            onClick={createJobs}
                            disabled={generatingStarted() || stepData.finished}
                            className={`btn btn-primary btn-dash group relative px-12 py-8 my-12 rounded-2xl transition-all duration-500 hover:scale-[1.01] ${stepData.finished || generatingStarted() ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                            {((generatingStarted() && !generatingCompleted())) && <span className="loading loading-spinner mr-2"></span>}
                            <span className="text-sm uppercase tracking-[0.4em]">Generate ID Photos</span>
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

export default CreateSyntheticIdPhotosPage;