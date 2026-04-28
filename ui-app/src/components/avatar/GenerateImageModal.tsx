import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import type { Avatar } from '../../types/avatar';

type Ratio = '9:16' | '3:4' | '1:1' | '4:3' | '16:9';

const RATIOS: { value: Ratio; w: number; h: number }[] = [
    { value: '9:16', w: 18, h: 32 },
    { value: '3:4',  w: 21, h: 28 },
    { value: '1:1',  w: 26, h: 26 },
    { value: '4:3',  w: 28, h: 21 },
    { value: '16:9', w: 32, h: 18 },
];

type Props = {
    isOpen: boolean;
    onClose: () => void;
    avatar?: Avatar;
    onGenerate: (prompt: string, ratio: Ratio) => Promise<void>;
};

function GenerateImageModal({ isOpen, onClose, avatar, onGenerate }: Props) {
    const [prompt, setPrompt] = useState('');
    const [ratio, setRatio] = useState<Ratio>('9:16');
    const [loading, setLoading] = useState(false);

    useEffect(() => { if (!isOpen) setPrompt(''); }, [isOpen]);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        await onGenerate(prompt.trim(), ratio);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div className="absolute inset-0 bg-transparent" onClick={onClose} />
            <div
                className="relative bg-base-100 rounded-3xl flex flex-col gap-7 p-10 w-[720px]"
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
                        disabled={!prompt.trim() && loading}
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
