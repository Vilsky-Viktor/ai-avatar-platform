type Props = {
    src: string | null;
    onClose: () => void;
}

function FullscreenModal({ src, onClose }: Props) {
    if (!src) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center backdrop-blur-sm transition-opacity duration-200"
            onClick={onClose}
        >
            <button
                className="absolute top-5 right-6 z-10 text-white text-6xl font-light hover:scale-110 hover:rotate-6 transition-transform duration-200"
                onClick={onClose}
                aria-label="Close fullscreen view"
            >
                ×
            </button>

            <img
                src={src}
                alt="Full size generated avatar"
                className="max-w-[96vw] max-h-[96vh] object-contain rounded-xl shadow-2xl transition-transform duration-300 scale-100"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}

export default FullscreenModal;
