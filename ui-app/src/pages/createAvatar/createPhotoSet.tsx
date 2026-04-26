import CreateAvatarStepper from "../../components/createAvatar/CreateAvatarStepper";
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from "react";
import { JobStatuses, type InferenceJob, type TrainingJobRequest } from "../../types/job";
import { genTrainingPhotoSet, restartJobById, updateAvatar, getAvatarById, getJobsByGroupId } from "../../services/apiGateway";
import FullscreenModal from "../../components/createAvatar/FullscreenModal";
import PhotoCard from "../../components/PhotoCard";
import {
    initialAvatarData,
    getAvatarData,
    NUM_ID_PHOTOS,
    NUM_PHOTO_SET_PHOTOS
} from '../../utils/avatarCreation';
import BottomDock from "../../components/createAvatar/BottomDock";
import { listenToCollectionByGroupId } from '../../services/db';
import type { QuerySnapshot } from 'firebase/firestore';
import { getMediaUrlFromPath } from '../../services/storage';
import { useApp } from '../../providers/ContextProvider';
import { type Avatar, AvatarTypes } from "../../types/avatar";
import { scrollToTop } from '../../utils/scroller';


function CreatePhotoSetPage() {
    const navigate = useNavigate();
    const { user } = useApp();

    const [newAvatarData, _] = useState(() => getAvatarData());
    const [avatar, setAvatar] = useState(initialAvatarData);
    const [pageLoading, setPageLoading] = useState(true);

    const [jobs, setJobs] = useState([] as (InferenceJob | null)[]);
    const jobsRef = useRef<(InferenceJob | null)[]>([]);

    const [fullscreen, setFullscreen] = useState<{ src: string; rect: DOMRect } | null>(null);
    const initialized = useRef<boolean>(false);

    useEffect(() => {
        scrollToTop();
    }, [])

    useEffect(() => {
        initPage();
    }, []);

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
                console.log(`job updated ${job.id} - "${oldJob.status}" status to status "${job.status}"`)
                setJob(jobIndex, job);
            }
        }
    }

    const initPage = async () => {
        if (initialized.current) return;
        initialized.current = true;

        const existingAvatar = await getAvatarById(newAvatarData.avatarId);
        setAvatar(existingAvatar);

        const fetchedJobs = await getJobsByGroupId(newAvatarData.groupId);

        if (fetchedJobs.length >= NUM_PHOTO_SET_PHOTOS) {
            const onlyPhotoSetJobs = fetchedJobs.filter((job: InferenceJob) => job.order! > NUM_ID_PHOTOS);
            const enrichedJobs = await Promise.all(
                onlyPhotoSetJobs.map(async (job: InferenceJob) => {
                    const mediaUrl = job.result?.mediaPath
                        ? await getMediaUrlFromPath(job.result.mediaPath).catch(() => undefined)
                        : undefined;
                    return { ...job, result: { ...job.result, mediaUrl } };
                })
            );
            setJobs(enrichedJobs as InferenceJob[]);
        } else {
            await createJobs(existingAvatar);
        }

        setPageLoading(false);
    }

    const generatingCompleted = () => {
        return jobs.length > 0 && jobs.every((job: InferenceJob | null) => job && job.status === JobStatuses.completed);
    }

    const canProceed = () => {
        return generatingCompleted();
    };

    const setJob = (listIdx: number, job: InferenceJob | null) => {
        setJobs((prev: (InferenceJob | null)[]) => prev.map((oldJob, idx) => idx === listIdx ? job : oldJob));
    };

    const jobsCreated = () => {
        return jobs.length > 0 && jobs.every(job => job !== null);
    }

    const createJobs = async (avatarData: Avatar = avatar) => {
        const emptyJobs = Array(NUM_PHOTO_SET_PHOTOS).fill(null);
        setJobs(emptyJobs);

        const jobRequest: TrainingJobRequest = {
            avatarType: avatarData.type,
            groupId: newAvatarData.groupId,
            avatarId: newAvatarData.avatarId,
            parameters: avatarData.parameters,
        }

        try {
            const jobs = await genTrainingPhotoSet(jobRequest);
            setJobs(jobs as InferenceJob[]);
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
    }

    const stepLocked = () => {
        return avatar.photoSetGenerated;
    }

    const nextStep = async () => {
        if (!canProceed) return;

        try {
            if (!stepLocked()) {
                const payload: Partial<Avatar> = {
                    photoSetGenerated: true,
                };

                await updateAvatar(newAvatarData.avatarId, payload);
            }

            navigate('/avatar/create/assign-voice');
        } catch (error) {
            console.log(`Did not manage to update avatar: ${error}`);
        }
    }

    const previousStep = () => {
        if (avatar.type === AvatarTypes.digitalTwin) {
            navigate('/avatar/create/twin-id-photos');
        } else {
            navigate('/avatar/create/synthetic-id-photos');
        }
    }

    return (
        <>
            <CreateAvatarStepper step={2}/>

            {pageLoading ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <span className="loading loading-spinner loading-xl text-primary scale-150"></span>
                </div>
            ) : (
                <div className="max-w-6xl mx-auto px-4 pt-12 mb-50">
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
    );
}

export default CreatePhotoSetPage;
