import { X, Images } from 'lucide-react';
import { MediaTypes, JobStatuses, JobTargets, type Job } from '@loom24/shared/types';
import type { VideoRatio } from '../../types/image';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { getJobsByAvatarId } from '../../services/apiGateway';
import { getMediaUrlFromPath } from '../../services/storage';

const COLS = 3;
const ROW_HEIGHT = 216;

type Props = {
    isOpen: boolean;
    onClose: () => void;
    avatarId: string;
    onSelect: (mediaPath: string, mediaUrl: string, ratio: VideoRatio, thumbnailUrl?: string) => void;
    title?: string;
};

function MediaSelectorModal({ isOpen, onClose, avatarId, onSelect, title = 'Select Reference Image' }: Props) {
    const [images, setImages] = useState<Job[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [initialLoading, setInitialLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    useScrollLock(isOpen);

    const fetchPage = useCallback(async (cursor?: string) => {
        const { jobs, nextCursor: next } = await getJobsByAvatarId(
            avatarId,
            cursor,
            { mediaType: MediaTypes.image, status: JobStatuses.completed, target: [JobTargets.avatarMedia, JobTargets.idPhoto] },
        );
        await Promise.all(jobs.map(async j => {
            if (j.resultMediaPath) {
                j.resultMediaUrl = await getMediaUrlFromPath(j.resultMediaPath);
                if (j.resultThumbnailPath) {
                    j.resultThumbnailUrl = await getMediaUrlFromPath(j.resultThumbnailPath);
                }
            }
        }));
        setImages(prev => cursor ? [...prev, ...jobs] : jobs);
        setNextCursor(next);
    }, [avatarId]);

    useEffect(() => {
        if (!isOpen) return;
        setImages([]);
        setNextCursor(null);
        setInitialLoading(true);
        fetchPage().finally(() => setInitialLoading(false));
    }, [isOpen, avatarId]);

    useEffect(() => {
        if (!sentinelRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && nextCursor && !loadingMore) {
                    setLoadingMore(true);
                    fetchPage(nextCursor).finally(() => setLoadingMore(false));
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [nextCursor, loadingMore, fetchPage]);

    const rows: Job[][] = [];
    for (let i = 0; i < images.length; i += COLS) {
        rows.push(images.slice(i, i + COLS));
    }

    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 2,
    });

    if (!isOpen) return null;

    const handleSelect = (job: Job) => {
        onSelect(job.resultMediaPath!, job.resultMediaUrl!, job.metadata!.ratio as VideoRatio, job.resultThumbnailUrl);
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="absolute inset-0 bg-base-300/60 animate-modal-backdrop" onClick={onClose} />
            <div className="relative bg-base-100 rounded-3xl shadow-2xl border border-base-content/5 flex flex-col gap-6 p-8 w-[700px] max-h-[80vh] animate-modal-card">

                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 w-11 h-11 flex items-center justify-center rounded-full text-base-content/30 hover:text-base-content hover:bg-base-200 transition-all cursor-pointer"
                >
                    <X size={25} />
                </button>

                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-base-content/50 mt-2">{title}</h2>

                <div ref={scrollRef} className="overflow-y-auto flex-1 min-h-0">
                    {initialLoading ? (
                        <div className="flex items-center justify-center h-48">
                            <span className="loading loading-spinner loading-lg text-primary" />
                        </div>
                    ) : images.length === 0 && !nextCursor ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3 text-base-content/30">
                            <Images size={40} strokeWidth={1.5} />
                            <span className="text-xs uppercase tracking-widest">No generated images yet</span>
                        </div>
                    ) : (
                        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                            {rowVirtualizer.getVirtualItems().map(virtualRow => (
                                <div
                                    key={virtualRow.key}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                >
                                    <div className="grid grid-cols-3 gap-3 pb-3">
                                        {rows[virtualRow.index].map((job) => (
                                            <button
                                                key={job.id}
                                                onClick={() => handleSelect(job)}
                                                className="group relative aspect-square rounded-xl overflow-hidden border border-base-content/10 hover:border-primary/50 transition-all cursor-pointer"
                                            >
                                                <img
                                                    src={job.resultThumbnailUrl || job.resultMediaUrl!}
                                                    className="w-full h-full object-cover object-top transition-all duration-300 group-hover:scale-105 group-hover:opacity-90"
                                                />
                                                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-all" />
                                                {job.metadata?.ratio && (
                                                    <div className="absolute top-1.5 left-1.5 z-10">
                                                        <div className="px-2.5 py-1.5 bg-black/40 backdrop-blur-md rounded-[0.6rem] shadow-lg text-white text-xs font-medium">
                                                            {job.metadata.ratio}
                                                        </div>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div ref={sentinelRef} className="h-1" />
                    {loadingMore && (
                        <div className="flex justify-center py-4">
                            <span className="loading loading-spinner loading-md text-primary" />
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

export default MediaSelectorModal;
