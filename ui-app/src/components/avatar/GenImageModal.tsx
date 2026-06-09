import { useState, useEffect, useRef } from 'react';
import { Sparkles, ImagePlus, Trash2 } from 'lucide-react';
import type { Avatar } from '@loom24/shared/types';
import { type ImageRatio, IMAGE_RATIOS } from '../../types/image';
import { useScrollLock } from '../../hooks/useScrollLock';

const EMPTY_SLOTS: [null, null, null] = [null, null, null];

type Props = {
    isOpen: boolean;
    onClose: () => void;
    avatar?: Avatar;
    onGenerate: (prompt: string, ratio: ImageRatio, referenceImages: File[]) => Promise<void>;
};

function GenImageModal({ isOpen, onClose, avatar, onGenerate }: Props) {
    const [prompt, setPrompt] = useState('');
    const [ratio, setImageRatio] = useState<ImageRatio>('3:4');
    const [loading, setLoading] = useState(false);
    const [slots, setSlots] = useState<(File | null)[]>([...EMPTY_SLOTS]);
    const [previews, setPreviews] = useState<(string | null)[]>([null, null, null]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRefs = [
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
    ];

    useEffect(() => {
        if (!isOpen) {
            setPrompt('');
            setSlots([...EMPTY_SLOTS]);
            setPreviews([null, null, null]);
        }
    }, [isOpen]);

    useEffect(() => {
        previews.forEach(url => url && URL.revokeObjectURL(url));
        const urls = slots.map(f => f ? URL.createObjectURL(f) : null);
        setPreviews(urls);
        return () => urls.forEach(url => url && URL.revokeObjectURL(url));
    }, [slots]);

    useScrollLock(isOpen);
    if (!isOpen) return null;

    const handleFileChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSlots(prev => prev.map((s, i) => i === idx ? file : s));
        e.target.value = '';
    };

    const removeSlot = (idx: number) => {
        setSlots(prev => prev.map((s, i) => i === idx ? null : s));
    };

    const insertReference = (idx: number) => {
        const tag = `image ${idx + 1}`;
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart ?? prompt.length;
        const end   = el.selectionEnd   ?? prompt.length;
        const before = prompt.slice(0, start);
        const after  = prompt.slice(end);
        const separator = before.length > 0 && !before.endsWith(' ') ? ' ' : '';
        const next = `${before}${separator}${tag} ${after}`;
        setPrompt(next);
        const newCursor = before.length + separator.length + tag.length + 1;
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(newCursor, newCursor);
        });
    };

    const canGenerate = () => prompt.trim().length >= 5 && !loading;

    const handleGenerate = async () => {
        if (!canGenerate()) return;
        setLoading(true);
        await onGenerate(prompt.trim(), ratio, slots.filter((f): f is File => f !== null));
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="absolute inset-0 bg-base-300/60 animate-modal-backdrop" onClick={onClose} />
            <div className="relative bg-base-100 rounded-2xl border border-base-content/5 flex flex-col gap-6 p-10 w-[620px] animate-modal-card">

                {/* Title */}
                <div className="flex items-center gap-3">
                    <span className="w-8 h-px bg-primary/50" />
                    <h3 className="text-xl uppercase tracking-[0.2em] text-base-content/70">Generate photo</h3>
                </div>

                {/* Prompt */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.25em] text-base-content/40">Prompt</span>
                    <textarea
                        ref={textareaRef}
                        autoFocus
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                        placeholder={`Describe the photo you want to generate with ${avatar?.name ?? 'your avatar'}...`}
                        rows={4}
                        className="w-full bg-base-200/50 border border-base-content/10 rounded-2xl px-5 py-4 text-sm text-base-content placeholder:text-base-content/25 resize-none focus:outline-none focus:border-primary/40 transition-colors"
                    />
                </div>

                {/* Reference images */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.25em] text-base-content/40">Reference images · optional</span>
                    <div className="flex items-center gap-3">
                        {slots.map((_slot, idx) => (
                            <div key={idx} className="group relative flex-1 aspect-square rounded-xl overflow-hidden border border-base-content/10">
                                {previews[idx] ? (
                                    <>
                                        <img
                                            src={previews[idx]!}
                                            onClick={() => insertReference(idx)}
                                            className="w-full h-full object-cover object-top cursor-pointer"
                                        />
                                        <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-white text-[10px] uppercase tracking-widest pointer-events-none">
                                            image {idx + 1}
                                        </span>
                                        <button
                                            onClick={() => removeSlot(idx)}
                                            className="absolute top-1 right-1 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-error transition-all cursor-pointer"
                                        >
                                            <Trash2 size={15} className="text-white" />
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => fileInputRefs[idx].current?.click()}
                                        className="w-full h-full flex flex-col items-center justify-center gap-2 text-base-content/30 hover:text-primary transition-all cursor-pointer border border-dashed border-base-content/20 hover:border-primary/50 rounded-xl"
                                    >
                                        <ImagePlus size={24} strokeWidth={1.5} />
                                        <span className="text-[10px] uppercase tracking-widest text-center leading-relaxed">Add<br/>image</span>
                                    </button>
                                )}
                                <input
                                    ref={fileInputRefs[idx]}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={e => handleFileChange(idx, e)}
                                />
                            </div>
                        ))}
                    </div>
                    <p className="text-[11px] text-base-content/25 leading-relaxed">
                        Upload reference images, then click on them to insert their tags into the prompt — AI will use them as visual references at those points.
                    </p>
                </div>

                {/* Aspect ratio */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.25em] text-base-content/40">Aspect ratio</span>
                    <div className="flex gap-3">
                        {IMAGE_RATIOS.map(r => (
                            <button
                                key={r.value}
                                onClick={() => setImageRatio(r.value)}
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
                                <span className="text-[10px] uppercase tracking-[0.15em]">{r.value}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="px-7 py-3.5 rounded-xl text-xs uppercase tracking-[0.2em] cursor-pointer text-base-content/30 hover:text-base-content/70 transition-colors duration-300"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={!canGenerate()}
                        className="group flex items-center gap-3 px-7 py-3.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary hover:border-primary text-primary hover:text-primary-content transition-all duration-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        {loading
                            ? <span className="loading loading-dots loading-xs" />
                            : <Sparkles size={16} className="group-hover:animate-pulse" />
                        }
                        <span className="text-sm uppercase tracking-[0.2em]">Generate</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default GenImageModal;
