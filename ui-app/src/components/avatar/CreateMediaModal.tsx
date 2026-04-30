import { Image, Video, X, Images } from 'lucide-react';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onImage?: () => void;
    onVideo?: () => void;
    onPhotoSet?: () => void;
};

function CreateMediaModal({ isOpen, onClose, onImage, onVideo, onPhotoSet }: Props) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div
                className="absolute inset-0 bg-base-300/60 animate-modal-backdrop"
                onClick={onClose}
            />
            <div className="relative bg-base-100 rounded-3xl shadow-2xl border border-base-content/5 p-12 animate-modal-card">
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 w-11 h-11 flex items-center justify-center rounded-full text-base-content/30 hover:text-base-content hover:bg-base-200 transition-all cursor-pointer"
                >
                    <X size={25} />
                </button>
                <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-base-content/30 text-center mb-8">
                    What to generate?
                </p>
                <div className="flex gap-6">
                    <button
                        onClick={onImage}
                        className="group flex flex-col items-center gap-5 px-16 py-12 rounded-2xl border border-base-content/10 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-pointer"
                    >
                        <Image size={56} strokeWidth={1} className="text-base-content/30 group-hover:text-primary transition-colors duration-300" />
                        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-base-content/40 group-hover:text-base-content transition-colors">Photo</span>
                    </button>
                    <button
                        onClick={onPhotoSet}
                        className="group flex flex-col items-center gap-5 px-16 py-12 rounded-2xl border border-base-content/10 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-pointer"
                    >
                        <Images size={56} strokeWidth={1} className="text-base-content/30 group-hover:text-primary transition-colors duration-300" />
                        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-base-content/40 group-hover:text-base-content transition-colors">Photo set</span>
                    </button>
                    <button
                        onClick={onVideo}
                        className="group flex flex-col items-center gap-5 px-16 py-12 rounded-2xl border border-base-content/10 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-pointer"
                    >
                        <Video size={56} strokeWidth={1} className="text-base-content/30 group-hover:text-primary transition-colors duration-300" />
                        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-base-content/40 group-hover:text-base-content transition-colors">Video</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CreateMediaModal;
