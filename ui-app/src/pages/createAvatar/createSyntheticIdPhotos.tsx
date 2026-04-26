import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateAvatarStepper from "../../components/createAvatar/CreateAvatarStepper";
import { ChevronDown } from 'lucide-react';
import FullscreenModal from "../../components/createAvatar/FullscreenModal";
import PhotoCard from "../../components/PhotoCard";
import { type Avatar } from '../../types/avatar';
import { updateAvatar, restartJobById, genTrainingSyntheticIdPhotos, genTrainingSyntheticFrontIdPhoto, getAvatarById, getJobsByGroupId } from '../../services/apiGateway';
import { JobStatuses, type InferenceJob, type TrainingJobRequest } from '../../types/job';
import { useApp } from '../../providers/ContextProvider';
import { 
    AVATAR_PARAMETER_OPTIONS,
    getAvatarData,
    initialAvatarData,
    saveAvatarData,
    NUM_ID_PHOTOS
} from '../../utils/avatarCreation';
import BottomDock from '../../components/createAvatar/BottomDock';
import { type NewAvatarData } from "../../types/avatarCreation";
import type { QuerySnapshot } from 'firebase/firestore';
import { getMediaUrlFromPath } from '../../services/storage';
import { listenToCollectionByGroupId } from '../../services/db';
import { scrollToTop, scrollToBottom } from '../../utils/scroller';
import PillSelect from '../../components/PillSelect';

function CreateSyntheticIdPhotosPage() {
    const navigate = useNavigate();
    const { user } = useApp();

    const [newAvatarData, setNewAvatarData] = useState(() => getAvatarData());
    const [avatar, setAvatar] = useState(initialAvatarData);
    const [pageLoading, setPageLoading] = useState(true);

    const [jobs, setJobs] = useState([] as (InferenceJob | null)[]);
    const jobsRef = useRef<(InferenceJob | null)[]>([]);

    const [fullscreen, setFullscreen] = useState<{ src: string; rect: DOMRect } | null>(null);
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({ general: true });

    const toggleSection = (key: string) => setOpenSections(prev => ({ [key]: !prev[key] }));

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
                console.log(`job updated ${job.id} - "${oldJob.status}" status to status "${job.status}"`)
                setJob(jobIndex, job);
            }
        }
    }

    const initPage = async () => {
        const existingAvatar = await getAvatarById(newAvatarData.avatarId);
        const gender = existingAvatar.parameters.gender;
        const defaults: Record<string, string> = {
            ethnicity: 'northern european',
            age: '20s',
            height: 'average',
            attractiveness: gender === 'female' ? 'beautiful' : 'handsome',
            body: 'average',
            face: 'oval',
            hairStyle: gender === 'female' ? 'long straight' : 'short cut',
            hairColor: 'dark brown',
            skinColor: 'fair',
            bustSize: 'medium',
            bodyHair: 'none',
            skin: 'smooth',
            eyes: 'dark brown',
            eyeLashes: 'medium natural',
            eyeBrows: 'medium natural',
            ears: 'attached',
            nose: 'medium straight',
            lips: 'full',
            facialHair: gender === 'female' ? 'none' : 'clean-shaven',
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
        setPageLoading(false);
    }

    const setJob = (listIdx: number, job: InferenceJob | null) => {
        setJobs((prev: (InferenceJob | null)[]) => prev.map((oldJob, idx) => idx === listIdx ? job : oldJob));
    };

    const setParameter = (key: string, value: string) => {
        setAvatar((avatar: Avatar) => ({...avatar, parameters: { ...avatar.parameters, [key]: value }}))
    }

    const setGroupId = (groupId: string) => {
        setNewAvatarData((prev: NewAvatarData) => ({...prev, groupId}));
    }

    const jobsCreated = () => {
        return jobs.length > 0 && jobs.every(job => job !== null);
    }

    const createFrontJob = async () => {
        setJobs([null]);

        const payload: Partial<Avatar> = {
            parameters: avatar.parameters,
        };
        await updateAvatar(newAvatarData.avatarId, payload);

        const jobRequest: TrainingJobRequest = {
            avatarId: newAvatarData.avatarId,
            parameters: avatar.parameters
        }

        try {
            const job = await genTrainingSyntheticFrontIdPhoto(jobRequest);
            setJobs([job as InferenceJob]);
            setGroupId(job.groupId!);
            setTimeout(() => scrollToBottom(), 500);
        } catch (error) {
            console.log('Failed to create front job for id photos')
        }
    }

    const createJobs = async () => {
        const emptyJobs = Array(NUM_ID_PHOTOS - 1).fill(null);
        setJobs([...jobsRef.current, ...emptyJobs]);

        const jobRequest: TrainingJobRequest = {
            groupId: newAvatarData.groupId,
            avatarId: newAvatarData.avatarId,
            parameters: avatar.parameters
        }

        try {
            const newJobs = await genTrainingSyntheticIdPhotos(jobRequest);
            const frontJob = jobsRef.current[0];

            setJobs([frontJob, ...(newJobs as InferenceJob[])]);
            setTimeout(() => scrollToBottom(), 500);
        } catch (error) {
            console.log('Failed to create jobs for id photos')
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

    const generatingStarted = () => {
        return jobs.length > 0;
    }

    const generatingCompleted = () => {
        return jobs.length > 0 && jobs.every((job: InferenceJob | null) => job && job.status === JobStatuses.completed);
    }

    const isFrontJob = (idx: number) => {
        return idx === 0;
    }

    const onlyFrontJobCompleted = () => {
        return jobs.length === 1 && jobs[0]?.status === JobStatuses.completed;
    }

    const allJobsStarted = () => {
        return jobs.length === NUM_ID_PHOTOS && jobs.every(job => job !== null);
    }

    const parametersFilled = () => {
        return Object.values(avatar.parameters).every(v => v !== '');
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
                    mainImagePath: jobs[0]?.result?.mediaPath,
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
                    <div className="flex flex-col gap-2">
                        {([
                            {
                                key: 'general',
                                label: 'General',
                                fields: [
                                    { label: "Ethnicity", key: "ethnicity", opts: AVATAR_PARAMETER_OPTIONS.ethnicity },
                                    { label: "Age", key: "age", opts: AVATAR_PARAMETER_OPTIONS.age },
                                    { label: "Height", key: "height", opts: AVATAR_PARAMETER_OPTIONS.height },
                                    { label: "Attractiveness", key: "attractiveness", opts: AVATAR_PARAMETER_OPTIONS[avatar.parameters.gender].attractiveness },
                                    { label: "Body", key: "body", opts: AVATAR_PARAMETER_OPTIONS[avatar.parameters.gender].body },
                                ],
                            },
                            {
                                key: 'face',
                                label: 'Face',
                                fields: [
                                    { label: "Face", key: "face", opts: AVATAR_PARAMETER_OPTIONS[avatar.parameters.gender].face },
                                    { label: "Eyes", key: "eyes", opts: AVATAR_PARAMETER_OPTIONS.eyes },
                                    { label: "Eye Lashes", key: "eyeLashes", opts: AVATAR_PARAMETER_OPTIONS.eyeLashes },
                                    { label: "Eye Brows", key: "eyeBrows", opts: AVATAR_PARAMETER_OPTIONS.eyeBrows },
                                    { label: "Ears", key: "ears", opts: AVATAR_PARAMETER_OPTIONS.ears },
                                    { label: "Nose", key: "nose", opts: AVATAR_PARAMETER_OPTIONS.nose },
                                    { label: "Lips", key: "lips", opts: AVATAR_PARAMETER_OPTIONS.lips },
                                    { label: "Facial Hair", key: "facialHair", opts: AVATAR_PARAMETER_OPTIONS[avatar.parameters.gender].facialHair },
                                ],
                            },
                            {
                                key: 'hair',
                                label: 'Hair',
                                fields: [
                                    { label: "Hair Style", key: "hairStyle", opts: AVATAR_PARAMETER_OPTIONS[avatar.parameters.gender].hairStyle },
                                    { label: "Hair Color", key: "hairColor", opts: AVATAR_PARAMETER_OPTIONS.hairColor },
                                ],
                            },
                            {
                                key: 'skin',
                                label: 'Skin & Body',
                                fields: [
                                    { label: "Skin Color", key: "skinColor", opts: AVATAR_PARAMETER_OPTIONS.skinColor },
                                    { label: "Skin", key: "skin", opts: AVATAR_PARAMETER_OPTIONS[avatar.parameters.gender].skin },
                                    { label: "Bust Size", key: "bustSize", opts: AVATAR_PARAMETER_OPTIONS.bustSize },
                                    { label: "Body Hair", key: "bodyHair", opts: AVATAR_PARAMETER_OPTIONS.bodyHair },
                                ],
                            },
                        ] as const).map(section => (
                            <div key={section.key} className="flex flex-col">
                                <button
                                    className="flex items-center justify-between py-4 cursor-pointer group border-b border-base-content/5"
                                    onClick={() => toggleSection(section.key)}
                                >
                                    <span className="text-xs font-medium uppercase tracking-[0.35em] text-base-content/60 group-hover:text-base-content/80 transition-colors">
                                        {section.label}
                                    </span>
                                    <ChevronDown
                                        size={12}
                                        strokeWidth={2.5}
                                        className={`text-base-content/40 group-hover:text-base-content/60 transition-transform duration-300 ${openSections[section.key] ? 'rotate-180' : ''}`}
                                    />
                                </button>
                                <div className={`grid transition-all duration-300 ease-in-out ${openSections[section.key] ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                                    <div className="overflow-hidden">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 py-8">
                                            {section.fields.map(field => (
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
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {parametersFilled() && (
                        <div className='text-center'>
                            <button
                                onClick={createFrontJob}
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
                                canRestart={!stepLocked() && allJobsStarted() && !isFrontJob(idx)}
                                faceMatchThresholds={{ green: 0.6, yellow: 0.55, orange: 0.5 }}
                                showOrder={true}
                            />
                        ))}
                        {onlyFrontJobCompleted() && (
                            <div className="flex relative rounded-[1rem] border border-dashed border-base-content/10 bg-transparent items-center justify-center aspect-square">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="text-center">
                                        <p className="text-[12px] font-medium uppercase tracking-widest mt-1">
                                            Do you like it?
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-[0.15em] border border-base-content/10 text-base-content/40 hover:border-error/40 hover:text-error/70 cursor-pointer transition-all duration-200"
                                            onClick={createFrontJob}
                                        >
                                            No
                                        </button>
                                        <button
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-[0.15em] border border-base-content/10 text-base-content/40 hover:border-primary/40 hover:text-primary/70 cursor-pointer transition-all duration-200"
                                            onClick={createJobs}
                                        >
                                            Yes
                                        </button>
                                    </div>
                                </div>

                                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-base-content/10 pointer-events-none" />
                                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-base-content/10 pointer-events-none" />
                            </div>
                        )}
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

export default CreateSyntheticIdPhotosPage;