import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef } from "react";
import { getAvatarBySlug, getMediaByAvatarId, genAvatarPhoto } from '../services/apiGateway';
import { getMediaUrlFromPath } from '../services/storage';
import type { Avatar } from '../types/avatar';
import type { Media } from '../types/media';
import PhotoCard from '../components/PhotoCard';
import FullscreenModal from '../components/createAvatar/FullscreenModal';
import CreateMediaCard from '../components/avatar/CreateMediaCard';
import CreateMediaModal from '../components/avatar/CreateMediaModal';
import GenerateImageModal from '../components/avatar/GenerateImageModal';
import { type InferenceJob, type PhotoJobRequest, JobStatuses } from '../types/job';
import { listenToCollectionByAvatarId } from '../services/db';
import type { QuerySnapshot } from 'firebase/firestore';
import { useApp } from '../providers/ContextProvider';

function AvatarPage() {
    const { user } = useApp();
    const { slug } = useParams<{ slug: string }>();

    const [avatar, setAvatar] = useState({} as Avatar);
    const [media, setMedia] = useState([] as Media[]);

    const [jobs, setJobs] = useState([] as InferenceJob[]);
    const jobsRef = useRef<(InferenceJob | null)[]>([]);

    const [numModels, setNumModels] = useState(0);
    const [numImages, setNumImages] = useState(0);
    const [numVideos, setNumVideos] = useState(0);
    const [fullscreen, setFullscreen] = useState<{ src: string; rect: DOMRect } | null>(null);
    const [createMediaOpen, setCreateMediaOpen] = useState(false);
    const [generateImageOpen, setGenerateImageOpen] = useState(false);
    const [bgBlurred, setBgBlurred] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    const openCreateMedia = () => { setBgBlurred(true); setCreateMediaOpen(true); };
    const closeCreateMedia = () => { setBgBlurred(false); setCreateMediaOpen(false); };
    const openGenerateImage = () => { setCreateMediaOpen(false); setGenerateImageOpen(true); };
    const closeGenerateImage = () => { setBgBlurred(false); setGenerateImageOpen(false); };

    useEffect(() => { initPage(); }, []);

    useEffect(() => {
        if (!jobs.length) return;

        const avatarId = jobs[0]?.avatarId!;

        const unsubscribe = listenToCollectionByAvatarId('jobs', user?.id!, avatarId, async (querySnap: QuerySnapshot) => {
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
                if (job.status === JobStatuses.completed) {
                    await fetchMedia(job.avatarId);
                }

                console.log(`job updated ${job.id} - "${oldJob.status}" status to status "${job.status}"`)
                setJob(jobIndex, job);
            }
        }
    }

    const initPage = async () => {
        const fetchedAvatar = await fetchAvatar();
        await fetchMedia(fetchedAvatar.id!);
    };

    const handleGenerateImage = async (prompt: string, ratio: string) => {
        const jobRequest = {
            prompt,
            ratio,
            avatarId: avatar.id,
        } as PhotoJobRequest;

        const job = await genAvatarPhoto(jobRequest);
        pushJob(job);

        closeGenerateImage();
    };

    const fetchAvatar = async (): Promise<Avatar> => {
        const fetchedAvatar = await getAvatarBySlug(slug!);
        setAvatar(fetchedAvatar);
        setNumModels(Object.values(fetchedAvatar.loras).filter(Boolean).length);
        return fetchedAvatar
    }

    const fetchMedia = async (avatarId: string) => {
        const fetchedMedia = await getMediaByAvatarId(avatarId);
        const enrichedMedia = await Promise.all(
            fetchedMedia.map(async (item) => ({ ...item, url: await getMediaUrlFromPath(item.path).catch(() => undefined) }))
        );
        setMedia(enrichedMedia);
        setNumImages(fetchedMedia.reduce((c: number, m: Media) => m.type === 'image' ? c + 1 : c, 0));
        setNumVideos(fetchedMedia.reduce((c: number, m: Media) => m.type === 'video' ? c + 1 : c, 0));
        setPageLoading(false);
    }

    const pushJob = (job: InferenceJob) => {
        setJobs((prev: InferenceJob[]) => [...prev, job]);
    };

    const setJob = (listIdx: number, job: InferenceJob) => {
        setJobs((prev: InferenceJob[]) => prev.map((oldJob, idx) => idx === listIdx ? job : oldJob));
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
                                    <span className="text-lg font-bold text-base-content">{numModels}</span>
                                    <span className="text-[10px] uppercase tracking-[0.2em]">Models</span>
                                </div>
                                <div className="w-px h-8 bg-base-content/10" />
                                <div className="flex flex-col items-center">
                                    <span className="text-lg font-bold text-base-content">{numImages}</span>
                                    <span className="text-[10px] uppercase tracking-[0.2em]">Images</span>
                                </div>
                                <div className="w-px h-8 bg-base-content/10" />
                                <div className="flex flex-col items-center">
                                    <span className="text-lg font-bold text-base-content">{numVideos}</span>
                                    <span className="text-[10px] uppercase tracking-[0.2em]">Videos</span>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <CreateMediaCard onClick={openCreateMedia} />
                            {jobs.filter((j) => j.status !== JobStatuses.completed).map((j, idx) => (
                                <PhotoCard key={idx} job={j} idx={idx} onPhotoClick={(src, rect) => setFullscreen({ src, rect })} />
                            ))}
                            {media.map((m, idx) => (
                                <PhotoCard key={idx} media={m} idx={idx} onPhotoClick={(src, rect) => setFullscreen({ src, rect })} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {bgBlurred && <div className="fixed inset-0 z-[9998] bg-black/20 pointer-events-none" />}

            <FullscreenModal src={fullscreen?.src ?? null} rect={fullscreen?.rect ?? null} onClose={() => setFullscreen(null)} />

            <CreateMediaModal
                isOpen={createMediaOpen}
                onClose={closeCreateMedia}
                onImage={openGenerateImage}
            />
            <GenerateImageModal
                isOpen={generateImageOpen}
                onClose={closeGenerateImage}
                avatar={avatar}
                onGenerate={handleGenerateImage}
            />
        </>
    );
}

export default AvatarPage;
