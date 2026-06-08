import { Trash2, ScanFace } from 'lucide-react';
import { type Avatar, AvatarTypes } from '@loom24/shared/types';
import { useEffect, useState } from 'react';
import { getMediaUrlFromPath } from '../../services/storage';
import { useNavigate } from 'react-router-dom';

type PropType = {
    avatar: Avatar;
    onDelete: (id: string) => void;
}

const AvatarCard = ({ avatar, onDelete }: PropType) => {
    const navigate = useNavigate();

    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [imageLoading, setImageLoading] = useState(!!avatar.mainImagePath);

    useEffect(() => {
        if (!avatar.mainImagePath) return;
        getMediaUrlFromPath(avatar.mainImagePath)
            .then(url => setImageSrc(url))
            .catch(() => {})
            .finally(() => setImageLoading(false));
    }, []);

    const noImage = imageLoading || !imageSrc;

    return (
        <div className="group relative p-[1.5px] rounded-2xl aspect-square overflow-hidden">
            <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 group-hover:animate-spin-border transition-opacity duration-300 pointer-events-none"
                style={{ backgroundImage: 'conic-gradient(from var(--gen-angle), transparent 0%, transparent 60%, color-mix(in oklch, var(--color-primary) 85%, transparent) 80%, transparent 100%)' }}
            />

            <div className="relative w-full h-full rounded-2xl overflow-hidden bg-base-100 border border-base-content/10 group-hover:border-transparent transition-colors duration-300">

                <div className="tooltip tooltip-bottom absolute top-4 right-4 z-[60] opacity-0 group-hover:opacity-100 transition-all" data-tip="Remove">
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete?.(avatar.id!); }}
                        className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-error transition-all cursor-pointer"
                    >
                        <Trash2 size={18} className="text-white" />
                    </button>
                </div>

                <button
                    className={`w-full h-full text-left focus:outline-none transition-transform duration-150 ${avatar.voiceId ? 'cursor-pointer active:scale-[0.99]' : 'cursor-default'}`}
                    disabled={!avatar.voiceId}
                    onClick={() => avatar.voiceId && navigate(`/avatar/${avatar.slug}`)}
                >
                    <div
                        className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-500 opacity-0 group-hover:opacity-100"
                        style={{ background: 'radial-gradient(circle at 50% 120%, color-mix(in oklch, var(--color-primary) 12%, transparent), transparent)' }}
                    />
                    <div
                        className="absolute inset-0 z-10 opacity-[0.03] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                    />

                    <figure className="h-full w-full overflow-hidden relative">
                        {noImage ? (
                            <div className="flex items-center justify-center w-full h-full bg-base-200/50">
                                <ScanFace size={80} strokeWidth={0.8} className="text-base-content/15" />
                                <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-base-content/10 pointer-events-none" />
                                <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-base-content/10 pointer-events-none" />
                                <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-base-content/10 pointer-events-none" />
                                <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-base-content/10 pointer-events-none" />
                            </div>
                        ) : (
                            <img
                                src={imageSrc!}
                                alt={avatar.name}
                                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-1000 ease-out"
                            />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-base-100 group-hover:from-base-200 via-base-100/5 to-transparent z-20 transition-colors duration-300" />

                        <div className="absolute bottom-4 left-7 right-7 z-30 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] uppercase tracking-[0.25em] px-2 py-0.5 rounded-full bg-base-content/10 text-base-content/40">
                                    {avatar.type === AvatarTypes.twin ? 'Twin' : 'Synthetic'}
                                </span>
                                {!avatar.voiceId && (
                                    <span className="text-[9px] uppercase tracking-[0.25em] px-2 py-0.5 rounded-full bg-warning/10 text-warning/60">
                                        Setup incomplete
                                    </span>
                                )}
                            </div>
                            <h2 className="text-xl uppercase tracking-[0.2em] text-base-content truncate">
                                {avatar.name}
                            </h2>
                        </div>
                    </figure>
                </button>
            </div>
        </div>
    );
};

export default AvatarCard;
