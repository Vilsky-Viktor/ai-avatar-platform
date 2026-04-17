import { X, Minus, Plus, Check } from 'lucide-react';
import Cropper, { type Point, type Area } from 'react-easy-crop';

type Props = {
    tempImage: string | null;
    crop: Point;
    zoom: number;
    setCrop: (crop: Point) => void;
    setZoom: (zoom: number) => void;
    onCropAreaChange: (croppedArea: Area, croppedAreaPixels: Area) => void;
    onClose: () => void;
    onApply: () => void;
};

function ImageCropperModal({ tempImage, crop, zoom, setCrop, setZoom, onCropAreaChange, onClose, onApply }: Props) {
    if (!tempImage) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-base-300/95 backdrop-blur-md flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-xl flex flex-col gap-6">
                <div className="flex justify-between items-center text-white">
                    <h3 className="text-sm font-bold uppercase tracking-widest">Crop to square</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={40} />
                    </button>
                </div>

                <div className="relative w-full aspect-square rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-black">
                    <Cropper
                        image={tempImage}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropAreaChange}
                    />
                </div>

                <div className="flex flex-col gap-6 bg-base-100 p-8 rounded-[2rem] border border-white/5">
                    <div className="flex items-center gap-4">
                        <Minus size={16} className="opacity-40" />
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.1}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="range range-primary range-xs flex-1"
                        />
                        <Plus size={16} className="opacity-40" />
                    </div>

                    <div className="flex gap-3">
                        <button onClick={onClose} className="btn btn-ghost flex-1 rounded-2xl">Cancel</button>
                        <button onClick={onApply} className="btn btn-primary flex-1 rounded-2xl">
                            <Check size={18} className="mr-2" /> Apply Crop
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ImageCropperModal;
