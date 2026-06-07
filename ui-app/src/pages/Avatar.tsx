import { useParams } from 'react-router-dom';
import { useEffect, useLayoutEffect, useState, useRef } from "react";
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { getAvatarBySlug, genAvatarPhoto, genAvatarPhotoSet, genAvatarVideo, genAvatarAudio, mimicMotion, getJobsByAvatarId, getJobCountsByAvatarId, restartJobById, deleteJobById, normalizeJob } from '../services/apiGateway';
import { getMediaUrlFromPath, uploadMediaToBucket } from '../services/storage';
import type { Avatar } from '@loom24/shared/types';
import MediaCard from '../components/MediaCard';
import FullscreenModal from '../components/createAvatar/FullscreenModal';
import CreateMediaCard from '../components/avatar/CreateMediaCard';
import CreateMediaModal from '../components/avatar/CreateMediaModal';
import GenImageModal from '../components/avatar/GenImageModal';
import GenPhotoSetModal from '../components/avatar/GenPhotoSetModal';
import GenVideoModal from '../components/avatar/GenVideoModal';
import GenAudioModal from '../components/avatar/GenAudioModal';
import { type Job, type PhotoJobRequest, type PhotoSetJobRequest, type VideoJobRequest, type AudioJobRequest, JobStatuses, JobTargets, MediaTypes } from '@loom24/shared/types';
import { ImageRatios, VideoRatios } from '@loom24/shared/types';
import type { VideoRatio } from '../types/image';
import { listenToCollectionByAvatarId } from '../services/db';
import type { QuerySnapshot } from 'firebase/firestore';
import { useApp } from '../providers/ContextProvider';
import { scrollToTop } from '../utils/scroller';
import type { PhotoSetType } from '@loom24/shared/types';

const CARD_GAP = 16;

function AvatarPage() {
    const { user } = useApp();
    const { slug } = useParams<{ slug: string }>();

    const [avatar, setAvatar] = useState({} as Avatar);

    const [jobs, setJobs] = useState([] as (Job | null)[]);
    const jobsRef = useRef<(Job | null)[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const gridRef = useRef<HTMLDivElement>(null);
    const [colCount, setColCount] = useState(4);
    const [rowHeight, setRowHeight] = useState(300 + CARD_GAP);
    const [scrollMargin, setScrollMargin] = useState(0);

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
        if (!avatar.id || !user?.id) return;

        const unsubscribe = listenToCollectionByAvatarId('jobs', user.id, avatar.id, async (querySnap: QuerySnapshot) => {
            for (const docSnap of querySnap.docs) {
                const job = normalizeJob(docSnap.data());

                if (job.status === JobStatuses.completed && job.resultMediaPath) {
                    job.resultMediaUrl = await getMediaUrlFromPath(job.resultMediaPath);
                    if (job.resultThumbnailPath) {
                        job.resultThumbnailUrl = await getMediaUrlFromPath(job.resultThumbnailPath);
                    }
                }

                const currentJobs = jobsRef.current;
                const jobIndex = currentJobs.findIndex((item) => item?.id === job.id);
                const oldJob = currentJobs[jobIndex];

                if (oldJob && oldJob.status !== job.status) {
                    setJob(jobIndex, job);
                    if (job.status === JobStatuses.completed) {
                        if (job.mediaType === MediaTypes.image) setNumImages(n => n + 1);
                        else if (job.mediaType === MediaTypes.video) setNumVideos(n => n + 1);
                        else if (job.mediaType === MediaTypes.audio) setNumAudios(n => n + 1);
                    }
                }
            }
        });

        return () => unsubscribe();
    }, [avatar.id, user?.id]);


    useEffect(() => {
        jobsRef.current = jobs;
    }, [jobs]);

    useEffect(() => {
        if (!sentinelRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting) loadMoreJobs(); },
            { threshold: 0.1 }
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [nextCursor, loadingMore]);

    useEffect(() => {
        const update = () => setColCount(window.innerWidth >= 1024 ? 4 : window.innerWidth >= 768 ? 3 : 2);
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    useLayoutEffect(() => {
        if (pageLoading || !gridRef.current) return;
        const w = gridRef.current.clientWidth;
        setRowHeight(Math.round((w - CARD_GAP * (colCount - 1)) / colCount) + CARD_GAP);
        setScrollMargin(gridRef.current.getBoundingClientRect().top + window.scrollY);
    }, [pageLoading, colCount]);

    useEffect(() => {
        if (pageLoading) return;
        const el = gridRef.current;
        if (!el) return;
        const observer = new ResizeObserver(([entry]) => {
            const w = entry.contentRect.width;
            setRowHeight(Math.round((w - CARD_GAP * (colCount - 1)) / colCount) + CARD_GAP);
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, [pageLoading, colCount]);

    const initPage = async () => {
        const fetchedAvatar = await fetchAvatar();
        const [, counts] = await Promise.all([
            fetchJobs(fetchedAvatar.id!),
            getJobCountsByAvatarId(fetchedAvatar.id!),
        ]);
        setNumImages(counts.images);
        setNumVideos(counts.videos);
        setNumAudios(counts.audios);
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

    const resolveMediaUrls = async (jobs: Job[]) => {
        await Promise.all(jobs.map(async (job) => {
            if (job.status === JobStatuses.completed && job.resultMediaPath) {
                job.resultMediaUrl = await getMediaUrlFromPath(job.resultMediaPath);
                if (job.resultThumbnailPath) {
                    job.resultThumbnailUrl = await getMediaUrlFromPath(job.resultThumbnailPath);
                }
            }
        }));
    };

    const fetchJobs = async (avatarId: string) => {
        const { jobs: fetchedJobs, nextCursor: cursor } = await getJobsByAvatarId(avatarId);
        await resolveMediaUrls(fetchedJobs);
        setJobs(fetchedJobs);
        setNextCursor(cursor);
    };

    const loadMoreJobs = async () => {
        if (!nextCursor || loadingMore) return;
        setLoadingMore(true);
        try {
            const { jobs: moreJobs, nextCursor: cursor } = await getJobsByAvatarId(avatar.id!, nextCursor);
            await resolveMediaUrls(moreJobs);
            setJobs(prev => [...prev, ...moreJobs]);
            setNextCursor(cursor);
        } finally {
            setLoadingMore(false);
        }
    };

    const restartJob = async (jobId: string) => {
        const listIdx = jobs.findIndex(job => job?.id === jobId);
        if (listIdx === -1) return;

        setJob(listIdx, null);

        const restartedJob = await restartJobById(jobId);
        setJob(listIdx, restartedJob as Job);
    }

    const deleteJob = async (jobId: string) => {
        const deletedJob = jobs.find((job: Job | null) => job?.id === jobId);
        await deleteJobById(jobId);

        setJobs(jobs.filter((job: Job | null) => job?.id !== jobId));

        if (deletedJob?.status === JobStatuses.completed) {
            if (deletedJob.mediaType === MediaTypes.image) setNumImages(n => n - 1);
            else if (deletedJob.mediaType === MediaTypes.video) setNumVideos(n => n - 1);
            else if (deletedJob.mediaType === MediaTypes.audio) setNumAudios(n => n - 1);
        }
    }

    const pushJobs = (jobs: (Job | null)[]) => {
        setJobs((prev: (Job | null)[]) => [...jobs, ...prev]);
    };

    const setJob = (listIdx: number, job: Job | null) => {
        setJobs((prev: (Job | null)[]) => prev.map((oldJob, idx) => idx === listIdx ? job : oldJob));
    };

    const allItems: (Job | null | 'create')[] = ['create', ...jobs];
    const rows: (Job | null | 'create')[][] = [];
    for (let i = 0; i < allItems.length; i += colCount) {
        rows.push(allItems.slice(i, i + colCount));
    }

    const rowVirtualizer = useWindowVirtualizer({
        count: rows.length,
        estimateSize: () => rowHeight,
        overscan: 2,
        scrollMargin,
    });

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
                        <div ref={gridRef}>
                            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                                {rowVirtualizer.getVirtualItems().map(virtualRow => {
                                    const rowItems = rows[virtualRow.index];
                                    return (
                                        <div
                                            key={virtualRow.key}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                transform: `translateY(${virtualRow.start - scrollMargin}px)`,
                                                display: 'grid',
                                                gridTemplateColumns: `repeat(${colCount}, 1fr)`,
                                                columnGap: `${CARD_GAP}px`,
                                                paddingBottom: `${CARD_GAP}px`,
                                            }}
                                        >
                                            {rowItems.map((item, colIdx) => {
                                                if (item === 'create') {
                                                    return <CreateMediaCard key="create" onClick={openCreateMedia} />;
                                                }
                                                const jobIdx = virtualRow.index * colCount + colIdx - 1;
                                                return (
                                                    <MediaCard
                                                        key={item?.id ?? `empty-${virtualRow.index}-${colIdx}`}
                                                        job={item}
                                                        idx={jobIdx}
                                                        onPhotoClick={(src: string, rect: DOMRect, mediaType: MediaTypes) => setFullscreen({ src, rect, mediaType })}
                                                        onRegenerate={restartJob}
                                                        onDelete={deleteJob}
                                                        canDelete={item?.target === JobTargets.avatarMedia}
                                                        canRestart={item?.target === JobTargets.avatarMedia}
                                                    />
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>

                            <div ref={sentinelRef} className="flex justify-center py-8">
                                {loadingMore && <span className="loading loading-spinner loading-xl text-primary scale-150" />}
                            </div>
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
