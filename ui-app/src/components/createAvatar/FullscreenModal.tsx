import { useState, useEffect } from 'react';
import { AudioLines } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { MediaTypes } from '@loom24/shared/types';

type Props = {
    src: string | null;
    rect: DOMRect | null;
    mediaType?: MediaTypes;
    onClose: () => void;
}

const CLOSE_DURATION = 150;

// Spring-like overshoot for opening, fast ease-in for closing
const SPRING   = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
const EASE_IN  = 'cubic-bezier(0.7, 0, 1, 1)';

function FullscreenModal({ src, rect, mediaType, onClose }: Props) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (src) setVisible(true);
    }, [src]);

    useScrollLock(!!src);

    useEffect(() => {
        if (!src) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [src]);

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, CLOSE_DURATION);
    };

    if (!src) return null;

    const isVideo = mediaType === MediaTypes.video;
    const isAudio = mediaType === MediaTypes.audio;
    const finalSize = Math.min(window.innerWidth * 0.96, window.innerHeight * 0.96);
    const tileScale = rect ? rect.width / finalSize : 0.88;
    const tileDx = rect ? rect.left + rect.width / 2 - window.innerWidth / 2 : 0;
    const tileDy = rect ? rect.top + rect.height / 2 - window.innerHeight / 2 : 0;
    const initialTransform = `translate(${tileDx}px, ${tileDy}px) scale(${tileScale})`;

    const mediaStyle = {
        transform: visible ? 'translate(0,0) scale(1)' : initialTransform,
        opacity: visible ? 1 : 0,
        transition: visible
            ? `transform 500ms ${SPRING}, opacity 280ms ${EASE_OUT}`
            : `transform ${CLOSE_DURATION}ms ${EASE_IN}, opacity ${CLOSE_DURATION}ms ${EASE_IN}`,
    };

    return (
        <div
            onClick={handleClose}
            style={{
                transition: visible
                    ? `background-color 400ms ${EASE_OUT}, backdrop-filter 400ms ${EASE_OUT}`
                    : `background-color ${CLOSE_DURATION}ms ${EASE_IN}, backdrop-filter ${CLOSE_DURATION}ms ${EASE_IN}`,
            }}
            className={`fixed inset-0 z-[9999] flex items-center justify-center
                ${visible ? 'bg-black/90 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-none'}
            `}
        >
            <button
                className="absolute top-5 right-6 z-10 text-white text-6xl font-light hover:scale-110 hover:rotate-6 transition-transform duration-200"
                onClick={handleClose}
                aria-label="Close fullscreen view"
            >
                ×
            </button>

            {isAudio ? (
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={mediaStyle}
                    className="bg-base-100 rounded-2xl p-10 shadow-2xl flex flex-col items-center gap-6 w-[420px]"
                >
                    <AudioLines size={48} strokeWidth={1} className="text-primary" />
                    <audio src={src} controls autoPlay className="w-full" />
                </div>
            ) : isVideo ? (
                <video
                    src={src}
                    controls
                    autoPlay
                    loop
                    playsInline
                    onClick={(e) => e.stopPropagation()}
                    style={mediaStyle}
                    className="max-w-[96vw] max-h-[96vh] rounded-xl shadow-2xl"
                />
            ) : (
                <img
                    src={src}
                    alt="Full size generated avatar"
                    onClick={(e) => e.stopPropagation()}
                    style={mediaStyle}
                    className="max-w-[96vw] max-h-[96vh] object-contain rounded-xl shadow-2xl"
                />
            )}
        </div>
    );
}

export default FullscreenModal;
