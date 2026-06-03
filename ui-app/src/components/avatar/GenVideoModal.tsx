import { useState, useEffect } from 'react';
import { X, Sparkles, ImagePlus, Trash2, Clock, Mic } from 'lucide-react';
import type { Avatar } from '../../types/avatar';
import { type VideoRatio, VIDEO_RATIOS } from '../../types/image';
import { useScrollLock } from '../../hooks/useScrollLock';
import MediaSelectorModal from '../mediaSelector/MediaSelectorModal';
import type { Job } from '../../types/job';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    avatar?: Avatar;
    jobs: Job[];
    onGenerate: (prompt: string, ratio: VideoRatio, referenceImagePath: string | null, lengthSec: number, audioText: string | null) => Promise<void>;
};

function GenVideoModal({ isOpen, onClose, avatar, jobs, onGenerate }: Props) {
    const [prompt, setPrompt] = useState('');
    const [ratio, setRatio] = useState<VideoRatio>('9:16');
    const [loading, setLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{ path: string; url: string } | null>(null);
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [lengthSec, setLengthSec] = useState(2);
    const [generateVoice, setGenerateVoice] = useState(false);
    const [audioText, setAudioText] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setPrompt('');
            setSelectedImage(null);
            setGenerateVoice(false);
            setAudioText('');
        }
    }, [isOpen]);

    useScrollLock(isOpen);
    if (!isOpen) return null;

    const canGenerate = () => prompt.trim().length >= 5 && !loading;

    const handleGenerate = async () => {
        if (!canGenerate()) return;
        setLoading(true);
        await onGenerate(prompt.trim(), ratio, selectedImage?.path ?? null, lengthSec, generateVoice && audioText.trim() ? audioText.trim() : null);
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
                        <div className="flex flex-col gap-7 flex-1 pl-8 items-end">
                            {/* Length slider */}
                            <div className="flex items-center gap-3 w-full">
                                <Clock size={18} className="text-base-content/30 shrink-0" />
                                <input
                                    type="range"
                                    min={3}
                                    max={10}
                                    step={1}
                                    value={lengthSec}
                                    onChange={e => setLengthSec(Number(e.target.value))}
                                    className="range range-primary range-xs flex-1"
                                />
                                <span className="text-sm font-semibold text-primary w-12 text-right shrink-0">{lengthSec} sec</span>
                            </div>

                            {/* Ratio switcher */}
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
                        </div>
                    </div>

                    <div className={`rounded-2xl border transition-all duration-300 ${generateVoice ? 'border-primary/30 bg-primary/[0.03]' : 'border-base-content/10'}`}>
                        <label className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-300 ${generateVoice ? 'bg-primary/10 text-primary' : 'bg-base-200 text-base-content/30'}`}>
                                    <Mic size={17} />
                                </div>
                                <div>
                                    <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${generateVoice ? 'text-primary' : 'text-base-content/50'}`}>Generate voice</p>
                                    <p className="text-[10px] text-base-content/30 mt-0.5">Add avatar speech to the video</p>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={generateVoice}
                                onChange={e => setGenerateVoice(e.target.checked)}
                                className="checkbox checkbox-primary checkbox-sm"
                            />
                        </label>

                        {generateVoice && (
                            <div className="px-5 pb-5">
                                <textarea
                                    autoFocus
                                    value={audioText}
                                    onChange={e => setAudioText(e.target.value)}
                                    placeholder={`Write what you want ${avatar?.name ?? 'your avatar'} to say in the video...`}
                                    rows={3}
                                    className="w-full bg-base-200/50 border border-base-content/10 rounded-2xl px-5 py-4 text-base text-base-content placeholder:text-base-content/25 resize-none focus:outline-none focus:border-primary/40 transition-colors"
                                />
                            </div>
                        )}
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
