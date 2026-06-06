import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef } from "react";
import { getAvatarBySlug, genAvatarPhoto, genAvatarPhotoSet, genAvatarVideo, genAvatarAudio, mimicMotion, getJobsByAvatarId, restartJobById, deleteJobById } from '../services/apiGateway';
import { getMediaUrlFromPath, uploadMediaToBucket } from '../services/storage';
import type { Avatar } from '../types/avatar';
import LazyMediaCard from '../components/LazyMediaCard';
import FullscreenModal from '../components/createAvatar/FullscreenModal';
import CreateMediaCard from '../components/avatar/CreateMediaCard';
import CreateMediaModal from '../components/avatar/CreateMediaModal';
import GenImageModal from '../components/avatar/GenImageModal';
import GenPhotoSetModal from '../components/avatar/GenPhotoSetModal';
import GenVideoModal from '../components/avatar/GenVideoModal';
import GenAudioModal from '../components/avatar/GenAudioModal';
import { type Job, type PhotoJobRequest, type PhotoSetJobRequest, type VideoJobRequest, type AudioJobRequest, JobStatuses, JobTargets, MediaTypes } from '../types/job';
import { ImageRatios, VideoRatios } from '@loom24/shared/types';
import type { VideoRatio } from '../types/image';
import { listenToCollectionByAvatarId } from '../services/db';
import type { QuerySnapshot } from 'firebase/firestore';
import { useApp } from '../providers/ContextProvider';
import { scrollToTop } from '../utils/scroller';
import type { PhotoSetType } from '../types/image';

function AvatarPage() {
    const { user } = useApp();
    const { slug } = useParams<{ slug: string }>();

    const [avatar, setAvatar] = useState({} as Avatar);

    const [jobs, setJobs] = useState([] as (Job | null)[]);
    const jobsRef = useRef<(Job | null)[]>([]);

    const [numImages, setNumImages] = useState(0);
    const [numVideos, setNumVideos] = useState(0);
    const [numAudios, setNumAudios] = useState(0);
    const [fullscreen, setFullscreen] = useState<{ src: string; rect: DOMRect; mediaType: MediaTypes } | null>(null);
    const [createMediaOpen, setCreateMediaOpen] = useState(false);
    const [generateImageOpen, setGenerateImageOpen] = useState(false);
    const [generateVideoOpen, setGenerateVideoOpen] = useState(false);
    const [generateAudioOpen, setGenerateAudioOpen] = useState(false);
    const [photoSetOpen, setPhotoSetOpen] = useState(false);
    const [bgBlurred, setBgBlurred] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    const openCreateMedia = () => { setBgBlurred(true); setCreateMediaOpen(true); };
    const closeCreateMedia = () => { setBgBlurred(false); setCreateMediaOpen(false); };
    const openGenerateImage = () => { setCreateMediaOpen(false); setGenerateImageOpen(true); };
    const closeGenerateImage = () => { setBgBlurred(false); setGenerateImageOpen(false); };
    const openGenerateVideo = () => { setCreateMediaOpen(false); setGenerateVideoOpen(true); };
    const closeGenerateVideo = () => { setBgBlurred(false); setGenerateVideoOpen(false); };
    const openGenerateAudio = () => { setCreateMediaOpen(false); setGenerateAudioOpen(true); };
    const closeGenerateAudio = () => { setBgBlurred(false); setGenerateAudioOpen(false); };
    const openPhotoSet = () => { setCreateMediaOpen(false); setPhotoSetOpen(true); };
    const closePhotoSet = () => { setBgBlurred(false); setPhotoSetOpen(false); };

    useEffect(() => { initPage(); }, []);

    useEffect(() => {
        if (!jobs.length) return;

        const unsubscribe = listenToCollectionByAvatarId('jobs', user?.id!, avatar.id!, async (querySnap: QuerySnapshot) => {
            await listener(querySnap);
        })

        setNumImages(jobs.reduce((acc: number, job: Job | null) => job && job.mediaType === MediaTypes.image && job.status === JobStatuses.completed ? acc + 1 : acc, 0));
        setNumVideos(jobs.reduce((acc: number, job: Job | null) => job && job.mediaType === MediaTypes.video && job.status === JobStatuses.completed ? acc + 1 : acc, 0));
        setNumAudios(jobs.reduce((acc: number, job: Job | null) => job && job.mediaType === MediaTypes.audio && job.status === JobStatuses.completed ? acc + 1 : acc, 0));

        return () => unsubscribe();
    }, [jobs]);

    useEffect(() => {
        jobsRef.current = jobs;
    }, [jobs]);

    const listener = async (querySnap: QuerySnapshot) => {
        for (const docSnap of querySnap.docs) {
            const job = docSnap.data() as Job;

            if (job.status === JobStatuses.completed && job.resultMediaPath) {
                const downloadUrl = await getMediaUrlFromPath(job.resultMediaPath)
                job.resultMediaUrl = downloadUrl;
            }

            const currentJobs = jobsRef.current;
            const jobIndex = currentJobs.findIndex((item) => item?.id === job.id);
            const oldJob = currentJobs[jobIndex];

            if (oldJob && oldJob?.status !== job.status) {
                setJob(jobIndex, job);
            }
        }
    }

    const initPage = async () => {
        const fetchedAvatar = await fetchAvatar();
        await fetchJobs(fetchedAvatar.id!);
        setPageLoading(false);
        scrollToTop();
    };

    const handleGenerateImage = async (prompt: string, ratio: string, imageFiles: File[]) => {
        const uploadedPaths: string[] = [];

        for (const file of imageFiles) {
            const ext = file.name.split('.').pop() ?? 'jpg';
            const path = `media/${user?.id}-user/uploads/${crypto.randomUUID()}.${ext}`;
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            const storedPath = await uploadMediaToBucket(path, base64);
            uploadedPaths.push(storedPath);
        }

        const jobRequest: PhotoJobRequest = {
            prompt,
            mediaPaths: uploadedPaths,
            ratio: ratio as ImageRatios,
            avatarId: avatar.id!,
        };

        const job = await genAvatarPhoto(jobRequest);
        pushJobs([job]);
        closeGenerateImage();
    };

    const handleGenerateVideo = async (prompt: string, ratio: VideoRatio, referenceImagePath: string | null, lengthSec: number, audioText: string | null, audioPath: string | null, objectPhotoPaths: string[]) => {
        const jobRequest: VideoJobRequest = {
            prompt,
            ratio: ratio as VideoRatios,
            avatarId: avatar.id!,
            mediaPaths: [
                ...(referenceImagePath ? [referenceImagePath] : []),
                ...objectPhotoPaths,
            ],
            lengthSec,
            ...(audioText ? { audioText } : {}),
            ...(audioPath ? { audioPath } : {}),
        };

        const job = await genAvatarVideo(jobRequest);
        pushJobs([job]);
        closeGenerateVideo();
    };

    const handleMimicMotion = async (imagePath: string, videoPath: string, keepOriginalAudio: boolean) => {
        const job = await mimicMotion({ avatarId: avatar.id!, imagePath, videoPath, keepOriginalAudio });
        pushJobs([job]);
        closeGenerateVideo();
    };

    const handleGenerateAudio = async (text: string) => {
        const jobRequest: AudioJobRequest = {
            avatarId: avatar.id!,
            prompt: text,
        };

        const job = await genAvatarAudio(jobRequest);
        pushJobs([job]);
        closeGenerateAudio();
    };

    const handleGeneratePhotoset = async (type: PhotoSetType) => {
        const jobRequest: PhotoSetJobRequest = {
            avatarId: avatar.id!,
            type
        };

        const jobs = await genAvatarPhotoSet(jobRequest);
        pushJobs(jobs);
        closePhotoSet();
    }

    const fetchAvatar = async (): Promise<Avatar> => {
        const fetchedAvatar = await getAvatarBySlug(slug!);
        setAvatar(fetchedAvatar);
        return fetchedAvatar
    }

    const fetchJobs = async (avatarId: string) => {
        const jobs = await getJobsByAvatarId(avatarId);
        const filteredJobs = jobs
            .filter((job: Job) => [JobTargets.avatarMedia, JobTargets.idPhoto].includes(job.target))
            .sort((a, b) => (b.createdAt?._seconds ?? 0) - (a.createdAt?._seconds ?? 0));

        await Promise.all(filteredJobs.map(async (job: Job) => {
            if (job.status === JobStatuses.completed && job.resultMediaPath) {
                job.resultMediaUrl = await getMediaUrlFromPath(job.resultMediaPath);
            }
        }));

        setJobs(filteredJobs);
    }

    const restartJob = async (jobId: string) => {
        const listIdx = jobs.findIndex(job => job?.id === jobId);
        if (listIdx === -1) return;

        setJob(listIdx, null);

        const restartedJob = await restartJobById(jobId);
        setJob(listIdx, restartedJob as Job);
    }

    const deleteJob = async (jobId: string) => {
        await deleteJobById(jobId);

        const updatedJobs = jobs.filter((job: Job | null) => job?.id !== jobId);
        setJobs(updatedJobs);
    }

    const pushJobs = (jobs: (Job | null)[]) => {
        setJobs((prev: (Job | null)[]) => [...jobs, ...prev]);
    };

    const setJob = (listIdx: number, job: Job | null) => {
        setJobs((prev: (Job | null)[]) => prev.map((oldJob, idx) => idx === listIdx ? job : oldJob));
    };

    return (
        <>
            <div style={{ filter: bgBlurred ? 'blur(8px)' : 'none', transition: 'filter 0.1s ease' }}>
                {pageLoading ? (
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <span className="loading loading-spinner loading-xl text-primary scale-150"></span>
                    </div>
                ) : (
                    <div className="max-w-6xl mx-auto px-4 pt-12 mb-50">
                        <div className="flex items-center gap-8 mb-10">
                            <h1 className="text-2xl font-medium uppercase tracking-[0.2em]">{avatar.name}</h1>
                            <div className="flex items-center gap-6 text-base-content/40">
                                <div className="flex flex-col items-center">
                                    <span className="text-lg font-bold text-base-content">{numImages}</span>
                                    <span className="text-[10px] uppercase tracking-[0.2em]">Images</span>
                                </div>
                                <div className="w-px h-8 bg-base-content/10" />
                                <div className="flex flex-col items-center">
                                    <span className="text-lg font-bold text-base-content">{numVideos}</span>
                                    <span className="text-[10px] uppercase tracking-[0.2em]">Videos</span>
                                </div>
                                <div className="w-px h-8 bg-base-content/10" />
                                <div className="flex flex-col items-center">
                                    <span className="text-lg font-bold text-base-content">{numAudios}</span>
                                    <span className="text-[10px] uppercase tracking-[0.2em]">Audios</span>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <CreateMediaCard onClick={openCreateMedia} />

                            {jobs.map((job, idx) => (
                                <LazyMediaCard
                                    key={idx} 
                                    job={job} 
                                    idx={idx} 
                                    onPhotoClick={(src, rect, mediaType) => setFullscreen({ src, rect, mediaType })}
                                    onRegenerate={restartJob}
                                    onDelete={deleteJob}
                                    canDelete={job?.target! === JobTargets.avatarMedia}
                                    canRestart={job?.target! === JobTargets.avatarMedia}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {bgBlurred && <div className="fixed inset-0 z-[9998] bg-black/20 pointer-events-none" />}

            <FullscreenModal src={fullscreen?.src ?? null} rect={fullscreen?.rect ?? null} mediaType={fullscreen?.mediaType} onClose={() => setFullscreen(null)} />

            <CreateMediaModal
                isOpen={createMediaOpen}
                onClose={closeCreateMedia}
                onImage={openGenerateImage}
                onVideo={openGenerateVideo}
                onPhotoSet={openPhotoSet}
                onAudio={openGenerateAudio}
            />
            <GenImageModal
                isOpen={generateImageOpen}
                onClose={closeGenerateImage}
                avatar={avatar}
                onGenerate={handleGenerateImage}
            />
            <GenPhotoSetModal
                isOpen={photoSetOpen}
                onClose={closePhotoSet}
                onGenerate={handleGeneratePhotoset}
            />
            <GenVideoModal
                isOpen={generateVideoOpen}
                onClose={closeGenerateVideo}
                avatar={avatar}
                jobs={jobs.filter((j): j is Job => j !== null)}
                onGenerate={handleGenerateVideo}
                onMimicMotion={handleMimicMotion}
            />
            <GenAudioModal
                isOpen={generateAudioOpen}
                onClose={closeGenerateAudio}
                avatar={avatar}
                onGenerate={handleGenerateAudio}
            />
        </>
    );
}

export default AvatarPage;
