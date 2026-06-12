import { Maximize2, LayoutTemplate, MessageSquare, Copy, Check, Clock, CalendarDays, Hash } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { type Job } from '@loom24/shared/types';

type Props = {
    job: Partial<Job>;
    onClose: () => void;
};

type RowProps = {
    icon: React.ReactNode;
    label: string;
    value: string;
    action?: React.ReactNode;
};

function InfoRow({ icon, label, value, action }: RowProps) {
    return (
        <div className="flex items-start gap-4 py-3.5 border-b border-base-content/5 last:border-0">
            <div className="w-8 h-8 rounded-xl bg-base-content/5 flex items-center justify-center shrink-0">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-[0.25em] text-base-content/30 mb-1">{label}</p>
                <p className="text-sm text-base-content/70 leading-relaxed break-words">{value}</p>
            </div>
            {action && <div className="shrink-0 self-center">{action}</div>}
        </div>
    );
}

function resolutionLabel(dimensions: string): string {
    const [width, height] = dimensions.split('x').map(Number);
    const maxDim = Math.max(width, height);
    if (maxDim >= 3840) return '4K';
    if (maxDim >= 2048) return '2K';
    if (maxDim >= 1280) return 'HD';
    return 'SD';
}

function MediaInfoPopup({ job, onClose }: Props) {
    useScrollLock();
    useEscapeKey(onClose);
    const ratio = job.metadata?.ratio;
    const prompt = job.metadata?.userPrompt;
    const dimensions = job.metadata?.dimensions;
    const durationSec = job.metadata?.durationSec;
    const createdAt = job.createdAt
        ? job.createdAt.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
        : null;
    const [copied, setCopied] = useState(false);
    const [copiedId, setCopiedId] = useState(false);

    const handleCopy = () => {
        if (!prompt) return;
        navigator.clipboard.writeText(prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyId = () => {
        if (!job.id) return;
        navigator.clipboard.writeText(job.id);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
    };
    
    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div
                className="absolute inset-0 bg-base-300/60 animate-modal-backdrop"
                onClick={onClose}
            />
            <div className="relative bg-base-100 w-full max-w-lg rounded-2xl border border-base-content/5 p-8 animate-modal-card">
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                        <span className="w-8 h-px bg-primary/50" />
                        <h3 className="text-xl uppercase tracking-[0.2em] text-base-content/70">Media info</h3>
                    </div>
                    <div className="flex flex-col">
                    {job.id && (
                        <InfoRow
                            icon={<Hash size={22} className="text-base-content/50" />}
                            label="ID"
                            value={job.id}
                            action={
                                <button
                                    onClick={handleCopyId}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-base-content/40 hover:text-base-content hover:bg-base-300 transition-colors cursor-pointer"
                                >
                                    {copiedId ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            }
                        />
                    )}
                    {dimensions && (
                        <InfoRow
                            icon={<Maximize2 size={22} className="text-base-content/50" />}
                            label="Size"
                            value={dimensions.replace('x', ' × ')}
                        />
                    )}
                    {durationSec != null && (
                        <InfoRow
                            icon={<Clock size={22} className="text-base-content/50" />}
                            label="Length"
                            value={`${durationSec} sec`}
                        />
                    )}
                    {createdAt && (
                        <InfoRow
                            icon={<CalendarDays size={22} className="text-base-content/50" />}
                            label="Created"
                            value={createdAt}
                        />
                    )}
                    {ratio && (
                        <InfoRow
                            icon={<LayoutTemplate size={22} className="text-base-content/50" />}
                            label="Ratio"
                            value={ratio}
                        />
                    )}
                    {dimensions && (
                        <InfoRow
                            icon={<span className="text-[10px] font-bold tracking-wider text-base-content/50">{resolutionLabel(dimensions)}</span>}
                            label="Resolution"
                            value={resolutionLabel(dimensions)}
                        />
                    )}
                    {prompt && (
                        <InfoRow
                            icon={<MessageSquare size={22} className="text-base-content/50" />}
                            label="Prompt"
                            value={prompt ?? '-'}
                            action={
                                <button
                                    onClick={handleCopy}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-base-content/40 hover:text-base-content hover:bg-base-300 transition-colors cursor-pointer"
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            }
                        />
                    )}
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-7 py-3.5 rounded-xl text-xs uppercase tracking-[0.2em] cursor-pointer text-base-content/30 hover:text-base-content/70 transition-colors duration-300"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default MediaInfoPopup;
