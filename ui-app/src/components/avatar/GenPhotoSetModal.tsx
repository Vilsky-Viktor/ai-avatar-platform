import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';
import type { PhotoSetType } from '../../types/image';

type PhotoSetOption = {
    id: PhotoSetType;
    name: string;
    description: string;
};

const PHOTO_SETS: PhotoSetOption[] = [
    {
        id: 'whatsapp-stickers',
        name: 'WhatsApp Stickers',
        description: 'Generate Whatsapp stickers of your avatar with different emotions: sad, angry, laughing, disgusted, shy, scared, sleepy, confused, surprised, anxious',
    },
    {
        id: 'around-the-world',
        name: 'Around the World',
        description: 'Generate photos of your avatar in different locations around the world: France, Italy, Egypt, Israel, Thailand, Ethiopia, Turkey, Russia, USA, Mexico',
    },
    {
        id: 'outfit-styles',
        name: 'Outfit Styles',
        description: 'Generate photos of your avatar wearing different outfit styles: business formal, smart casual, sport elegant, streetwear, casual chic, athleisure, business casual, evening glam, bohemian, minimalist, old money, preppy, vintage, edgy/rock, beachwear',
    },
    {
        id: 'luxury-life',
        name: 'Luxury life',
        description: 'Generate photos of your luxury life: car, private get, fancy restorant, villa, resort, brand store, skyscrapper office',
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
            <div className="relative bg-base-100 rounded-3xl shadow-2xl border border-base-content/5 flex flex-col gap-3 p-10 w-[720px] animate-modal-card">

                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 w-11 h-11 flex items-center justify-center rounded-full text-base-content/30 hover:text-base-content hover:bg-base-200 transition-all cursor-pointer"
                >
                    <X size={25} />
                </button>

                <div className='mt-10 overflow-y-auto max-h-[500px] flex flex-col gap-3 pr-1'>
                    {PHOTO_SETS.map((set) => (
                        <div
                            key={set.id}
                            className="flex items-center justify-between gap-6 px-6 py-5 rounded-2xl border border-base-content/10 hover:border-primary/30 hover:bg-primary/[0.02] transition-all duration-200 shrink-0"
                        >
                            <div className="flex flex-col gap-1 min-w-0">
                                <span className="text-md tracking-wide text-base-content">
                                    {set.name}
                                </span>
                                <span className="text-[12px] text-base-content/40 leading-relaxed">
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
                                    ? <span className="loading loading-spinner loading-xs" />
                                    : <Sparkles size={14} className="group-hover:animate-pulse" />
                                }
                                <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">Generate</span>
                            </button>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}

export default GenPhotoSetModal;
