import React, { useRef, useState, useCallback, useEffect } from 'react';
import Cropper, { type Point, type Area } from 'react-easy-crop';
import { User, Info, X, Check, Minus, Plus, ChevronDown } from "lucide-react";
import { type UploadedIdPhoto } from "../../../types/avatarCreation";
import { AVATAR_PARAMETER_OPTIONS } from "../../../utils/avatarCreation";
import type { IdPhotoStepData, GeneralStepData } from '../../../types/avatarCreation';

type Props = {
    stepData: IdPhotoStepData,
    generalData: GeneralStepData,
    uploadedPhotos: UploadedIdPhoto[],
    setUploadedPhotos: React.Dispatch<React.SetStateAction<UploadedIdPhoto[]>>,
    setParameters: Function,
}

// Utility to handle image cropping
const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<string> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement('canvas');
    canvas.width = 1328;
    canvas.height = 1328;
    const ctx = canvas.getContext('2d');

    if (!ctx) return "";

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        1328,
        1328
    );

    return canvas.toDataURL('image/jpeg', 0.9);
};

function UploadPhotos({ stepData, generalData, setUploadedPhotos, uploadedPhotos, setParameters }: Props) {
    // We map indices to views for clarity in the UI
    const VIEW_CONFIG = [
        { label: 'Front', ref: useRef<HTMLInputElement>(null) },
        { label: 'Front smile', ref: useRef<HTMLInputElement>(null) },
        { label: 'Left quarter', ref: useRef<HTMLInputElement>(null) },
        { label: 'Right quarter', ref: useRef<HTMLInputElement>(null) },
    ];

    // Cropper State
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [idPhotoUrls, setIdPhotoUrls] = useState([]);

    useEffect(() => {
        if (stepData.finished) {
            
        }
    }, [])

    // Update specific index in the array
    const updatePhotoAtIndex = (index: number, photo: string | null) => {
        setUploadedPhotos((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], photo };
            return next;
        });
    };

    const setDraggingAtIndex = (index: number, isDragging: boolean) => {
        setUploadedPhotos((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], isDragging };
            return next;
        });
    };

    const onFileSelected = (index: number, file: File) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = () => {
            setTempImage(reader.result as string);
            setActiveIndex(index);
            setZoom(1);
            setCrop({ x: 0, y: 0 });
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = useCallback(async () => {
        if (tempImage && activeIndex !== null && croppedAreaPixels) {
            const croppedResult = await getCroppedImg(tempImage, croppedAreaPixels);
            updatePhotoAtIndex(activeIndex, croppedResult);
            closeEditor();
        }
    }, [tempImage, activeIndex, croppedAreaPixels]);

    const closeEditor = () => {
        setTempImage(null);
        setActiveIndex(null);
    };

    // Event Handlers
    const handleFileUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelected(index, file);
            e.target.value = ''; 
        }
    };

    const handleDragOver = (index: number, e: React.DragEvent) => {
        e.preventDefault();
        if (!uploadedPhotos[index]?.photo) setDraggingAtIndex(index, true);
    };

    const handleDragLeave = (index: number, e: React.DragEvent) => {
        e.preventDefault();
        setDraggingAtIndex(index, false);
    };

    const handleDrop = (index: number, e: React.DragEvent) => {
        e.preventDefault();
        setDraggingAtIndex(index, false);
        if (uploadedPhotos[index]?.photo) return;
        const file = e.dataTransfer.files?.[0];
        if (file) onFileSelected(index, file);
    };

    return (
        <div className="flex flex-col gap-8 w-full">
            {/* CROPPER MODAL */}
            {tempImage && (
                <div className="fixed inset-0 z-[100] bg-base-300/95 backdrop-blur-md flex flex-col items-center justify-center p-6">
                    <div className="w-full max-w-xl flex flex-col gap-6">
                        <div className="flex justify-between items-center text-white">
                            <h3 className="text-sm font-bold uppercase tracking-widest">Crop to square</h3>
                            <button onClick={closeEditor} className="p-2 hover:bg-white/10 rounded-full transition-colors">
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
                                onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
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
                                <button onClick={closeEditor} className="btn btn-ghost flex-1 rounded-2xl">Cancel</button>
                                <button onClick={handleCropComplete} className="btn btn-primary flex-1 rounded-2xl">
                                    <Check size={18} className="mr-2" /> Apply Crop
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Section: Instructions */}
            <div className="w-full relative rounded-[2.5rem] border border-base-content/5 bg-base-100 p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex flex-col gap-6 max-w-2xl">
                    <div className="flex items-center gap-4 text-primary">
                        <Info size={24} />
                        <span className="text-sm font-bold uppercase tracking-[0.2em]">Upload Instructions</span>
                    </div>
                    <p className="text-base-content/60 text-sm leading-relaxed">
                        Please upload clear, high-resolution photos from three different angles. These will be used as a reference to create your digital twin.
                    </p>
                    <ul className="flex flex-wrap gap-x-8 gap-y-3">
                        {[
                            "Face clearly visible & well-lit",
                            "Neutral expression",
                            "No hats or sunglasses"
                        ].map((text, i) => (
                            <li key={i} className="flex gap-3 items-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                <span className="text-[10px] font-medium text-base-content/40 uppercase tracking-wider">{text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                
                <div className="hidden md:flex flex-col p-6 rounded-3xl bg-base-200/50 border border-base-content/5 gap-6 w-[300px]">
                    {[
                        { label: "Height", key: "height", opts: AVATAR_PARAMETER_OPTIONS.height },
                        { label: "Body", key: "body", opts: AVATAR_PARAMETER_OPTIONS[generalData.gender].body },
                        { label: "Bust Size", key: "bustSize", opts: AVATAR_PARAMETER_OPTIONS.bustSize },
                        { label: "Body Hair", key: "bodyHair", opts: AVATAR_PARAMETER_OPTIONS.bodyHair },
                    ].map((field) => (
                        <div key={field.key} className={`group flex flex-col gap-0.5 ${stepData.finished ? 'opacity-50' : 'opacity-100'}`}>
                            <label className="text-[10px] font-medium uppercase tracking-[0.3em] text-base-content/20">
                                {field.label}
                            </label>

                            <div className="relative">
                                <select
                                    value={stepData.parameters[field.key as keyof typeof stepData.parameters]}
                                    disabled={stepData.finished}
                                    onChange={(e) => setParameters({...stepData.parameters, [field.key]: e.target.value})}
                                    className="w-full py-1.5 bg-transparent border-b border-base-content/10 focus:border-primary transition-all duration-500 outline-none text-base font-medium tracking-tight appearance-none cursor-pointer pr-8"
                                >
                                    <option value="" disabled>Select</option>
                                    {field.opts.map(o => <option key={o} value={o}>{o}</option>)}

                                </select>

                                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-base-content/20 group-hover:text-primary transition-colors">
                                    <ChevronDown size={16} strokeWidth={2.5} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Section: Three Upload Slots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
                {VIEW_CONFIG.map((view, index) => {
                    const photoData = uploadedPhotos[index];
                    const hasPhoto = !!photoData?.photo;

                    return (
                        <div 
                            key={index}
                            onDragOver={(e) => handleDragOver(index, e)}
                            onDragLeave={(e) => handleDragLeave(index, e)}
                            onDrop={(e) => handleDrop(index, e)}
                            onClick={() => !hasPhoto && view.ref.current?.click()}
                            className={`relative rounded-[2.5rem] border border-dashed flex flex-col items-center justify-center aspect-square group transition-all duration-700 overflow-hidden
                                ${hasPhoto ? 'border-primary/20 bg-base-200' : 'border-base-content/15 bg-transparent cursor-pointer hover:border-primary/40'} 
                                ${photoData?.isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : ''}`}
                        >
                            <input 
                                type="file" 
                                ref={view.ref} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={(e) => handleFileUpload(index, e)} 
                            />
                            
                            {hasPhoto ? (
                                <>
                                    <img 
                                        src={photoData.photo!} 
                                        className="absolute inset-0 w-full h-full object-contain z-0 rounded-[2.5rem]" 
                                        alt={view.label} 
                                    />
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            updatePhotoAtIndex(index, null); 
                                        }} 
                                        className="btn btn-circle btn-sm btn-primary btn-outline absolute top-6 right-6 z-50 shadow-lg"
                                    >
                                        <X size={16} />
                                    </button>
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-6 pointer-events-none">
                                    <div className="w-20 h-20 rounded-2xl border border-base-content/10 bg-base-content/[0.02] flex items-center justify-center group-hover:scale-105 group-hover:border-primary/30 transition-all duration-500">
                                        <User 
                                            size={32} 
                                            strokeWidth={0.8} 
                                            className={`transition-colors ${photoData?.isDragging ? 'text-primary' : 'text-base-content/30 group-hover:text-primary'}`} 
                                        />
                                    </div>
                                    <div className="text-center px-4">
                                        <span className={`text-[13px] font-bold uppercase tracking-[0.3em] transition-colors ${photoData?.isDragging ? 'text-primary' : 'text-base-content/40 group-hover:text-primary'}`}>
                                            {photoData?.isDragging ? 'Drop Here' : view.label}
                                        </span>
                                        <p className="text-[10px] font-medium uppercase tracking-widest text-base-content/20 mt-2">Click or drag & drop</p>
                                    </div>
                                </div>
                            )}

                            {!hasPhoto && (
                                <>
                                    <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-base-content/10 pointer-events-none" />
                                    <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-base-content/10 pointer-events-none" />
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default UploadPhotos;