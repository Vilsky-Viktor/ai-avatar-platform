import { Sparkles, User, Clock, Loader2, CircleOff, RefreshCcw, Trash2 } from 'lucide-react';
import { JobStatuses, type InferenceJob } from '../types/job';

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
    job?: Partial<InferenceJob> | null;
    idx: number;
    onPhotoClick: (url: string, rect: DOMRect) => void;
    onRegenerate?: (jobId: string) => void;
    onDelete?: (jobId: string) => void;
    canRestart?: boolean;
    canDelete?: boolean;
    showOrder?: boolean;
    faceMatchThresholds?: FaceMatchThresholds;
};

function PhotoCard({
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
    const url = job.result?.mediaUrl;
    const bestFaceMatch = job.result?.bestFaceMatch ?? 0;
    const order = job.order;
    const jobId = job.id;

    if (status === JobStatuses.pending) {
        return (
            <div className="flex relative rounded-[1rem] border border-primary/20 bg-primary/[0.02] flex flex-col items-center justify-center aspect-square">
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
            </div>
        );
    }

    if (status === JobStatuses.generating) {
        return (
            <div className="flex relative rounded-[1rem] border border-primary/20 bg-primary/[0.02] flex flex-col items-center justify-center aspect-square">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <Loader2 size={60} strokeWidth={1} className="text-primary animate-spin" />
                        <Sparkles size={20} className="absolute -top-3 -right-3 text-primary animate-pulse" />
                    </div>
                    <div className="text-center">
                        <span className="text-[12px] font-bold uppercase tracking-[0.4em] text-primary">
                            Generating
                        </span>
                        <p className="text-[9px] font-medium uppercase tracking-widest text-base-content/20 mt-1">
                            Creating a new life
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (status === JobStatuses.error) {
        return (
            <div className="flex relative rounded-[1rem] border border-error/20 bg-error/[0.02] flex flex-col items-center justify-center aspect-square">
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
                {canRestart && onRegenerate && (
                    <button
                        className="absolute top-1 right-1 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-primary transition-colors cursor-pointer"
                        onClick={() => jobId && onRegenerate(jobId)}
                    >
                        <RefreshCcw size={18} className="text-white spin-once-on-hover" />
                    </button>
                )}
            </div>
        );
    }

    if (status === JobStatuses.completed) {
        if (!url) {
            return (
                <div className="relative rounded-[1rem] border border-base-content/10 bg-base-200/30 aspect-square" />
            );
        }

        const matchColor =
            bestFaceMatch >= faceMatchThresholds.green ? 'bg-green-400'
            : bestFaceMatch >= faceMatchThresholds.yellow ? 'bg-yellow-400'
            : bestFaceMatch >= faceMatchThresholds.orange ? 'bg-orange-400'
            : 'bg-red-400';

        return (
            <div
                className="group relative rounded-[1rem] border border-base-content/10 bg-base-200/30 overflow-hidden cursor-pointer aspect-square"
                onClick={(e) => onPhotoClick(url, e.currentTarget.getBoundingClientRect())}
            >
                <img
                    src={url}
                    alt={`Avatar photo ${idx + 1}`}
                    className="absolute inset-0 w-full h-full object-cover object-top transition-all duration-500 group-hover:scale-105 group-hover:opacity-90"
                />

                {showOrder && (
                    <div className="absolute top-1 left-1 z-10">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-[0.8rem] shadow-lg text-white text-xs font-medium">
                            <span className="font-bold">{order}</span>
                        </div>
                    </div>
                )}

                {canRestart && onRegenerate && (
                    <button
                        className="absolute top-1 right-10 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-primary transition-all cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); jobId && onRegenerate(jobId); }}
                    >
                        <RefreshCcw size={18} className="text-white spin-once-on-hover" />
                    </button>
                )}
                {canDelete && onDelete && (
                    <button
                        className="absolute top-1 right-1 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-error transition-all cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); jobId && onDelete(jobId); }}
                    >
                        <Trash2 size={15} className="text-white" />
                    </button>
                )}

                {bestFaceMatch > 0 && (
                    <div className="absolute bottom-1 right-1 z-10">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-[0.8rem] shadow-lg text-white text-xs font-medium">
                            <span className="font-bold">
                                {(bestFaceMatch * 100).toFixed(0)}%
                            </span>
                            <div className={`w-2 h-2 rounded-full ${matchColor}`} />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return null;
}

export default PhotoCard;
