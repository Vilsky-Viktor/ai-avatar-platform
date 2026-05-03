import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef } from "react";
import { getAvatarBySlug, genAvatarPhoto, getJobsByAvatarId, restartJobById, deleteJobById } from '../services/apiGateway';
import { getMediaUrlFromPath, uploadMediaToBucket } from '../services/storage';
import type { Avatar } from '../types/avatar';
import LazyMediaCard from '../components/LazyMediaCard';
import FullscreenModal from '../components/createAvatar/FullscreenModal';
import CreateMediaCard from '../components/avatar/CreateMediaCard';
import CreateMediaModal from '../components/avatar/CreateMediaModal';
import GenImageModal from '../components/avatar/GenImageModal';
import GenPhotoSetModal from '../components/avatar/GenPhotoSetModal';
import { type InferenceJob, type Job, type PhotoJobRequest, JobStatuses, JobTargets, MediaType } from '../types/job';
import { listenToCollectionByAvatarId } from '../services/db';
import type { QuerySnapshot } from 'firebase/firestore';
import { useApp } from '../providers/ContextProvider';
import { scrollToTop } from '../utils/scroller';

function AvatarPage() {
    const { user } = useApp();
    const { slug } = useParams<{ slug: string }>();

    const [avatar, setAvatar] = useState({} as Avatar);

    const [jobs, setJobs] = useState([] as (InferenceJob | null)[]);
    const jobsRef = useRef<(InferenceJob | null)[]>([]);

    const [numModels, setNumModels] = useState(0);
    const [numImages, setNumImages] = useState(0);
    const [numVideos, setNumVideos] = useState(0);
    const [fullscreen, setFullscreen] = useState<{ src: string; rect: DOMRect } | null>(null);
    const [createMediaOpen, setCreateMediaOpen] = useState(false);
    const [generateImageOpen, setGenerateImageOpen] = useState(false);
    const [photoSetOpen, setPhotoSetOpen] = useState(false);
    const [bgBlurred, setBgBlurred] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    const openCreateMedia = () => { setBgBlurred(true); setCreateMediaOpen(true); };
    const closeCreateMedia = () => { setBgBlurred(false); setCreateMediaOpen(false); };
    const openGenerateImage = () => { setCreateMediaOpen(false); setGenerateImageOpen(true); };
    const closeGenerateImage = () => { setBgBlurred(false); setGenerateImageOpen(false); };
    const openPhotoSet = () => { setCreateMediaOpen(false); setPhotoSetOpen(true); };
    const closePhotoSet = () => { setBgBlurred(false); setPhotoSetOpen(false); };

    useEffect(() => { initPage(); }, []);

    useEffect(() => {
        if (!jobs.length) return;

        const unsubscribe = listenToCollectionByAvatarId('jobs', user?.id!, avatar.id!, async (querySnap: QuerySnapshot) => {
            await listener(querySnap);
        })

        setNumImages(jobs.reduce((acc: number, job: Job | null) => job && job.mediaType === MediaType.image && job.status === JobStatuses.completed ? acc + 1 : acc, 0));
        setNumVideos(jobs.reduce((acc: number, job: Job | null) => job && job.mediaType === MediaType.video && job.status === JobStatuses.completed ? acc + 1 : acc, 0));

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
            referenceImagePaths: uploadedPaths,
            ratio,
            avatarId: avatar.id!,
        };

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

    const fetchJobs = async (avatarId: string) => {
        const jobs = await getJobsByAvatarId(avatarId);
        const filteredJobs = jobs.filter((job: InferenceJob) => [JobTargets.avatarMedia, JobTargets.trainingPhotoSet].includes(job.target));

        await Promise.all(filteredJobs.map(async (job: InferenceJob) => {
            if (job.status === JobStatuses.completed && job.result?.mediaPath) {
                job.result.mediaUrl = await getMediaUrlFromPath(job.result.mediaPath);
            }
        }));

        setJobs(filteredJobs);
    }

    const restartJob = async (jobId: string) => {
        const listIdx = jobs.findIndex(job => job?.id === jobId);
        if (listIdx === -1) return;

        setJob(listIdx, null);

        const restartedJob = await restartJobById(jobId);
        setJob(listIdx, restartedJob as InferenceJob);
    }

    const deleteJob = async (jobId: string) => {
        await deleteJobById(jobId);

        const updatedJobs = jobs.filter((job: Job | null) => job?.id !== jobId);
        setJobs(updatedJobs);
    }

    const pushJob = (job: InferenceJob | null) => {
        setJobs((prev: (InferenceJob | null)[]) => [job, ...prev]);
    };

    const setJob = (listIdx: number, job: InferenceJob | null) => {
        setJobs((prev: (InferenceJob | null)[]) => prev.map((oldJob, idx) => idx === listIdx ? job : oldJob));
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

                            {jobs.map((job, idx) => (
                                <LazyMediaCard
                                    key={idx} 
                                    job={job} 
                                    idx={idx} 
                                    onPhotoClick={(src, rect) => setFullscreen({ src, rect })}
                                    onRegenerate={restartJob}
                                    onDelete={deleteJob}
                                    canDelete={job?.target === JobTargets.avatarMedia}
                                    canRestart={job?.target === JobTargets.avatarMedia}
                                />
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
                onPhotoSet={openPhotoSet}
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
                onGenerate={(id: string) => console.log('photo set selected:', id)}
            />
        </>
    );
}

export default AvatarPage;
