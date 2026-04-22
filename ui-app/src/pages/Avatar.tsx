import { useParams } from 'react-router-dom';
import { useEffect, useState } from "react";
import { getAvatarBySlug, getMediaByAvatarId } from '../services/apiGateway';
import { getMediaUrlFromPath } from '../services/storage';
import type { Avatar } from '../types/avatar';
import type { Media } from '../types/media';
import PhotoCard from '../components/PhotoCard';
import FullscreenModal from '../components/createAvatar/FullscreenModal';
import CreateMediaCard from '../components/avatar/CreateMediaCard';

function AvatarPage() {
    const { slug } = useParams<{ slug: string }>();

    const [avatar, setAvatar] = useState({} as Avatar);
    const [media, setMedia] = useState([] as Media[]);
    const [numModels, setNumModels] = useState(0);
    const [numImages, setNumImages] = useState(0);
    const [numVideos, setNumVideos] = useState(0);
    const [fullscreenSrc, setFullscreenSrc] = useState<string | null>(null);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        initPage();
    }, []);

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

    const initPage = async () => {
        const fetchedAvatar = await getAvatarBySlug(slug!);
        setAvatar(fetchedAvatar);

        const numTrainedModels = Object.values(fetchedAvatar.loras).filter(Boolean).length;
        setNumModels(numTrainedModels);

        const fetchedMedia = await getMediaByAvatarId(fetchedAvatar.id!);
        const enrichedMedia = await Promise.all(
            fetchedMedia.map(async (item) => {
                const url = await getMediaUrlFromPath(item.path).catch(() => undefined);
                return { ...item, url };
            })
        );
        setMedia(enrichedMedia);

        const numImages = fetchedMedia.reduce((count: number, media: Media) => media.type === 'image' ? count + 1 : count, 0);
        const numVideos = fetchedMedia.reduce((count: number, media: Media) => media.type === 'video' ? count + 1 : count, 0);
        setNumImages(numImages);
        setNumVideos(numVideos);

        setPageLoading(false);
    }

    return (
        <>
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
                        <CreateMediaCard />

                        {media.map((media, idx) => (
                            <PhotoCard
                                key={idx}
                                media={media}
                                idx={idx}
                                onPhotoClick={setFullscreenSrc}
                            />
                        ))}
                    </div>
                </div>
            )}

            <FullscreenModal src={fullscreenSrc} onClose={() => setFullscreenSrc(null)} />
        </>
    );
}

export default AvatarPage;