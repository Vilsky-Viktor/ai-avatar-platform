import { useState, useEffect } from 'react';
import { X, AudioLines } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { MediaTypes } from '@loom24/shared/types';

type Props = {
    src: string | null;
    rect: DOMRect | null;
    mediaType?: MediaTypes;
    thumbnailSrc?: string;
    onClose: () => void;
}

const CLOSE_DURATION = 150;

const SPRING   = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
const EASE_IN  = 'cubic-bezier(0.7, 0, 1, 1)';

function FullscreenModal({ src, rect, mediaType, thumbnailSrc, onClose }: Props) {
    const [visible, setVisible] = useState(false);
    const [fullResLoaded, setFullResLoaded] = useState(false);

    useEffect(() => {
        if (src) {
            setFullResLoaded(false);
            setVisible(true);
        }
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
                className="absolute top-5 right-6 z-10 w-10 h-10 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer"
                onClick={handleClose}
                aria-label="Close fullscreen view"
            >
                <X size={20} strokeWidth={1.5} />
            </button>

            {isAudio ? (
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={mediaStyle}
                    className="bg-base-100 rounded-2xl p-10 flex flex-col items-center gap-6 w-[420px]"
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
                    className="max-w-[96vw] max-h-[96vh] rounded-xl"
                />
            ) : (
                <>
                    {/* Full-screen blurred thumbnail background while full-res loads */}
                    {thumbnailSrc && (
                        <img
                            src={thumbnailSrc}
                            aria-hidden
                            className="absolute inset-0 h-full w-auto mx-auto object-contain"
                            style={{
                                filter: 'blur(24px)',
                                transform: 'scale(1.08)',
                                opacity: fullResLoaded ? 0 : 0.5,
                                transition: 'opacity 400ms ease-out',
                            }}
                        />
                    )}
                    <img
                        src={src}
                        alt="Full size media"
                        onLoad={() => setFullResLoaded(true)}
                        onClick={(e) => e.stopPropagation()}
                        style={mediaStyle}
                        className="max-w-[96vw] max-h-[96vh] object-contain rounded-xl relative"
                    />
                </>
            )}
        </div>
    );
}

export default FullscreenModal;
