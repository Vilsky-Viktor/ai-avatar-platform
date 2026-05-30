import { Sparkles, User, Clock, Loader2, CircleOff, RefreshCcw, Trash2, Text, CloudDownload, Play, Hd } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { JobStatuses, MediaTypes, type Job } from '../types/job';
import { downloadMediaFromBucket } from '../services/storage';
import DeleteMediaModal from './mediaGrid/DeleteMediaModal';
import MediaInfoPopup from './mediaGrid/MediaInfoPopup';

type FaceMatchThresholds = {
    green: number;
    yellow: number;
    orange: number;
};

const DEFAULT_THRESHOLDS: FaceMatchThresholds = {
    green: 0.7,
    yellow: 0.6,
    orange: 0.55,
};

type Props = {
    job?: Partial<Job> | null;
    idx: number;
    onPhotoClick: (url: string, rect: DOMRect, mediaType: MediaTypes) => void;
    onRegenerate?: (jobId: string) => void;
    onDelete?: (jobId: string) => void | Promise<void>;
    canRestart?: boolean;
    canDelete?: boolean;
    showOrder?: boolean;
    faceMatchThresholds?: FaceMatchThresholds;
};

function MediaCard({
    job,
    idx,
    onPhotoClick,
    onRegenerate,
    onDelete,
    canDelete = false,
    canRestart = true,
    showOrder = false,
    faceMatchThresholds = DEFAULT_THRESHOLDS,
}: Props) {
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [infoVisible, setInfoVisible] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const startRef = useRef<number | null>(null);

    useEffect(() => {
        if (job?.status !== JobStatuses.generating) return;
        const ts = (job.updatedAt ?? job.createdAt) as any;
        const startSec: number = ts?.seconds ?? ts?._seconds ?? Date.now() / 1000;
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
            <div className="flex relative rounded-[1rem] border border-dashed border-base-content/10 bg-transparent items-center justify-center aspect-square">
                <div className="flex flex-col items-center gap-4">
                    <User size={50} strokeWidth={1} className="text-base-content/10" />
                    <div className="text-center">
                        <span className="text-[12px] font-bold uppercase tracking-[0.4em] text-base-content/30">
                            Photo {idx + 1}
                        </span>
                        <p className="text-[9px] font-medium uppercase tracking-widest text-base-content/20 mt-1">
                            Click generate
                        </p>
                    </div>
                </div>
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-base-content/10 pointer-events-none" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-base-content/10 pointer-events-none" />
            </div>
        );
    }

    const status = job.status;
    const url = job.resultMediaUrl;
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
            <div className="group flex relative rounded-[1rem] border border-primary/20 bg-primary/[0.02] flex flex-col items-center justify-center aspect-square">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <Clock size={50} strokeWidth={1} className="text-base-content/30 animate-pulse" />
                    </div>
                    <div className="text-center">
                        <span className="text-[12px] font-bold uppercase tracking-[0.4em] text-primary">
                            Waiting
                        </span>
                        <p className="text-[9px] font-medium uppercase tracking-widest text-base-content/20 mt-1">
                            Queue processing
                        </p>
                    </div>
                </div>
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
            <div className="group flex relative rounded-[1rem] border border-primary/20 bg-primary/[0.02] flex flex-col items-center justify-center aspect-square">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <Loader2 size={60} strokeWidth={1} className="text-primary animate-spin" />
                        <Sparkles size={20} className="absolute -top-3 -right-3 text-primary animate-pulse" />
                    </div>
                    <div className="text-center">
                        <span className="text-[12px] font-bold uppercase tracking-[0.4em] text-primary">
                            Generating
                        </span>
                        <p className="text-[15px] font-mono font-light text-base-content/25 tracking-widest">
                            {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
                        </p>
                    </div>
                </div>
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
            <div className="group flex relative rounded-[1rem] border border-error/20 bg-error/[0.02] flex flex-col items-center justify-center aspect-square">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <CircleOff size={50} strokeWidth={1} className="text-base-content/30 animate-pulse" />
                    </div>
                    <div className="text-center">
                        <span className="text-[12px] font-bold uppercase tracking-[0.4em] text-error">
                            Error
                        </span>
                        <p className="text-[9px] font-medium uppercase tracking-widest text-base-content/20 mt-1">
                            Something went wrong
                        </p>
                    </div>
                </div>
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
                <div className="relative rounded-[1rem] border border-base-content/10 bg-base-200/30 aspect-square" />
            );
        }

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
            <div
                className="group relative rounded-[1rem] border border-base-content/10 bg-base-200/30 overflow-hidden cursor-pointer aspect-square"
                onClick={(e) => onPhotoClick(url, e.currentTarget.getBoundingClientRect(), job.mediaType ?? MediaTypes.image)}
            >
                {job.mediaType === MediaTypes.video ? (
                    <>
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
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity duration-300">
                            <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                                <Play size={18} className="text-white fill-white ml-0.5" />
                            </div>
                        </div>
                    </>
                ) : (
                    <img
                        src={url}
                        alt={`Avatar photo ${idx + 1}`}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover object-top transition-all duration-500 group-hover:scale-105 group-hover:opacity-90"
                    />
                )}

                {showOrder && (
                    <div className="absolute top-1 left-1 z-10">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-[0.8rem] shadow-lg text-white text-xs font-medium">
                            <span className="font-bold">{order}</span>
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
                                    const a = document.createElement('a');
                                    a.href = blobUrl;
                                    a.download = `${jobId ?? 'photo'}.${blob.type.split('/')[1] || 'jpg'}`;
                                    a.click();
                                    URL.revokeObjectURL(blobUrl);
                                } finally {
                                    setIsDownloading(false);
                                }
                            }}
                        >
                            {isDownloading
                                ? <span className="loading loading-spinner loading-xs text-white" />
                                : <CloudDownload size={20} className="text-white" />
                            }
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
                    <div className="px-1 py-0.5 bg-black/40 backdrop-blur-md rounded-[0.3rem] shadow-lg text-white flex items-center justify-center">
                        <Hd size={22} strokeWidth={1.5} className="text-white" />
                    </div>
                </div>
            </div>
            </>
        );
    }

    return null;
}

export default MediaCard;
