import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateAvatarStepper from "../../components/createAvatar/CreateAvatarStepper";
import Loading from "../../components/Loading";
import { ChevronDown, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import FullscreenModal from "../../components/createAvatar/FullscreenModal";
import MediaCard from "../../components/MediaCard";
import { type Avatar } from '@loom24/shared/types';
import { updateAvatar, restartJobById, genSyntheticIdPhotos, genSyntheticFrontIdPhoto, getAvatarById, getJobsByGroupId, normalizeJob, deleteJobById } from '../../services/apiGateway';
import { JobStatuses, type Job, type IdPhotoJobRequest } from '@loom24/shared/types';
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
import { scrollToTop } from '../../utils/scroller';
import PillSelect from '../../components/PillSelect';

function CreateSyntheticIdPhotosPage() {
    const navigate = useNavigate();
    const { user } = useApp();

    const [newAvatarData, setNewAvatarData] = useState(() => getAvatarData());
    const [avatar, setAvatar] = useState(initialAvatarData);
    const [pageLoading, setPageLoading] = useState(true);
    const [jobs, setJobs] = useState([] as (Job | null)[]);
    const jobsRef = useRef<(Job | null)[]>([]);
    const [fullscreen, setFullscreen] = useState<{ src: string; rect: DOMRect; thumbnailSrc?: string } | null>(null);
    const [openSection, setOpenSection] = useState<string>('ethnicity');

    const toggleSection = (key: string) =>
        setOpenSection(prev => (prev === key ? '' : key));

    useEffect(() => { scrollToTop(); }, []);
    useEffect(() => { initPage(); }, []);
    useEffect(() => { saveAvatarData(newAvatarData); }, [newAvatarData]);

    useEffect(() => {
        if (!newAvatarData.groupId || !user?.id) return;
        const unsubscribe = listenToCollectionByGroupId('jobs', user.id, newAvatarData.groupId, async (querySnap: QuerySnapshot) => {
            await listener(querySnap);
        });
        return () => unsubscribe();
    }, [newAvatarData.groupId, user?.id]);

    useEffect(() => { jobsRef.current = jobs; }, [jobs]);

    const listener = async (querySnap: QuerySnapshot) => {
        for (const docSnap of querySnap.docs) {
            const job = normalizeJob(docSnap.data()) as Job;

            if (job.status === JobStatuses.completed && job.resultMediaPath) {
                job.resultMediaUrl = await getMediaUrlFromPath(job.resultMediaPath);
                if (job.resultThumbnailPath) {
                    job.resultThumbnailUrl = await getMediaUrlFromPath(job.resultThumbnailPath);
                }
            }

            const currentJobs = jobsRef.current;
            const jobIndex = currentJobs.findIndex(item => item?.id === job.id);
            const oldJob = currentJobs[jobIndex];

            if (oldJob && oldJob?.status !== job.status) {
                setJob(jobIndex, job);
            }
        }
    };

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
            const onlyIdPhotoJobs = fetchedJobs.filter((job: Job) => job.order! <= NUM_ID_PHOTOS);
            const enrichedJobs = await Promise.all(
                (onlyIdPhotoJobs as Job[]).map(async (job: Job) => {
                    const resultMediaUrl = job.resultMediaPath
                        ? await getMediaUrlFromPath(job.resultMediaPath).catch(() => undefined)
                        : undefined;
                    const resultThumbnailUrl = job.resultThumbnailPath
                        ? await getMediaUrlFromPath(job.resultThumbnailPath).catch(() => undefined)
                        : undefined;
                    return { ...job, resultMediaUrl, resultThumbnailUrl };
                })
            );
            setJobs(enrichedJobs as Job[]);
        }
        setPageLoading(false);
    };

    const setJob = (listIdx: number, job: Job | null) =>
        setJobs(prev => prev.map((oldJob, idx) => idx === listIdx ? job : oldJob));

    const setParameter = (key: string, value: string) =>
        setAvatar((prev: Avatar) => ({ ...prev, parameters: { ...prev.parameters, [key]: value } }));

    const setGroupId = (groupId: string) =>
        setNewAvatarData((prev: NewAvatarData) => ({ ...prev, groupId }));

    const createFrontJob = async () => {
        const existingFrontJobId = jobsRef.current[0]?.id;
        setJobs([null]);
        await updateAvatar(newAvatarData.avatarId, { parameters: avatar.parameters });
        if (existingFrontJobId) {
            await deleteJobById(existingFrontJobId).catch(error => console.error(`Failed to delete front job ${existingFrontJobId}:`, error));
        }
        const jobRequest: IdPhotoJobRequest = { avatarId: newAvatarData.avatarId, parameters: avatar.parameters };
        try {
            const job = await genSyntheticFrontIdPhoto(jobRequest);
            setJobs([job as Job]);
            setGroupId(job.groupId!);
        } catch {
            console.log('Failed to create front job for id photos');
        }
    };

    const createJobs = async () => {
        const emptyJobs = Array(NUM_ID_PHOTOS - 1).fill(null);
        setJobs([...jobsRef.current, ...emptyJobs]);
        const jobRequest: IdPhotoJobRequest = {
            groupId: newAvatarData.groupId,
            avatarId: newAvatarData.avatarId,
            parameters: avatar.parameters,
            idPhotoPath: jobsRef.current[0]?.resultMediaPath,
        };
        try {
            const newJobs = await genSyntheticIdPhotos(jobRequest);
            setJobs([jobsRef.current[0], ...(newJobs as Job[])]);
        } catch {
            console.log('Failed to create jobs for id photos');
        }
    };

    const restartJob = async (jobId: string) => {
        const listIdx = jobs.findIndex(job => job?.id === jobId);
        if (listIdx === -1) return;
        setJob(listIdx, null);
        const restartedJob = await restartJobById(jobId);
        setJob(listIdx, restartedJob as Job);
    };

    const generatingStarted = () => jobs.length > 0;
    const generatingCompleted = () => jobs.length > 0 && jobs.every(job => job?.status === JobStatuses.completed);
    const onlyFrontJobCompleted = () => jobs.length === 1 && jobs[0]?.status === JobStatuses.completed;
    const allJobsStarted = () => jobs.length === NUM_ID_PHOTOS && jobs.every(job => job !== null);
    const isFrontJob = (idx: number) => idx === 0;
    const parametersFilled = () => Object.values(avatar.parameters).every(val => val !== '');
    const stepLocked = () => Boolean(avatar.mainImagePath);
    const canProceed = () => jobs.length === NUM_ID_PHOTOS && generatingCompleted();

    const nextStep = async () => {
        if (!canProceed()) return;
        try {
            if (!stepLocked()) {
                await updateAvatar(newAvatarData.avatarId, {
                    mainImagePath: jobs[0]?.resultThumbnailPath || jobs[0]?.resultMediaPath,
                });
            }
            navigate('/avatar/create/assign-voice');
        } catch (error) {
            console.log(`Did not manage to update avatar: ${error}`);
        }
    };

    const previousStep = () => navigate('/avatar/create/general');

    const gender = avatar.parameters.gender as 'male' | 'female';

    const parameters = [
        { label: "Ethnicity", key: "ethnicity", opts: AVATAR_PARAMETER_OPTIONS.ethnicity },
        { label: "Age", key: "age", opts: AVATAR_PARAMETER_OPTIONS.age },
        { label: "Height", key: "height", opts: AVATAR_PARAMETER_OPTIONS.height },
        { label: "Attractiveness", key: "attractiveness", opts: AVATAR_PARAMETER_OPTIONS[gender].attractiveness },
        { label: "Body", key: "body", opts: AVATAR_PARAMETER_OPTIONS[gender].body },
        { label: "Face Shape", key: "face", opts: AVATAR_PARAMETER_OPTIONS[gender].face },
        { label: "Eyes", key: "eyes", opts: AVATAR_PARAMETER_OPTIONS.eyes },
        { label: "Eye Lashes", key: "eyeLashes", opts: AVATAR_PARAMETER_OPTIONS.eyeLashes },
        { label: "Eye Brows", key: "eyeBrows", opts: AVATAR_PARAMETER_OPTIONS.eyeBrows },
        { label: "Ears", key: "ears", opts: AVATAR_PARAMETER_OPTIONS.ears },
        { label: "Nose", key: "nose", opts: AVATAR_PARAMETER_OPTIONS.nose },
        { label: "Lips", key: "lips", opts: AVATAR_PARAMETER_OPTIONS.lips },
        { label: "Facial Hair", key: "facialHair", opts: AVATAR_PARAMETER_OPTIONS[gender].facialHair },
        { label: "Hair Style", key: "hairStyle", opts: AVATAR_PARAMETER_OPTIONS[gender].hairStyle },
        { label: "Hair Color", key: "hairColor", opts: AVATAR_PARAMETER_OPTIONS.hairColor },
        { label: "Skin Color", key: "skinColor", opts: AVATAR_PARAMETER_OPTIONS.skinColor },
        { label: "Skin", key: "skin", opts: AVATAR_PARAMETER_OPTIONS[gender].skin },
        { label: "Bust Size", key: "bustSize", opts: AVATAR_PARAMETER_OPTIONS.bustSize },
        { label: "Body Hair", key: "bodyHair", opts: AVATAR_PARAMETER_OPTIONS.bodyHair },
    ];

    return (
        <>
            <CreateAvatarStepper step={1} />

            {pageLoading ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loading />
                </div>
            ) : (
                <div className="max-w-7xl mx-auto px-4 pt-10 pb-32 flex gap-8 items-start">

                    {/* Left — Appearance options */}
                    <div className="w-96 flex-shrink-0 sticky top-6">
<div className="flex flex-col">
                            {parameters.map(param => {
                                const isOpen = openSection === param.key;
                                const currentValue = avatar.parameters[param.key as keyof typeof avatar.parameters];

                                return (
                                    <div key={param.key} className="border-b border-base-content/5 last:border-0">
                                        <button
                                            className="w-full flex items-center justify-between py-4 cursor-pointer group"
                                            onClick={() => toggleSection(param.key)}
                                            disabled={stepLocked()}
                                        >
                                            <div className="flex flex-col items-start gap-1">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-8 h-px transition-colors duration-200 ${isOpen ? 'bg-primary' : 'bg-primary/50'}`} />
                                                    <span className={`text-sm uppercase tracking-[0.2em] transition-colors duration-200 ${isOpen ? 'text-base-content/90' : 'text-base-content/70'}`}>
                                                        {param.label}
                                                    </span>
                                                </div>
                                                {!isOpen && currentValue && (
                                                    <span className="text-xs text-base-content/30 truncate max-w-[190px] pl-11">
                                                        {currentValue}
                                                    </span>
                                                )}
                                            </div>
                                            <ChevronDown
                                                size={13}
                                                strokeWidth={2.5}
                                                className={`text-base-content/30 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180 text-primary' : ''}`}
                                            />
                                        </button>

                                        <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                                            <div className="overflow-hidden">
                                                <div className="pb-5">
                                                    <PillSelect
                                                        opts={param.opts}
                                                        value={currentValue}
                                                        disabled={stepLocked()}
                                                        onChange={(val) => val && setParameter(param.key, val)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right — Generate & results */}
                    <div className="flex-1 flex flex-col gap-6">

                        {/* State: nothing generated yet */}
                        {!generatingStarted() && (
                            <div className="flex flex-col items-center justify-center text-center py-20 gap-8">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-px bg-primary/50" />
                                        <h2 className="text-xl uppercase tracking-[0.2em] text-base-content/70">
                                            Generate a preview
                                        </h2>
                                        <div className="w-8 h-px bg-primary/50" />
                                    </div>
                                    <p className="text-xs uppercase tracking-[0.1em] text-base-content/30 max-w-xs leading-loose">
                                        Adjust the appearance options on the left, then generate a preview photo to see how your avatar will look.
                                    </p>
                                </div>
                                <button
                                    onClick={createFrontJob}
                                    disabled={!parametersFilled() || stepLocked()}
                                    className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-primary text-primary-content text-sm uppercase tracking-[0.3em] transition-all duration-300 hover:brightness-110 hover:scale-[1.02] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none"
                                >
                                    <Sparkles size={16} />
                                    Generate preview
                                </button>
                            </div>
                        )}

                        {/* State: generating or generated */}
                        {generatingStarted() && (
                            <>
                                {/* Front photo approval prompt */}
                                {onlyFrontJobCompleted() && (
                                    <div className="flex items-center justify-between px-6 py-4 rounded-2xl bg-base-content/5">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm uppercase tracking-[0.2em] text-base-content/70">
                                                Happy with this look?
                                            </span>
                                            <span className="text-xs text-base-content/40">
                                                If yes, we'll generate all 7 angle photos. If not, we'll create a new one.
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                onClick={createFrontJob}
                                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium uppercase tracking-[0.2em] bg-base-content/5 text-base-content/50 hover:bg-base-content/10 hover:text-base-content/80 cursor-pointer transition-all duration-200"
                                            >
                                                <RefreshCw size={13} />
                                                Try again
                                            </button>
                                            <button
                                                onClick={createJobs}
                                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium uppercase tracking-[0.2em] bg-primary text-primary-content hover:brightness-110 cursor-pointer transition-all duration-200"
                                            >
                                                <CheckCircle2 size={13} />
                                                Generate all
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Hint */}
                                {allJobsStarted() && (
                                    <div className="flex items-start gap-4 px-5 py-4 rounded-2xl border border-primary/15 bg-primary/[0.04]">
                                        <span className="w-8 h-px bg-primary/50 mt-[9px] flex-shrink-0" />
                                        <div className="flex flex-col gap-1">
                                            <p className="text-sm text-base-content/70">Review each photo before continuing.</p>
                                            <p className="text-xs text-base-content/35 leading-relaxed">If the face or colors look off, hit regenerate on that card.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Photo grid */}
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                    {jobs.map((job, idx) => (
                                        <MediaCard
                                            key={idx}
                                            job={job}
                                            idx={idx}
                                            onPhotoClick={(src, rect, _mediaType, thumbnailSrc) => setFullscreen({ src, rect, thumbnailSrc })}
                                            onRegenerate={restartJob}
                                            canRestart={!stepLocked() && allJobsStarted() && !isFrontJob(idx)}
                                            showOrder={true}
                                        />
                                    ))}
                                </div>
                            </>
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

            <FullscreenModal src={fullscreen?.src ?? null} rect={fullscreen?.rect ?? null} thumbnailSrc={fullscreen?.thumbnailSrc} onClose={() => setFullscreen(null)} />
        </>
    );
}

export default CreateSyntheticIdPhotosPage;
