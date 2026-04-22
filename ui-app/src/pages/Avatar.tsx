import { useParams } from 'react-router-dom';
import { useEffect, useState } from "react";
import { getAvatarBySlug, getMediaByAvatarId } from '../services/apiGateway';
import { getMediaUrlFromPath } from '../services/storage';
import type { Avatar } from '../types/avatar';
import type { Media } from '../types/media';
import PhotoCard from '../components/PhotoCard';

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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
        </>
    );
}

export default AvatarPage;