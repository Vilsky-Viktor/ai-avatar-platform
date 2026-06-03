import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, ImagePlus, Trash2 } from 'lucide-react';
import type { Avatar } from '../../types/avatar';
import { type Ratio, RATIOS } from '../../types/image';
import { useScrollLock } from '../../hooks/useScrollLock';

const EMPTY_SLOTS: [null, null, null] = [null, null, null];

type Props = {
    isOpen: boolean;
    onClose: () => void;
    avatar?: Avatar;
    onGenerate: (prompt: string, ratio: Ratio, referenceImages: File[]) => Promise<void>;
};

function GenImageModal({ isOpen, onClose, avatar, onGenerate }: Props) {
    const [prompt, setPrompt] = useState('');
    const [ratio, setRatio] = useState<Ratio>('9:16');
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
            <div className="relative bg-base-100 rounded-3xl shadow-2xl border border-base-content/5 flex flex-col gap-7 p-10 w-[700px] animate-modal-card">

                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 w-11 h-11 flex items-center justify-center rounded-full text-base-content/30 hover:text-base-content hover:bg-base-200 transition-all cursor-pointer"
                >
                    <X size={25} />
                </button>

                <textarea
                    ref={textareaRef}
                    autoFocus
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                    placeholder={`Describe the image you want to generate with ${avatar?.name ?? 'your avatar'}...`}
                    rows={6}
                    className="mt-8 w-full bg-base-200/50 border border-base-content/10 rounded-2xl px-6 py-5 text-base text-base-content placeholder:text-base-content/25 resize-none focus:outline-none focus:border-primary/40 transition-colors"
                />

                {/* Reference images */}
                <div className="flex items-center gap-3">
                    {slots.map((_slot, idx) => (
                        <div key={idx} className="group relative w-49 h-49 rounded-xl overflow-hidden border border-base-content/10 shrink-0">
                            {previews[idx] ? (
                                <>
                                    <img
                                        src={previews[idx]!}
                                        onClick={() => insertReference(idx)}
                                        className="w-full h-full object-cover object-top cursor-pointer"
                                    />
                                    <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-white text-[10px] font-semibold uppercase tracking-widest pointer-events-none">
                                        image #{idx + 1}
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
                                    <ImagePlus size={35} strokeWidth={1.5} />
                                    <span className="text-[11px] uppercase tracking-widest text-center leading-relaxed">Reference<br/>Image</span>
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

                {/* Ratio */}
                <div className="flex gap-3">
                    {RATIOS.map(r => (
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

                <div className="flex justify-end">
                    <button
                        onClick={handleGenerate}
                        disabled={!canGenerate()}
                        className="group flex items-center gap-3 px-7 py-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary hover:border-primary text-primary hover:text-primary-content transition-all duration-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <Sparkles size={16} className="group-hover:animate-pulse" />
                        <span className="text-sm font-semibold uppercase tracking-[0.2em]">Generate</span>
                        {loading && (<span className="loading loading-spinner loading-xs"></span>)}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default GenImageModal;
