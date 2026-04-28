import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, ImagePlus, Trash2 } from 'lucide-react';
import type { Avatar } from '../../types/avatar';

type Ratio = '9:16' | '3:4' | '1:1' | '4:3' | '16:9';

const RATIOS: { value: Ratio; w: number; h: number }[] = [
    { value: '9:16', w: 18, h: 32 },
    { value: '3:4',  w: 21, h: 28 },
    { value: '1:1',  w: 26, h: 26 },
    { value: '4:3',  w: 28, h: 21 },
    { value: '16:9', w: 32, h: 18 },
];

const EMPTY_SLOTS: [null, null, null] = [null, null, null];

type Props = {
    isOpen: boolean;
    onClose: () => void;
    avatar?: Avatar;
    onGenerate: (prompt: string, ratio: Ratio, referenceImages: File[]) => Promise<void>;
};

function GenerateImageModal({ isOpen, onClose, avatar, onGenerate }: Props) {
    const [prompt, setPrompt] = useState('');
    const [ratio, setRatio] = useState<Ratio>('9:16');
    const [loading, setLoading] = useState(false);
    const [slots, setSlots] = useState<(File | null)[]>([...EMPTY_SLOTS]);
    const [previews, setPreviews] = useState<(string | null)[]>([null, null, null]);
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

    const canGenerate = () => prompt.trim().length >= 5 && !loading;

    const handleGenerate = async () => {
        if (!canGenerate()) return;
        setLoading(true);
        await onGenerate(prompt.trim(), ratio, slots.filter((f): f is File => f !== null));
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div className="absolute inset-0 bg-transparent" onClick={onClose} />
            <div
                className="relative bg-base-100 rounded-3xl flex flex-col gap-7 p-10 w-[580px]"
                style={{ animation: 'panel-reveal 0.38s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}
            >
                {/* Border sweep */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent pointer-events-none"
                     style={{ animation: 'border-lr 0.35s ease 0.15s both' }} />
                <div className="absolute top-0 right-0 w-[2px] h-full bg-gradient-to-b from-transparent via-primary/50 to-transparent pointer-events-none"
                     style={{ animation: 'border-tb 0.35s ease 0.4s both' }} />
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent pointer-events-none"
                     style={{ animation: 'border-rl 0.35s ease 0.65s both' }} />
                <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-transparent via-primary/50 to-transparent pointer-events-none"
                     style={{ animation: 'border-bt 0.35s ease 0.9s both' }} />

                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 w-11 h-11 flex items-center justify-center rounded-full text-base-content/30 hover:text-base-content hover:bg-base-200 transition-all cursor-pointer"
                >
                    <X size={25} />
                </button>

                <textarea
                    autoFocus
                    style={{ marginTop: '2rem' }}
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                    placeholder={`Describe the image you want to generate with ${avatar?.name ?? 'your avatar'}...`}
                    rows={6}
                    className="w-full bg-base-200/50 border border-base-content/10 rounded-2xl px-6 py-5 text-base text-base-content placeholder:text-base-content/25 resize-none focus:outline-none focus:border-primary/40 transition-colors"
                />

                {/* Reference images */}
                <div className="flex items-center gap-3">
                    {slots.map((_slot, idx) => (
                        <div key={idx} className="group relative w-40 h-40 rounded-xl overflow-hidden border border-base-content/10 shrink-0">
                            {previews[idx] ? (
                                <>
                                    <img src={previews[idx]!} className="w-full h-full object-cover" />
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
                                    <ImagePlus size={28} strokeWidth={1.5} />
                                    <span className="text-[11px] uppercase tracking-widest">Reference</span>
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

export default GenerateImageModal;
