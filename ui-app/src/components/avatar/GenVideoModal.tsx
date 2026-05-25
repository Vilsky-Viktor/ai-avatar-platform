import { useState, useEffect } from 'react';
import { X, Sparkles, ImagePlus, Trash2, Clock } from 'lucide-react';
import type { Avatar } from '../../types/avatar';
import { type VideoRatio, VIDEO_RATIOS } from '../../types/image';
import { useScrollLock } from '../../hooks/useScrollLock';
import MediaSelectorModal from '../mediaSelector/MediaSelectorModal';
import type { InferenceJob } from '../../types/job';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    avatar?: Avatar;
    jobs: InferenceJob[];
    onGenerate: (prompt: string, ratio: VideoRatio, referenceImagePath: string | null, lengthSec: number) => Promise<void>;
};

function GenVideoModal({ isOpen, onClose, avatar, jobs, onGenerate }: Props) {
    const [prompt, setPrompt] = useState('');
    const [ratio, setRatio] = useState<VideoRatio>('9:16');
    const [loading, setLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{ path: string; url: string } | null>(null);
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [lengthSec, setLengthSec] = useState(2);

    useEffect(() => {
        if (!isOpen) {
            setPrompt('');
            setSelectedImage(null);
        }
    }, [isOpen]);

    useScrollLock(isOpen);
    if (!isOpen) return null;

    const canGenerate = () => prompt.trim().length >= 5 && !loading;

    const handleGenerate = async () => {
        if (!canGenerate()) return;
        setLoading(true);
        await onGenerate(prompt.trim(), ratio, selectedImage?.path ?? null, lengthSec);
        setLoading(false);
    };

    return (
        <>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="absolute inset-0 bg-base-300/60 animate-modal-backdrop" onClick={onClose} />
                <div className="relative bg-base-100 rounded-3xl shadow-2xl border border-base-content/5 flex flex-col gap-7 p-10 w-[680px] animate-modal-card">

                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 w-11 h-11 flex items-center justify-center rounded-full text-base-content/30 hover:text-base-content hover:bg-base-200 transition-all cursor-pointer"
                    >
                        <X size={25} />
                    </button>

                    <textarea
                        autoFocus
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                        placeholder={`Describe the video you want to generate with ${avatar?.name ?? 'your avatar'}...`}
                        rows={5}
                        className="mt-8 w-full bg-base-200/50 border border-base-content/10 rounded-2xl px-6 py-5 text-base text-base-content placeholder:text-base-content/25 resize-none focus:outline-none focus:border-primary/40 transition-colors"
                    />

                    <div className="flex items-center justify-between">
                        {/* Reference image */}
                        <div className="group relative w-49 h-49 rounded-xl overflow-hidden border border-base-content/10 shrink-0">
                            {selectedImage ? (
                                <>
                                    <img
                                        src={selectedImage.url}
                                        className="w-full h-full object-cover object-top cursor-pointer"
                                        onClick={() => avatar?.id && setSelectorOpen(true)}
                                    />
                                    <button
                                        onClick={() => setSelectedImage(null)}
                                        className="absolute top-1 right-1 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-error transition-all cursor-pointer"
                                    >
                                        <Trash2 size={15} className="text-white" />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => avatar?.id && setSelectorOpen(true)}
                                    className="w-full h-full flex flex-col items-center justify-center gap-2 text-base-content/30 hover:text-primary transition-all cursor-pointer border border-dashed border-base-content/20 hover:border-primary/50 rounded-xl"
                                >
                                    <ImagePlus size={28} strokeWidth={1.5} />
                                    <span className="text-[11px] uppercase tracking-widest">Reference</span>
                                </button>
                            )}
                        </div>

                        {/* Ratio + length switchers */}
                        <div className="flex flex-col gap-3 items-end">
                            <div className="flex gap-3">
                                {VIDEO_RATIOS.map(r => (
                                    <button
                                        key={r.value}
                                        onClick={() => setRatio(r.value)}
                                        className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                                            ratio === r.value
                                                ? 'border-primary/50 bg-primary/5 text-primary'
                                                : 'border-base-content/10 text-base-content/30 hover:border-base-content/20 hover:text-base-content/50'
                                        }`}
                                    >
                                        <div
                                            className={`rounded-sm border-2 transition-colors duration-200 ${ratio === r.value ? 'border-primary' : 'border-current'}`}
                                            style={{ width: r.w, height: r.h }}
                                        />
                                        <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">{r.value}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-3 mt-5 w-full">
                                <Clock size={18} className="text-base-content/30 shrink-0" />
                                <input
                                    type="range"
                                    min={2}
                                    max={10}
                                    step={2}
                                    value={lengthSec}
                                    onChange={e => setLengthSec(Number(e.target.value))}
                                    className="range range-primary range-xs flex-1"
                                />
                                <span className="text-sm font-semibold text-primary w-12 text-right shrink-0">{lengthSec} sec</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleGenerate}
                            disabled={!canGenerate()}
                            className="group flex items-center gap-3 px-7 py-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary hover:border-primary text-primary hover:text-primary-content transition-all duration-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <Sparkles size={16} className="group-hover:animate-pulse" />
                            <span className="text-sm font-semibold uppercase tracking-[0.2em]">Generate</span>
                            {loading && <span className="loading loading-spinner loading-xs" />}
                        </button>
                    </div>
                </div>
            </div>

            <MediaSelectorModal
                isOpen={selectorOpen}
                onClose={() => setSelectorOpen(false)}
                jobs={jobs}
                onSelect={(path, url, imageRatio) => {
                    setSelectedImage({ path, url });
                    setRatio(imageRatio);
                }}
            />
        </>
    );
}

export default GenVideoModal;
