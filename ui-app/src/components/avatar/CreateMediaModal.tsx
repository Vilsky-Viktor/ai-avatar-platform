import { useState, useEffect } from 'react';
import { Image, Video, X, Images } from 'lucide-react';

const TILE = 44;
const COLS = 18;
const ROWS = 10;
const W = COLS * TILE;
const H = ROWS * TILE;

type Tile = { id: number; col: number; row: number; randX: number; randY: number; delay: number; primary: boolean };
type ModalState = 'idle' | 'tiles' | 'revealed';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onImage?: () => void;
    onVideo?: () => void;
    onPhotoSet?: () => void;
};

function CreateMediaModal({ isOpen, onClose, onImage, onVideo, onPhotoSet }: Props) {
    const [modalState, setModalState] = useState<ModalState>('idle');
    const [tilesGathering, setTilesGathering] = useState(false);
    const [tiles, setTiles] = useState<Tile[]>([]);

    useEffect(() => {
        if (isOpen) {
            openModal();
        } else {
            setModalState('idle');
        }
    }, [isOpen]);

    const openModal = () => {
        const newTiles: Tile[] = [];
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                newTiles.push({
                    id: row * COLS + col,
                    col, row,
                    randX: (Math.random() - 0.5) * window.innerWidth * 1.6,
                    randY: (Math.random() - 0.5) * window.innerHeight * 1.6,
                    delay: Math.random() * 170,
                    primary: Math.random() < 0.15,
                });
            }
        }
        setTiles(newTiles);
        setTilesGathering(false);
        setModalState('tiles');
        setTimeout(() => {
            requestAnimationFrame(() => requestAnimationFrame(() => setTilesGathering(true)));
            setTimeout(() => setModalState('revealed'), 490);
        }, 120);
    };

    const getTileRadius = (col: number, row: number) => {
        const r = 24;
        const tl = col === 0 && row === 0 ? r : 0;
        const tr = col === COLS - 1 && row === 0 ? r : 0;
        const br = col === COLS - 1 && row === ROWS - 1 ? r : 0;
        const bl = col === 0 && row === ROWS - 1 ? r : 0;
        return `${tl}px ${tr}px ${br}px ${bl}px`;
    };

    if (modalState === 'idle') return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ animation: 'modal-backdrop-in 0.3s ease forwards' }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-transparent"
                onClick={modalState === 'revealed' ? onClose : undefined}
            />

            {/* Shared container — tiles and modal occupy the exact same box */}
            <div style={{ position: 'relative', width: W, height: H, zIndex: 10 }}>

                {/* Tiles — each flies from a scattered position to its grid cell */}
                {tiles.map(t => (
                    <div
                        key={t.id}
                        className={`absolute ${t.primary ? 'bg-primary/70' : 'bg-base-100'}`}
                        style={{
                            width: TILE,
                            height: TILE,
                            left: t.col * TILE,
                            top: t.row * TILE,
                            transform: tilesGathering
                                ? 'translate(0px, 0px)'
                                : `translate(${t.randX}px, ${t.randY}px)`,
                            transition: tilesGathering
                                ? `transform 0.36s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${t.delay}ms, opacity 0.2s ease ${t.delay + 156}ms`
                                : 'none',
                            opacity: modalState === 'revealed' ? 0 : 1,
                            borderRadius: getTileRadius(t.col, t.row),
                            pointerEvents: 'none',
                        }}
                    />
                ))}

                {/* Actual modal — same size, fades in as tiles fade out */}
                <div
                    className="absolute inset-0 bg-base-100 rounded-3xl flex flex-col items-center justify-center gap-8 overflow-hidden"
                    style={{
                        opacity: modalState === 'revealed' ? 1 : 0,
                        transition: 'opacity 0.3s ease',
                        pointerEvents: modalState === 'revealed' ? 'auto' : 'none',
                    }}
                >
                    {/* Border sweep — clockwise: top → right → bottom → left */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent pointer-events-none"
                         style={{ animation: 'border-lr 0.35s ease 0.05s both' }} />
                    <div className="absolute top-0 right-0 w-[2px] h-full bg-gradient-to-b from-transparent via-primary/50 to-transparent pointer-events-none"
                         style={{ animation: 'border-tb 0.35s ease 0.3s both' }} />
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent pointer-events-none"
                         style={{ animation: 'border-rl 0.35s ease 0.55s both' }} />
                    <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-transparent via-primary/50 to-transparent pointer-events-none"
                         style={{ animation: 'border-bt 0.35s ease 0.8s both' }} />

                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 w-11 h-11 flex items-center justify-center rounded-full text-base-content/30 hover:text-base-content hover:bg-base-200 transition-all cursor-pointer"
                    >
                        <X size={25} />
                    </button>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-base-content/30">
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
        </div>
    );
}

export default CreateMediaModal;
