import { X, Images } from 'lucide-react';
import { MediaTypes, JobStatuses, JobTargets, type Job } from '../../types/job';
import { VIDEO_RATIOS, type VideoRatio } from '../../types/image';
import { useScrollLock } from '../../hooks/useScrollLock';

const SUPPORTED_RATIOS = new Set<string>(VIDEO_RATIOS.map(r => r.value));

type Props = {
    isOpen: boolean;
    onClose: () => void;
    jobs: Job[];
    onSelect: (mediaPath: string, mediaUrl: string, ratio: VideoRatio) => void;
    title?: string;
};

function MediaSelectorModal({ isOpen, onClose, jobs, onSelect, title = 'Select Reference Image' }: Props) {
    const images = jobs.filter(
        (job) => job.mediaType === MediaTypes.image &&
                 job.target === JobTargets.avatarMedia &&
                 job.status === JobStatuses.completed &&
                 job.resultMediaUrl &&
                 SUPPORTED_RATIOS.has(job.metadata?.ratio ?? '')
    );

    useScrollLock(isOpen);
    if (!isOpen) return null;

    const handleSelect = (job: Job) => {
        onSelect(job.resultMediaPath!, job.resultMediaUrl!, job.metadata!.ratio as VideoRatio);
        onClose();
    };

    return (
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

                <div className="overflow-y-auto">
                    {images.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3 text-base-content/30">
                            <Images size={40} strokeWidth={1.5} />
                            <span className="text-xs uppercase tracking-widest">No generated images yet</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3">
                            {images.map((job) => (
                                <button
                                    key={job.id}
                                    onClick={() => handleSelect(job)}
                                    className="group relative aspect-square rounded-xl overflow-hidden border border-base-content/10 hover:border-primary/50 transition-all cursor-pointer"
                                >
                                    <img
                                        src={job.resultMediaUrl!}
                                        className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105 group-hover:opacity-90"
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
                    )}
                </div>
            </div>
        </div>
    );
}

export default MediaSelectorModal;
