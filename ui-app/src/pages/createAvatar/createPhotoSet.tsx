import CreateAvatarStepper from "../../components/createAvatar/CreateAvatarStepper";
import { useNavigate } from 'react-router-dom';
import { Sparkles, User, Clock, Loader2, CircleAlert } from 'lucide-react';
import { useState, useEffect } from "react";
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
    const [generationInitialized, setGenerationInitialized] = useState(false);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    useEffect(() => {
        saveLocalStorageData<PhotoSetStepData>(PHOTO_SET_STORAGE_KEY, stepData);
    }, [stepData]);

    useEffect(() => {
        if (!generatingStarted()) return;

        const groupId = stepData.jobs[0]?.groupId!;

        const unsubscribe = listenToCollectionByGroupId('jobs', user?.id!, groupId, async (querySnap: QuerySnapshot) => {
            await listener(querySnap);
        })

        return () => unsubscribe();
    }, [stepData.jobs]);

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

    const setJobs = (jobs: Job[]) => {
        const neededJobData = jobs.map((job: Job) => {
            return {
                id: job.id, 
                status: job.status, 
                groupId: job.groupId,
                input: { height: job.input?.height, width: job.input?.width },
            }
        })
        setStepData((prev: PhotoSetStepData) => ({...prev, jobs: neededJobData}));
    }

    const setJob = (jobIndex: number, job: Partial<Job>) => {
        const { id, status, groupId, input, result } = job;

        const filteredJob = {
            id,
            status,
            groupId,
            input: input ? { height: input.height, width: input.width } : undefined,
            result: result ? { mediaPath: result.mediaPath, mediaUrl: result.mediaUrl } : undefined
        };

        setStepData((prev) => ({
            ...prev,
            jobs: prev.jobs.map((oldJob, idx) => idx === jobIndex ? filteredJob : oldJob)
        }));
    };

    const setFinished = () => {
        setStepData((prev: PhotoSetStepData) => ({...prev, finished: true}));
    }

    const createJobs = async () => {
        setGenerationInitialized(true);
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
        } finally {
            setGenerationInitialized(false);
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
                            <span className="text-[12px] font-bold uppercase tracking-[0.4em] text-primary">
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
            return (
                <div className="flex relative rounded-[1rem] border border-base-content/10 bg-base-200/30 flex-col items-center justify-center min-h-[200px] overflow-hidden group py-8">
                    <img
                        key={job.result?.mediaUrl}
                        src={job.result?.mediaUrl}
                        className="absolute inset-0 w-full h-full object-cover transition-all duration-700 z-0 rounded-[1rem]"
                        alt="Generated"
                    />
                </div>
            );
        }
    }

    return ( 
        <>
            <CreateAvatarStepper step={2}/>

            <div className="max-w-6xl mx-auto px-4 pt-12 mb-30">

                <div className="flex justify-center w-full mb-8">
                    <button
                        onClick={createJobs}
                        disabled={generatingStarted() || stepData.finished || generationInitialized}
                        className={`btn btn-primary btn-dash group relative w-full max-w-md h-14 mt-8 rounded-2xl transition-all duration-500 hover:scale-[1.01] ${stepData.finished ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    >   
                        {((generatingStarted() && !generatingCompleted()) || generationInitialized) && <span className="loading loading-spinner"></span>}
                        <span className="text-sm uppercase tracking-[0.4em]">Generate Photo Set</span>
                        
                        <Sparkles 
                            size={20} 
                            className="ml-2 group-hover:rotate-12 transition-transform" 
                        />
                    </button>
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
        </>
    );
}

export default CreatePhotoSetPage;