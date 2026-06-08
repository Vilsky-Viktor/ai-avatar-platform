import { Sparkles, User, Clock, CircleOff, RefreshCcw, Trash2, Text, CloudDownload, Play, Share2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { JobStatuses, MediaTypes, type Job } from '@loom24/shared/types';
import { downloadMediaFromBucket } from '../services/storage';
import DeleteMediaModal from './mediaGrid/DeleteMediaModal';
import MediaInfoPopup from './mediaGrid/MediaInfoPopup';
import SharePopup from './mediaGrid/SharePopup';

type FaceMatchThresholds = {
    green: number;
    yellow: number;
    orange: number;
};

type Props = {
    job?: Partial<Job> | null;
    idx: number;
    onPhotoClick: (url: string, rect: DOMRect, mediaType: MediaTypes, thumbnailUrl?: string) => void;
    onRegenerate?: (jobId: string) => void;
    onDelete?: (jobId: string) => void | Promise<void>;
    canRestart?: boolean;
    canDelete?: boolean;
    showOrder?: boolean;
    faceMatchThresholds?: FaceMatchThresholds;
};

const cornerTL = <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-primary/30 pointer-events-none" />;
const cornerTR = <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-primary/30 pointer-events-none" />;
const cornerBL = <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-primary/30 pointer-events-none" />;
const cornerBR = <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-primary/30 pointer-events-none" />;

function MediaCard({
    job,
    idx,
    onPhotoClick,
    onRegenerate,
    onDelete,
    canDelete = false,
    canRestart = true,
    showOrder = false,
}: Props) {
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [infoVisible, setInfoVisible] = useState(false);
    const [shareVisible, setShareVisible] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const startRef = useRef<number | null>(null);

    useEffect(() => {
        if (job?.status !== JobStatuses.generating) return;
        const startDate = job.updatedAt ?? job.createdAt;
        const startSec: number = startDate ? startDate.getTime() / 1000 : Date.now() / 1000;
        startRef.current = startSec;
        setElapsed(Math.max(0, Math.floor(Date.now() / 1000 - startSec)));
        const interval = setInterval(() =>
            setElapsed(Math.max(0, Math.floor(Date.now() / 1000 - startRef.current!))), 1000);
        return () => clearInterval(interval);
    }, [job?.status, job?.updatedAt]);

    const handleConfirmDelete = async () => {
        if (!confirmDeleteId || !onDelete) return;
        setIsDeleting(true);
        try {
            await onDelete(confirmDeleteId);
        } finally {
            setIsDeleting(false);
            setConfirmDeleteId(null);
        }
    };

    if (!job) {
        return (
            <div className="flex relative rounded-2xl border border-dashed border-base-content/10 bg-transparent items-center justify-center aspect-square">
                <div className="flex flex-col items-center gap-4">
                    <User size={50} strokeWidth={1} className="text-base-content/10" />
                    <div className="text-center">
                        <span className="text-[10px] uppercase tracking-[0.4em] text-base-content/30">
                            Photo {idx + 1}
                        </span>
                        <p className="text-[9px] uppercase tracking-widest text-base-content/20 mt-1">
                            Click generate
                        </p>
                    </div>
                </div>
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-base-content/10 pointer-events-none" />
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-base-content/10 pointer-events-none" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-base-content/10 pointer-events-none" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-base-content/10 pointer-events-none" />
            </div>
        );
    }

    const status = job.status;
    const url = job.resultMediaUrl;
    const displayUrl = job.resultThumbnailUrl || url;
    const order = job.order;
    const jobId = job.id;

    const infoButton = (
        <button
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-info transition-colors cursor-pointer"
            onClick={() => setInfoVisible(v => !v)}
        >
            <Text size={20} className="text-white" />
        </button>
    );

    if (status === JobStatuses.pending) {
        return (
            <>
            {confirmDeleteId && onDelete && (
                <DeleteMediaModal
                    isDeleting={isDeleting}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setConfirmDeleteId(null)}
                />
            )}
            {infoVisible && <MediaInfoPopup job={job} onClose={() => setInfoVisible(false)} />}
            <div className="group flex relative rounded-2xl border border-base-content/10 bg-transparent flex flex-col items-center justify-center aspect-square overflow-hidden">
                <div className="flex flex-col items-center gap-6">
                    <Clock size={40} strokeWidth={1} className="text-base-content/20 animate-pulse" />
                    <div className="text-center">
                        <span className="text-[10px] uppercase tracking-[0.4em] text-primary/60">
                            Waiting
                        </span>
                        <p className="text-[9px] uppercase tracking-widest text-base-content/20 mt-1">
                            Queue processing
                        </p>
                    </div>
                </div>
                {cornerTL}{cornerTR}{cornerBL}{cornerBR}
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    {canDelete && onDelete && (
                        <button
                            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-error transition-colors cursor-pointer"
                            onClick={() => jobId && setConfirmDeleteId(jobId)}
                        >
                            <Trash2 size={20} className="text-white" />
                        </button>
                    )}
                    {infoButton}
                </div>
            </div>
            </>
        );
    }

    if (status === JobStatuses.generating) {
        return (
            <>
            {confirmDeleteId && onDelete && (
                <DeleteMediaModal
                    isDeleting={isDeleting}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setConfirmDeleteId(null)}
                />
            )}
            {infoVisible && <MediaInfoPopup job={job} onClose={() => setInfoVisible(false)} />}
            <div
                className="relative p-[1.5px] rounded-2xl aspect-square animate-spin-border overflow-hidden"
                style={{ backgroundImage: 'conic-gradient(from var(--gen-angle), transparent 0%, transparent 60%, color-mix(in oklch, var(--color-primary) 85%, transparent) 80%, transparent 100%)' }}
            >
                <div className="group relative rounded-2xl bg-base-100 w-full h-full flex flex-col items-center justify-center overflow-hidden">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <span className="loading loading-dots loading-lg text-primary w-14" />
                            <Sparkles size={18} className="absolute -top-3 -right-3 text-primary animate-pulse" />
                        </div>
                        <div className="text-center">
                            <span className="text-[10px] uppercase tracking-[0.4em] text-primary">
                                Generating
                            </span>
                            <p className="text-[15px] font-mono font-light text-base-content/25 tracking-widest">
                                {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
                            </p>
                        </div>
                    </div>
                    {cornerTL}{cornerTR}{cornerBL}{cornerBR}
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        {canDelete && onDelete && (
                            <button
                                className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-error transition-colors cursor-pointer"
                                onClick={() => jobId && setConfirmDeleteId(jobId)}
                            >
                                <Trash2 size={20} className="text-white" />
                            </button>
                        )}
                        {infoButton}
                    </div>
                </div>
            </div>
            </>
        );
    }

    if (status === JobStatuses.error) {
        return (
            <>
            {confirmDeleteId && onDelete && (
                <DeleteMediaModal
                    isDeleting={isDeleting}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setConfirmDeleteId(null)}
                />
            )}
            {infoVisible && <MediaInfoPopup job={job} onClose={() => setInfoVisible(false)} />}
            <div className="group flex relative rounded-2xl border border-error/15 bg-transparent flex flex-col items-center justify-center aspect-square overflow-hidden">
                <div className="flex flex-col items-center gap-6">
                    <CircleOff size={40} strokeWidth={1} className="text-error/30 animate-pulse" />
                    <div className="text-center">
                        <span className="text-[10px] uppercase tracking-[0.4em] text-error/60">
                            Error
                        </span>
                        <p className="text-[9px] uppercase tracking-widest text-base-content/20 mt-1">
                            Something went wrong
                        </p>
                    </div>
                </div>
                {cornerTL}{cornerTR}{cornerBL}{cornerBR}
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    {canDelete && onDelete && (
                        <button
                            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-error transition-colors cursor-pointer"
                            onClick={() => jobId && setConfirmDeleteId(jobId)}
                        >
                            <Trash2 size={20} className="text-white" />
                        </button>
                    )}
                    {canRestart && onRegenerate && (
                        <button
                            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-primary transition-colors cursor-pointer"
                            onClick={() => jobId && onRegenerate(jobId)}
                        >
                            <RefreshCcw size={20} className="text-white spin-once-on-hover" />
                        </button>
                    )}
                    {infoButton}
                </div>
            </div>
            </>
        );
    }

    if (status === JobStatuses.completed) {
        if (!url) {
            return (
                <div className="relative rounded-2xl border border-base-content/10 bg-base-200/30 aspect-square" />
            );
        }

        const mediaTypeLabel = job.mediaType === MediaTypes.video
            ? 'video'
            : job.mediaType === MediaTypes.audio
                ? 'audio'
                : 'image';

        return (
            <>
            {confirmDeleteId && onDelete && (
                <DeleteMediaModal
                    isDeleting={isDeleting}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setConfirmDeleteId(null)}
                />
            )}
            {infoVisible && (
                <MediaInfoPopup
                    job={job}
                    onClose={() => setInfoVisible(false)}
                />
            )}
            {shareVisible && url && (
                <SharePopup
                    url={url}
                    onClose={() => setShareVisible(false)}
                />
            )}
            <div
                className="group relative rounded-2xl border border-base-content/10 bg-base-200/30 overflow-hidden cursor-pointer aspect-square"
                onClick={(e) => onPhotoClick(url, e.currentTarget.getBoundingClientRect(), job.mediaType ?? MediaTypes.image, job.resultThumbnailUrl)}
            >
                {job.mediaType === MediaTypes.audio ? (
                    <div className="absolute inset-0">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative flex items-center justify-center">
                                <div className="absolute w-20 h-20 rounded-full border border-primary/30 animate-audio-ring" style={{ animationDelay: '0s' }} />
                                <div className="absolute w-20 h-20 rounded-full border border-primary/20 animate-audio-ring" style={{ animationDelay: '1.2s' }} />
                                <div className="absolute w-20 h-20 rounded-full border border-primary/10 animate-audio-ring" style={{ animationDelay: '2.0s' }} />
                                <Play size={50} strokeWidth={1} className="relative z-10 text-primary/50 group-hover:text-primary group-hover:scale-125 transition-all duration-300" />
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-3 pb-3">
                            {([
                                [0,    1.9 ], [0.18, 2.8 ], [0.06, 1.65], [0.3,  3.2 ], [0.12, 2.3 ],
                                [0.22, 2.6 ], [0.08, 1.8 ], [0.28, 3.0 ], [0.04, 2.1 ], [0.14, 3.4 ],
                                [0.24, 1.55], [0.02, 2.7 ], [0.16, 2.9 ], [0.32, 1.95], [0.1,  3.6 ],
                                [0.26, 2.4 ], [0.07, 2.0 ], [0.2,  3.15], [0.35, 2.55], [0.03, 1.5 ],
                            ] as [number, number][]).map(([delay, duration], i) => (
                                <div
                                    key={i}
                                    className="w-[3px] h-8 bg-primary/40 group-hover:bg-primary/70 rounded-full animate-equalizer transition-colors duration-300"
                                    style={{ animationDelay: `${delay}s`, animationDuration: `${duration}s`, transformOrigin: 'bottom' }}
                                />
                            ))}
                        </div>
                    </div>
                ) : job.mediaType === MediaTypes.video ? (
                    <>
                        {displayUrl !== url ? (
                            <img
                                src={displayUrl}
                                alt={`Avatar video ${idx + 1}`}
                                loading="lazy"
                                className="absolute inset-0 w-full h-full object-cover object-top transition-all duration-500 group-hover:scale-105 group-hover:opacity-90"
                            />
                        ) : (
                            <video
                                src={url}
                                muted
                                loop
                                playsInline
                                preload="metadata"
                                className="absolute inset-0 w-full h-full object-cover object-top transition-all duration-500 group-hover:scale-105 group-hover:opacity-90"
                                onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play()}
                                onMouseLeave={e => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                            />
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent pointer-events-none z-[1]" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[2]">
                            <div className="w-12 h-12 group-hover:w-14 group-hover:h-14 rounded-full border border-white/20 bg-black/30 backdrop-blur-sm flex items-center justify-center transition-all duration-300">
                                <Play size={18} className="text-white/70 group-hover:text-white ml-0.5 transition-all duration-300" />
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <img
                            src={displayUrl}
                            alt={`Avatar photo ${idx + 1}`}
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover object-top transition-all duration-500 group-hover:scale-105 group-hover:opacity-90"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent pointer-events-none z-[1]" />
                    </>
                )}

                {showOrder && (
                    <div className="absolute top-1 left-1 z-10">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-[0.8rem] text-white text-xs">
                            <span>{order}</span>
                        </div>
                    </div>
                )}

                <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    {canDelete && onDelete && (
                        <div className="tooltip tooltip-bottom" data-tip="Delete">
                            <button
                                className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-error transition-colors cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); jobId && setConfirmDeleteId(jobId); }}
                            >
                                <Trash2 size={20} className="text-white" />
                            </button>
                        </div>
                    )}
                    <div className="tooltip tooltip-bottom" data-tip="Download">
                        <button
                            disabled={isDownloading}
                            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-primary transition-colors cursor-pointer disabled:cursor-not-allowed"
                            onClick={async (e) => {
                                e.stopPropagation();
                                const mediaPath = job.resultMediaPath;
                                if (!mediaPath) return;
                                setIsDownloading(true);
                                try {
                                    const blob = await downloadMediaFromBucket(mediaPath);
                                    const blobUrl = URL.createObjectURL(blob);
                                    const anchor = document.createElement('a');
                                    anchor.href = blobUrl;
                                    anchor.download = `${jobId ?? 'photo'}.${blob.type.split('/')[1] || 'jpg'}`;
                                    anchor.click();
                                    URL.revokeObjectURL(blobUrl);
                                } finally {
                                    setIsDownloading(false);
                                }
                            }}
                        >
                            {isDownloading
                                ? <span className="loading loading-dots loading-xs text-white" />
                                : <CloudDownload size={20} className="text-white" />
                            }
                        </button>
                    </div>
                    <div className="tooltip tooltip-bottom" data-tip="Share">
                        <button
                            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-primary transition-colors cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); setShareVisible(v => !v); }}
                        >
                            <Share2 size={18} className="text-white" />
                        </button>
                    </div>
                    {canRestart && onRegenerate && (
                        <div className="tooltip tooltip-bottom" data-tip="Regenerate">
                            <button
                                className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-primary transition-colors cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); jobId && onRegenerate(jobId); }}
                            >
                                <RefreshCcw size={20} className="text-white spin-once-on-hover" />
                            </button>
                        </div>
                    )}
                    <div className="tooltip tooltip-bottom" data-tip="Info">
                        <button
                            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-info transition-colors cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); setInfoVisible(v => !v); }}
                        >
                            <Text size={20} className="text-white" />
                        </button>
                    </div>
                </div>

                <div className="absolute bottom-2 left-2 z-10">
                    <span className="px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-lg text-[9px] uppercase tracking-[0.2em] text-white/50">
                        {mediaTypeLabel}
                    </span>
                </div>
            </div>
            </>
        );
    }

    return null;
}

export default MediaCard;
