import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';
import type { PhotoSetType } from '@loom24/shared/types';

type PhotoSetOption = {
    id: PhotoSetType;
    name: string;
    description: string;
};

const PHOTO_SETS: PhotoSetOption[] = [
    {
        id: 'whatsapp-stickers',
        name: 'WhatsApp Stickers',
        description: 'Different emotions: sad, angry, laughing, disgusted, shy, scared, sleepy, confused, surprised, anxious.',
    },
    {
        id: 'around-the-world',
        name: 'Around the World',
        description: 'Different locations: France, Italy, Egypt, Israel, Thailand, Ethiopia, Turkey, Russia, USA, Mexico.',
    },
    {
        id: 'outfit-styles',
        name: 'Outfit Styles',
        description: 'Different styles: business formal, smart casual, streetwear, casual chic, athleisure, evening glam, bohemian, minimalist, old money, vintage.',
    },
    {
        id: 'luxury-life',
        name: 'Luxury Life',
        description: 'Luxury settings: supercar, private jet, fine dining, villa, resort, brand store, skyscraper office.',
    },
];

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (type: PhotoSetType) => Promise<void>;
};

function GenPhotoSetModal({ isOpen, onClose, onGenerate }: Props) {
    const [loadingId, setLoadingId] = useState<PhotoSetType | null>(null);
    useScrollLock(isOpen);
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="absolute inset-0 bg-base-300/60 animate-modal-backdrop" onClick={onClose} />
            <div className="relative bg-base-100 rounded-2xl border border-base-content/5 flex flex-col gap-6 p-10 w-[680px] animate-modal-card">

                <div className="flex items-center gap-3">
                    <span className="w-8 h-px bg-primary/50" />
                    <h3 className="text-xl uppercase tracking-[0.2em] text-base-content/70">Photo sets</h3>
                </div>

                <div className="flex flex-col gap-3 overflow-y-auto max-h-[480px] pr-4">
                    {PHOTO_SETS.map((set) => (
                        <div
                            key={set.id}
                            className="flex items-center justify-between gap-6 px-6 py-5 rounded-2xl border border-base-content/10 hover:border-primary/30 hover:bg-primary/[0.02] transition-all duration-200"
                        >
                            <div className="flex flex-col gap-1 min-w-0">
                                <span className="text-sm uppercase tracking-[0.15em] text-base-content/70">
                                    {set.name}
                                </span>
                                <span className="text-xs text-base-content/35 leading-relaxed">
                                    {set.description}
                                </span>
                            </div>
                            <button
                                disabled={loadingId !== null}
                                onClick={async () => {
                                    setLoadingId(set.id);
                                    try { await onGenerate(set.id); } finally { setLoadingId(null); }
                                }}
                                className="group shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary hover:border-primary text-primary hover:text-primary-content transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loadingId === set.id
                                    ? <span className="loading loading-dots loading-xs" />
                                    : <Sparkles size={14} className="group-hover:animate-pulse" />
                                }
                                <span className="text-[11px] uppercase tracking-[0.2em]">Generate</span>
                            </button>
                        </div>
                    ))}
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
    );
}

export default GenPhotoSetModal;
