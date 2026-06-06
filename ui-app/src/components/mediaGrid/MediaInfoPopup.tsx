import { Maximize2, LayoutTemplate, MessageSquare, Copy, Check, Clock, Hd, CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { MediaTypes, type Job } from '@loom24/shared/types';

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
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-base-200/60">
            <div className="w-9 h-9 rounded-xl bg-base-100 flex items-center justify-center shrink-0 shadow-sm">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-[0.3em] text-base-content/40 mb-0.5">{label}</p>
                <p className="text-sm text-base-content leading-relaxed break-words">{value}</p>
            </div>
            {action && <div className="shrink-0 self-center">{action}</div>}
        </div>
    );
}

function MediaInfoPopup({ job, onClose }: Props) {
    useScrollLock();
    const mediaType = job.mediaType;
    const ratio = job.metadata?.ratio;
    const prompt = job.metadata?.userPrompt;
    const dimensions = job.metadata?.dimensions;
    const lengthSec = job.metadata?.lengthSec;
    const createdAt = job.createdAt
        ? new Date((job.createdAt as any)._seconds * 1000).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
        : null;
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!prompt) return;
        navigator.clipboard.writeText(prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div
                className="absolute inset-0 bg-base-300/60 animate-modal-backdrop"
                onClick={onClose}
            />
            <div className="relative bg-base-100 w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-base-content/5 p-8 animate-modal-card">
                <div className="flex flex-col gap-2">
                    {dimensions && (
                        <InfoRow
                            icon={<Maximize2 size={22} className="text-base-content/50" />}
                            label="Size"
                            value={dimensions.replace('x', ' × ')}
                        />
                    )}
                    {lengthSec != null && (
                        <InfoRow
                            icon={<Clock size={22} className="text-base-content/50" />}
                            label="Length"
                            value={`${lengthSec} sec`}
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
                    {(mediaType === MediaTypes.image || mediaType === MediaTypes.video) && (
                        <InfoRow
                            icon={<Hd size={22} className="text-base-content/50" />}
                            label="High Definition"
                            value='Yes'
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
