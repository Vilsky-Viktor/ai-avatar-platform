import { User, Trash2 } from 'lucide-react';
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
};

function PhotoUploadGrid({ viewConfig, uploadedPhotos, onDragOver, onDragLeave, onDrop, onFileUpload, onRemovePhoto, removable }: Props) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full mt-8">
            {viewConfig.map((view, index) => {
                const photoData = uploadedPhotos[index];
                const imageSrc = photoData?.photo || photoData?.mediaUrl;
                const hasPhoto = !!imageSrc;

                return (
                    <div
                        key={index}
                        onDragOver={(e) => onDragOver(index, e)}
                        onDragLeave={(e) => onDragLeave(index, e)}
                        onDrop={(e) => onDrop(index, e)}
                        onClick={() => !hasPhoto && view.ref.current?.click()}
                        className={`relative rounded-[1rem] border border-dashed flex flex-col items-center justify-center aspect-square group transition-all duration-700 overflow-hidden
                            ${hasPhoto ? 'border-primary/20 bg-base-200' : 'border-base-content/15 bg-transparent cursor-pointer hover:border-primary/40'}
                            ${photoData?.isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : ''}`}
                    >
                        <input
                            type="file"
                            ref={view.ref}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => onFileUpload(index, e)}
                        />

                        {hasPhoto ? (
                            <>
                                <img
                                    src={imageSrc!}
                                    className="absolute inset-0 w-full h-full object-contain z-0 rounded-[1rem]"
                                    alt={view.label}
                                />
                                {removable && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemovePhoto(index);
                                        }}
                                        className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center group-hover:hover:bg-error transition-all cursor-pointer"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-4 pointer-events-none">
                                <div className="flex items-center justify-center group-hover:scale-105 transition-all duration-500">
                                    <User
                                        size={50}
                                        strokeWidth={0.8}
                                        className={`transition-colors ${photoData?.isDragging ? 'text-primary' : 'text-base-content/30 group-hover:text-primary'}`}
                                    />
                                </div>
                                <div className="text-center">
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
    );
}

export default PhotoUploadGrid;
