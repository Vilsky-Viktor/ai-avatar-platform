import { Trash2, Loader2, Sparkles, CircleOff, ArrowLeft, ArrowRight, ArrowDownLeft, ArrowDownRight, User, PersonStanding } from 'lucide-react';
import type { RefObject } from 'react';
import type { UploadedIdPhoto } from '../../types/avatarCreation';

type ViewConfigItem = {
    label: string;
    name: string;
    ref: RefObject<HTMLInputElement | null>;
};

type Props = {
    viewConfig: ViewConfigItem[];
    uploadedPhotos: UploadedIdPhoto[];
    onDragOver: (index: number, e: React.DragEvent) => void;
    onDragLeave: (index: number, e: React.DragEvent) => void;
    onDrop: (index: number, e: React.DragEvent) => void;
    onFileUpload: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemovePhoto: (index: number) => void;
    removable?: boolean;
    croppingIndices?: number[];
    slotErrors?: Record<number, string>;
};

const DIRECTION_DESCRIPTIONS: Record<string, string> = {
    'front':         'Look straight at camera',
    'front-smile':   'Look at camera, show teeth',
    'left-quarter':  'Turn to show your left side, 45°',
    'right-quarter': 'Turn to show your right side, 45°',
    'left-side':     'Show full left profile',
    'right-side':    'Show full right profile',
    'full-body':     'Stand straight, face forward',
};

const DIRECTION_ICONS: Record<string, React.ElementType> = {
    'front':         User,
    'front-smile':   User,
    'left-quarter':  ArrowDownLeft,
    'right-quarter': ArrowDownRight,
    'left-side':     ArrowLeft,
    'right-side':    ArrowRight,
    'full-body':     PersonStanding,
};

const DirectionIcon = ({ name, active }: { name: string; active: boolean }) => {
    const Icon = DIRECTION_ICONS[name] ?? User;
    const color = active ? 'text-primary' : 'text-base-content/25 group-hover:text-primary/60';
    return <Icon size={36} strokeWidth={1.2} className={`transition-colors duration-300 ${color}`} />;
};

function PhotoUploadGrid({ viewConfig, uploadedPhotos, onDragOver, onDragLeave, onDrop, onFileUpload, onRemovePhoto, removable, croppingIndices, slotErrors }: Props) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            {viewConfig.map((view, index) => {
                const photoData = uploadedPhotos[index];
                const imageSrc = photoData?.photo || photoData?.mediaUrl;
                const hasPhoto = !!imageSrc;
                const isCropping = croppingIndices?.includes(index) ?? false;
                const slotError = slotErrors?.[index];

                return (
                    <div
                        key={index}
                        onDragOver={(e) => !isCropping && !slotError && onDragOver(index, e)}
                        onDragLeave={(e) => !isCropping && !slotError && onDragLeave(index, e)}
                        onDrop={(e) => !isCropping && !slotError && onDrop(index, e)}
                        onClick={() => !hasPhoto && !isCropping && view.ref.current?.click()}
                        className={`relative rounded-2xl border border-dashed flex flex-col items-center justify-center aspect-square group transition-all duration-300 overflow-hidden
                            ${isCropping ? 'border-primary/20 bg-primary/[0.02] cursor-not-allowed' : slotError ? 'border-error/20 bg-error/[0.02] cursor-pointer hover:border-error/40' : hasPhoto ? 'border-primary/20 bg-base-200' : 'border-base-content/10 bg-transparent cursor-pointer hover:border-primary/30'}
                            ${photoData?.isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : ''}`}
                    >
                        <input
                            type="file"
                            ref={view.ref}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => onFileUpload(index, e)}
                        />

                        {isCropping ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    <Loader2 size={44} strokeWidth={1} className="text-primary animate-spin" />
                                    <Sparkles size={16} className="absolute -top-2 -right-2 text-primary animate-pulse" />
                                </div>
                                <div className="text-center">
                                    <span className="text-[11px] uppercase tracking-[0.35em] text-primary">Cropping</span>
                                    <p className="text-[9px] uppercase tracking-widest text-base-content/20 mt-1">Processing image</p>
                                </div>
                            </div>
                        ) : slotError ? (
                            <div className="flex flex-col items-center gap-4 px-4">
                                <CircleOff size={40} strokeWidth={1} className="text-error/50 animate-pulse" />
                                <div className="text-center">
                                    <span className="text-[11px] uppercase tracking-[0.35em] text-error">Not detected</span>
                                    <p className="text-[9px] uppercase tracking-widest text-base-content/20 mt-1">{slotError}</p>
                                    <p className="text-[9px] uppercase tracking-widest text-base-content/30 mt-2">Click to try again</p>
                                </div>
                            </div>
                        ) : hasPhoto ? (
                            <>
                                <img
                                    src={imageSrc!}
                                    className="absolute inset-0 w-full h-full object-contain z-0 rounded-2xl"
                                    alt={view.label}
                                />
                                {removable && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onRemovePhoto(index); }}
                                        className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-error transition-all cursor-pointer"
                                    >
                                        <Trash2 size={17} />
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-3 pointer-events-none px-2">
                                <DirectionIcon name={view.name} active={!!photoData?.isDragging} />
                                <div className="text-center flex flex-col gap-1">
                                    <span className={`text-[11px] uppercase tracking-[0.25em] transition-colors duration-300 ${photoData?.isDragging ? 'text-primary' : 'text-base-content/50 group-hover:text-base-content/70'}`}>
                                        {photoData?.isDragging ? 'Drop here' : view.label}
                                    </span>
                                    {!photoData?.isDragging && (
                                        <p className="text-[9px] text-base-content/25 leading-snug">
                                            {DIRECTION_DESCRIPTIONS[view.name]}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {!hasPhoto && !isCropping && !slotError && (
                            <>
                                <div className="absolute top-6 left-6 w-5 h-5 border-t border-l border-base-content/8 pointer-events-none" />
                                <div className="absolute bottom-6 right-6 w-5 h-5 border-b border-r border-base-content/8 pointer-events-none" />
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default PhotoUploadGrid;
