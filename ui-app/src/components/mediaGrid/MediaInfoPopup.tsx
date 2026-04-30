import { Maximize2, LayoutTemplate, MessageSquare, ScanFace } from 'lucide-react';
import type { InferenceJob } from '../../types/job';
import { AVATAR_REFERENCE_NAME } from '../../utils/prompt';

type Props = {
    job: Partial<InferenceJob>;
    naturalSize?: { w: number; h: number } | null;
    onClose: () => void;
};

type RowProps = {
    icon: React.ReactNode;
    label: string;
    value: string;
};

function InfoRow({ icon, label, value }: RowProps) {
    return (
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-base-200/60">
            <div className="w-9 h-9 rounded-xl bg-base-100 flex items-center justify-center shrink-0 shadow-sm">
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.3em] text-base-content/40 mb-0.5">{label}</p>
                <p className="text-sm text-base-content leading-relaxed break-words">{value}</p>
            </div>
        </div>
    );
}

function MediaInfoPopup({ job, naturalSize, onClose }: Props) {
    const ratio = job.metadata?.ratio;
    const rawPrompt = job.input?.inference?.prompt;
    const prompt = rawPrompt?.startsWith(`${AVATAR_REFERENCE_NAME} `)
        ? rawPrompt.slice(AVATAR_REFERENCE_NAME.length + 1)
        : rawPrompt;
    const bestFaceMatch = job.result?.bestFaceMatch;
    
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-base-300/60 backdrop-blur-sm animate-modal-backdrop"
                onClick={onClose}
            />
            <div className="relative bg-base-100 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-base-content/5 p-8 animate-modal-card">
                <div className="flex flex-col gap-2">
                    {naturalSize && (
                        <InfoRow
                            icon={<Maximize2 size={20} className="text-base-content/50" />}
                            label="Size"
                            value={`${naturalSize.w} × ${naturalSize.h}`}
                        />
                    )}
                    <InfoRow
                        icon={<LayoutTemplate size={20} className="text-base-content/50" />}
                        label="Ratio"
                        value={ratio ?? '—'}
                    />
                    {bestFaceMatch != null && bestFaceMatch > 0 && (
                        <InfoRow
                            icon={<ScanFace size={20} className="text-base-content/50" />}
                            label="Face Match"
                            value={`${(bestFaceMatch * 100).toFixed(0)}%`}
                        />
                    )}
                    {prompt && (
                        <InfoRow
                            icon={<MessageSquare size={20} className="text-base-content/50" />}
                            label="Prompt"
                            value={prompt}
                        />
                    )}
                </div>

                <button
                    onClick={onClose}
                    className="btn btn-ghost btn-lg rounded-2xl w-full uppercase tracking-widest text-xs opacity-50 hover:opacity-100 mt-6"
                >
                    Close
                </button>
            </div>
        </div>
    );
}

export default MediaInfoPopup;
