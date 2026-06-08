import { Camera, Video, Images, AudioLines } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onImage?: () => void;
    onVideo?: () => void;
    onPhotoSet?: () => void;
    onAudio?: () => void;
};

const OPTIONS = [
    { icon: Camera,     label: 'Photo',     onClick: (p: Props) => p.onImage },
    { icon: Images,     label: 'Photo set', onClick: (p: Props) => p.onPhotoSet },
    { icon: Video,      label: 'Video',     onClick: (p: Props) => p.onVideo },
    { icon: AudioLines, label: 'Voice',     onClick: (p: Props) => p.onAudio },
];

function CreateMediaModal({ isOpen, onClose, onImage, onVideo, onPhotoSet, onAudio }: Props) {
    useScrollLock(isOpen);
    if (!isOpen) return null;

    const props = { isOpen, onClose, onImage, onVideo, onPhotoSet, onAudio };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="absolute inset-0 bg-base-300/60 animate-modal-backdrop" onClick={onClose} />
            <div className="relative bg-base-100 rounded-2xl border border-base-content/5 p-10 animate-modal-card">
                <div className="flex flex-col gap-8">
                    <div className="flex items-center gap-3">
                        <span className="w-8 h-px bg-primary/50" />
                        <h3 className="text-xl uppercase tracking-[0.2em] text-base-content/70">What to generate?</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {OPTIONS.map(({ icon: Icon, label, onClick }) => (
                            <button
                                key={label}
                                onClick={onClick(props)}
                                className="group flex flex-col items-center gap-5 px-16 py-12 rounded-2xl border border-base-content/10 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-pointer"
                            >
                                <Icon size={56} strokeWidth={1} className="text-base-content/30 group-hover:text-primary transition-colors duration-300" />
                                <span className="text-sm uppercase tracking-[0.2em] text-base-content/40 group-hover:text-base-content transition-colors">{label}</span>
                            </button>
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
        </div>
    );
}

export default CreateMediaModal;
