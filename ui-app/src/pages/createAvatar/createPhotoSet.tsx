import CreateAvatarStepper from "../../components/createAvatar/CreateAvatarStepper";
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from "react";
import { JobStatuses, type Job, type TrainingJobRequest } from "../../types/job";
import { genTrainingPhotoSet, restartJobById, updateAvatar } from "../../services/apiGateway";
import FullscreenModal from "../../components/createAvatar/FullscreenModal";
import JobPhotoCard from "../../components/createAvatar/JobPhotoCard";
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
    }, [])

    useEffect(() => {
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

        const jobRequest: TrainingJobRequest = {
            avatarType: generalData.type,
            groupId: idPhotoData.jobs[0]?.groupId,
            avatarId: generalData.avatarId,
            parameters: generalData.parameters,
        }

        try {
            const jobs = await genTrainingPhotoSet(jobRequest);
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

    return (
        <>
            <CreateAvatarStepper step={2}/>

            <div className="max-w-6xl mx-auto px-4 pt-12 mb-50">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {stepData.jobs.map((job, idx) => (
                        <JobPhotoCard
                            key={idx}
                            job={job}
                            idx={idx}
                            onPhotoClick={setFullscreenSrc}
                            onRetry={(i) => { const j = jobsRef.current[i]; if (j?.id) restartJob(j.id, i); }}
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
    );
}

export default CreatePhotoSetPage;