import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (text: string) => Promise<void>;
};

function GenAudioModal({ isOpen, onClose, onGenerate }: Props) {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) setText('');
    }, [isOpen]);

    useScrollLock(isOpen);
    if (!isOpen) return null;

    const canGenerate = () => text.trim().length >= 5 && !loading;

    const handleGenerate = async () => {
        if (!canGenerate()) return;
        setLoading(true);
        await onGenerate(text.trim());
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
                    autoFocus
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                    placeholder="Write what you want your avatar to say..."
                    rows={8}
                    className="mt-8 w-full bg-base-200/50 border border-base-content/10 rounded-2xl px-6 py-5 text-base text-base-content placeholder:text-base-content/25 resize-none focus:outline-none focus:border-primary/40 transition-colors"
                />

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
    );
}

export default GenAudioModal;
