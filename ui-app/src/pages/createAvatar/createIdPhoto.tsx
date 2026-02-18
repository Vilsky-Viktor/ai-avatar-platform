import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateAvatarStepper from "../../components/createAvatar/CreateAvatarStepper";
import { 
    Upload, Sparkles, User, ChevronDown, X, ChevronLeft, ChevronRight, 
    Loader2, Clock, CheckSquare, Square, Info 
} from 'lucide-react';
import { AvatarGender, AvatarStatus } from '../../types/avatar';
import { createIdPhotoJob, updateAvatar } from '../../services/apiGateway';
import { JobStatuses, type IdPhotoJobInput, type Job } from '../../types/job';
import { listenToDocChanges } from '../../services/db';
import { useApp } from '../../providers/ContextProvider';
import { v4 as uuid4 } from 'uuid';
import { createMedia } from '../../services/apiGateway';
import { MediaTypes, MediaSections, type Media } from '../../types/media';
import { getMediaUrlFromPath, uploadMediaToBucket } from '../../services/storage';

const STORAGE_KEY = 'avatar_creation_data';

const OPTIONS = {
    ethnicity: ["northern european", "southern european", "eastern european", "east asian", "south asian", "southeast asian", "central asian", "middle eastern", "north african", "west african", "east african", "latino", "native american", "pacific islander"],
    skinColor: ["porcelain", "fair", "ivory", "beige", "olive", "tan", "caramel", "brown", "dark-brown", "ebony"],
    age: ["child", "teenager", "20s", "30s", "40s", "50s", "60s", "70s", "80s+"],
    eyes: ["dark brown", "light brown", "amber", "hazel", "green", "blue", "gray", "violet", "two-toned"],
    eyeLashes: ["none", "short sparse", "short dense", "medium natural", "medium curled", "long wispy", "long dramatic", "tapered"],
    eyeBrows: ["thin straight", "thin arched", "medium natural", "medium rounded", "thick bushy", "thick groomed", "monobrow", "faded tail"],
    nose: ["small button", "small upturned", "medium straight", "medium roman", "large aquiline", "large bulbous", "broad flat", "crooked"],
    lips: ["full", "thin", "heart-shaped", "wide", "round", "bow-shaped", "heavy-upper", "heavy-lower", "downward-turned"],
    ears: ["attached", "detached", "petite", "protruding", "pointed", "elven", "round", "droopy"],
    bustSize: ["flat", "small", "medium", "large", "extra-large"],
    male: {
        attractiveness: ["rugged", "handsome", "pretty boy", "masculine", "scholarly", "weathered", "sharp", "soft featured", "unconventional", "intimidating", "approachable"],
        body: ["slim", "athletic", "average", "muscular", "large"],
        face: ["square", "oval", "round", "diamond", "angular"],
        hairStyle: ["short cut", "crew cut", "side part", "long straight", "man bun", "waves", "dreadlocks", "afro", "undercut", "bald", "braids"],
        hairColor: ["black", "dark brown", "light brown", "blonde", "ash blonde", "red", "platinum", "salt & pepper", "white"],
        skin: ["smooth", "freckled", "tanned", "weathered"],
        facialHair: ["clean-shaven", "stubble", "full beard", "short beard", "mustache", "goatee"],
        outfit: ["minimalist", "streetwear", "business professional", "smart casual", "rugged outdoors", "vintage 90s", "skater", "preppy", "techwear", "athleisure", "bohemian", "classic tailored", "punk rock", "avant garde", "workwear"]
    },
    female: {
        attractiveness: ["beautiful", "cute", "elegant", "androgynous", "striking", "ethereal", "youthful", "mature", "bold", "natural", "glamorous"],
        body: ["slim", "athletic", "average", "curvy", "full-figured"],
        face: ["oval", "heart", "round", "square", "diamond"],
        hairStyle: ["long straight", "long waves", "pixie cut", "ponytail", "bob cut", "curly", "afro", "box braids", "space buns", "shaved sides"],
        hairColor: ["black", "dark brown", "light brown", "honey blonde", "platinum", "auburn", "red", "silver", "pastel blue", "pastel pink"],
        skin: ["smooth", "dewy", "freckled", "matte", "sun-kissed"],
        facialHair: ["none", "full beard", "short stubble", "mustache", "light fuzz"],
        outfit: ["chic minimalist", "streetwear", "business formal", "boho artistic", "cottagecore", "vintage glamour", "athleisure", "preppy academy", "grunge", "y2k aesthetic", "high fashion", "soft girl", "cyberpunk", "classic elegant", "tomboy"]
    }
};

const INITIAL_SELECTIONS = {
    ethnicity: '', skinColor: '', age: '', attractiveness: '', body: '', 
    face: '', hairStyle: '', hairColor: '', nose: '', eyes: '', eyeLashes: '', eyeBrows: '', 
    skin: '', facialHair: '', outfit: '', lips: '', ears: '', bustSize: ''
};

function CreateIdPhotoPage() {
    const navigate = useNavigate();
    const portraitInputRef = useRef<HTMLInputElement>(null);
    const { user } = useApp();
    
    const savedGender = (localStorage.getItem(`${STORAGE_KEY}_gender`) as AvatarGender) || AvatarGender.female;
    
    const [mode, setMode] = useState<'generate' | 'upload'>(() => 
        (localStorage.getItem(`${STORAGE_KEY}_mode`) as 'generate' | 'upload') || 'generate'
    );
    
    const [selections, setSelections] = useState(() => {
        const saved = localStorage.getItem(`${STORAGE_KEY}_selections`);
        return saved ? JSON.parse(saved) : INITIAL_SELECTIONS;
    });

    const [photos, setPhotos] = useState<{portrait: string | null | null}>(() => {
        const savedPortrait = sessionStorage.getItem(`${STORAGE_KEY}_uploaded_portrait`);
        return { 
            portrait: savedPortrait || null,
        };
    });

    const [isDragging, setIsDragging] = useState(false);

    // --- Persisted State ---
    const [jobs, setJobs] = useState<Job[]>(() => {
        const saved = localStorage.getItem(`${STORAGE_KEY}_jobs`);
        return saved ? JSON.parse(saved) : [];
    });

    const [generatedImages, setGeneratedImages] = useState<{url: string, bucketPath: string}[]>(() => {
        const saved = localStorage.getItem(`${STORAGE_KEY}_generated_images`);
        return saved ? JSON.parse(saved) : [];
    });

    const [selectedImage, setSelectedImage] = useState<string | null>(() => {
        return localStorage.getItem(`${STORAGE_KEY}_selected_image`);
    });

    const [generateLoading, setGenerateLoading] = useState(false);
    const [activeJob, setActiveJob] = useState<Job | null>(null);
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [isImageRendering, setIsImageRendering] = useState(false);
    const [nextLoading, setNextLoading] = useState(false);

    // --- Persistence Hooks ---
    useEffect(() => { localStorage.setItem(`${STORAGE_KEY}_mode`, mode); }, [mode]);
    useEffect(() => { localStorage.setItem(`${STORAGE_KEY}_jobs`, JSON.stringify(jobs)); }, [jobs]);
    useEffect(() => { localStorage.setItem(`${STORAGE_KEY}_generated_images`, JSON.stringify(generatedImages)); }, [generatedImages]);
    useEffect(() => {
        if (selectedImage) localStorage.setItem(`${STORAGE_KEY}_selected_image`, selectedImage);
        else localStorage.removeItem(`${STORAGE_KEY}_selected_image`);
    }, [selectedImage]);

    useEffect(() => {
        if (selectedImage && generatedImages.length > 0) {
            const index = generatedImages.findIndex(img => img.bucketPath === selectedImage);
            if (index !== -1) setCarouselIndex(index);
        }
    }, []);

    const generateIdPhoto = async () => {
        setGenerateLoading(true);
        setSelectedImage(null);
        
        const idPhotoJob = {
            avatarId: getAvatarId(),
            input: {...selections, gender: getGender()} as IdPhotoJobInput,
        };

        try {
            const job = await createIdPhotoJob(idPhotoJob);
            setJobs((prev) => [...prev, job]);
        } catch (error: any) {
            console.error('Failed to generate ID photo');
        } finally {
            setGenerateLoading(false);
        }
    };

    const getAvatarId = (): string => localStorage.getItem(`${STORAGE_KEY}_avatar_id`) || '';
    const getGender = (): string => localStorage.getItem(`${STORAGE_KEY}_gender`) || '';

    const handleModeSwitch = (newMode: 'generate' | 'upload') => {
        if (newMode === mode) return;
        if (newMode === 'generate') {
            setPhotos({ portrait: null });
            sessionStorage.removeItem(`${STORAGE_KEY}_uploaded_portrait`);
        } else {
            setSelections(INITIAL_SELECTIONS);
            setGeneratedImages([]);
            setSelectedImage(null);
            localStorage.removeItem(`${STORAGE_KEY}_selections`);
            localStorage.removeItem(`${STORAGE_KEY}_generated_images`);
            localStorage.removeItem(`${STORAGE_KEY}_selected_image`);
        }
        setMode(newMode);
    };

    useEffect(() => {
        if (mode === 'generate') {
            localStorage.setItem(`${STORAGE_KEY}_selections`, JSON.stringify(selections));
        }
    }, [selections, mode]);

    useEffect(() => {
        if (jobs.length === 0) return;
        const latestJob = jobs[jobs.length - 1];
        if (latestJob.status !== JobStatuses.completed && latestJob.status !== JobStatuses.error) {
            setActiveJob(latestJob);
        }
    }, [jobs]);

    useEffect(() => {
        if (!activeJob?.id) return;

        const unsubscribe = listenToDocChanges('jobs', activeJob.id, async (docSnap) => {
            if (docSnap.exists()) {
                const jobData = { id: docSnap.id, ...docSnap.data() } as Job;
                setJobs(prev => prev.map(j => j.id === jobData.id ? jobData : j));
                setActiveJob(jobData);

                if (jobData.status === JobStatuses.completed && jobData.result?.mediaPath) {
                    const downloadUrl = await getMediaUrlFromPath(jobData.result.mediaPath)

                    setGeneratedImages((prev) => {
                        if (prev.some(img => img.bucketPath === jobData.result!.mediaPath)) return prev;
                        const newList = [...prev, { url: downloadUrl, bucketPath: jobData.result!.mediaPath! }];
                        setCarouselIndex(newList.length - 1);
                        return newList;
                    });
                    setActiveJob(null);
                }
            }
        });

        return () => unsubscribe();
    }, [activeJob?.id]);

    const nextStep = async () => {
        if (!canProceed) return

        setNextLoading(true);

        const avatarId = getAvatarId();

        try {
            const media: Media = {
                userId: user?.id!,
                avatarId: avatarId,
                jobId: '',
                type: MediaTypes.image,
                section: MediaSections.avatar,
                isRemovable: false,
                isIdPhoto: true,
                isPhotoSet: false,
                path: ''
            }

            if (!localStorage.getItem(`${STORAGE_KEY}_id_media`)) {
                if (mode === 'generate') {
                    const job = jobs.find((j: Job) => j.result?.mediaPath === selectedImage);
                    if (!job) {
                        throw new Error(`Did not find a job related to selected image - ${selectedImage}`);
                    }
                    
                    media.jobId = job?.id;
                    media.path = selectedImage!
                    await createMedia(media);
                } else {
                    const mediaPath = `media/${user?.id}-user/avatars/${getAvatarId()}-avatar/images/${uuid4()}.png`;
                    await uploadMediaToBucket(mediaPath, photos.portrait!);
                    media.path = mediaPath;
                    await createMedia(media);
                }

                await updateAvatar(avatarId, {status: AvatarStatus.idCreated, parameters: selections});

                localStorage.setItem(`${STORAGE_KEY}_id_media`, JSON.stringify(media));
            }

            setNextLoading(false);
            navigate('/avatar/create/photo-set');
        } catch (error) {
            console.log(`Did not manage to create a new media: ${error}`);
            setNextLoading(false);
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'portrait' | 'body') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setPhotos(prev => ({ ...prev, [type]: result }));
                if (type === 'portrait') {
                    sessionStorage.setItem(`${STORAGE_KEY}_uploaded_portrait`, result);
                }
                e.target.value = ''; 
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!photos.portrait) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (photos.portrait) return;

        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setPhotos(prev => ({ ...prev, portrait: result }));
                sessionStorage.setItem(`${STORAGE_KEY}_uploaded_portrait`, result);
            };
            reader.readAsDataURL(file);
        }
    };

    const isFormValid = Object.values(selections).every(value => value !== '');
    const canProceed = mode === 'generate' ? (selectedImage !== null) : (photos.portrait !== null);

    const renderRightColumn = () => {
        const isJobActive = activeJob?.status === JobStatuses.pending || activeJob?.status === JobStatuses.generating;

        if (isJobActive) {
            const isGenerating = activeJob?.status === JobStatuses.generating;
            return (
                <div className="flex-1 relative rounded-[3rem] border border-primary/20 bg-primary/[0.02] flex flex-col items-center justify-center min-h-[600px]">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            {isGenerating ? (
                                <>
                                    <Loader2 size={48} strokeWidth={1} className="text-primary animate-spin" />
                                    <Sparkles size={20} className="absolute -top-2 -right-3 text-primary animate-pulse" />
                                </>
                            ) : (
                                <div className="w-16 h-16 rounded-full border border-base-content/5 flex items-center justify-center animate-pulse">
                                    <Clock size={32} strokeWidth={0.5} className="text-base-content/30" />
                                </div>
                            )}
                        </div>
                        <div className="text-center">
                            <span className="text-[15px] font-bold uppercase tracking-[0.4em] text-primary">
                                {isGenerating ? 'Generating' : 'Waiting'}
                            </span>
                            <p className="text-[11px] font-medium uppercase tracking-widest text-base-content/20 mt-1">
                                {isGenerating ? 'Creating a new life' : 'Queue processing'}
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        if (generatedImages.length > 0) {
            const currentImg = generatedImages[carouselIndex];
            const isSelected = selectedImage === currentImg.bucketPath;

            return (
                <div className="flex-1 relative rounded-[3rem] border border-base-content/10 bg-base-200/30 flex flex-col items-center justify-center min-h-[600px] overflow-hidden group">
                    {isImageRendering && (
                        <div className="absolute inset-0 flex items-center justify-center bg-base-200/50 backdrop-blur-sm z-10 animate-pulse">
                             <Loader2 size={32} strokeWidth={1} className="text-primary/40 animate-spin" />
                        </div>
                    )}
                    <img 
                        key={currentImg.url}
                        src={currentImg.url} 
                        onLoad={() => setIsImageRendering(false)}
                        onLoadStart={() => setIsImageRendering(true)}
                        className={`absolute inset-0 w-full h-full object-contain p-16 transition-all duration-700 z-0 ${isSelected ? 'scale-100 opacity-100' : 'scale-95 opacity-80'} ${isImageRendering ? 'opacity-0' : 'opacity-100'}`} 
                        alt="Generated" 
                    />
                    
                    <div className="absolute top-12 right-12 flex flex-col items-end gap-3 z-20">
                        <button 
                            onClick={() => setSelectedImage(isSelected ? null : currentImg.bucketPath)}
                            className={`btn btn-lg h-16 w-16 btn-circle shadow-2xl transition-all duration-500 border-2 ${
                                isSelected 
                                ? 'btn-primary border-primary scale-110' 
                                : 'bg-base-100/80 backdrop-blur-xl border-white/20 hover:border-primary/50 hover:scale-105'
                            }`}
                        >
                            {isSelected ? (
                                <CheckSquare size={28} strokeWidth={2.5} />
                            ) : (
                                <Square size={28} strokeWidth={1.5} className="text-base-content/40 group-hover:text-primary transition-colors" />
                            )}
                        </button>
                    </div>

                    {generatedImages.length > 1 && (
                        <div className="absolute bottom-12 flex gap-8 items-center bg-base-100/60 backdrop-blur-2xl px-8 py-4 rounded-[2rem] border border-white/10 shadow-2xl transition-all duration-500 hover:bg-base-100/80 z-20">
                            <button onClick={() => { setIsImageRendering(true); setCarouselIndex(p => (p - 1 + generatedImages.length) % generatedImages.length); }} className="hover:text-primary transition-colors p-2">
                                <ChevronLeft size={24} />
                            </button>
                            <span className="text-xs font-bold tracking-[0.4em] uppercase opacity-40">{carouselIndex + 1} / {generatedImages.length}</span>
                            <button onClick={() => { setIsImageRendering(true); setCarouselIndex(p => (p + 1) % generatedImages.length); }} className="hover:text-primary transition-colors p-2">
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    )}

                    <div className="absolute top-12 left-12 w-8 h-8 border-t-2 border-l-2 border-base-content/10 pointer-events-none" />
                    <div className="absolute bottom-12 right-12 w-8 h-8 border-b-2 border-r-2 border-base-content/10 pointer-events-none" />
                </div>
            );
        }

        return (
            <div className="flex-1 relative rounded-[3rem] border border-dashed border-base-content/10 bg-transparent flex flex-col items-center justify-center min-h-[600px]">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-24 h-24 rounded-3xl border border-base-content/5 bg-base-content/[0.01] flex items-center justify-center">
                        <User size={40} strokeWidth={0.5} className="text-base-content/10" />
                    </div>
                    <div className="text-center">
                        <span className="text-[15px] font-bold uppercase tracking-[0.4em] text-base-content/20">ID photo</span>
                        <p className="text-[11px] font-medium uppercase tracking-widest text-base-content/10 mt-1">Click generate to visualize</p>
                    </div>
                </div>
                <div className="absolute top-12 left-12 w-8 h-8 border-t-2 border-l-2 border-base-content/10 pointer-events-none" />
                <div className="absolute bottom-12 right-12 w-8 h-8 border-b-2 border-r-2 border-base-content/10 pointer-events-none" />
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto px-4 pb-20">
            <CreateAvatarStepper step={1} />

            <div className="flex justify-center mt-8">
                <div className="bg-base-200 p-1 rounded-2xl flex gap-1 border border-base-content/5">
                    <button onClick={() => handleModeSwitch('generate')} className={`px-6 py-2 cursor-pointer rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${mode === 'generate' ? 'bg-base-100 shadow-sm text-primary' : 'opacity-50 hover:opacity-100'}`}>
                        <Sparkles size={16} /> Generate
                    </button>
                    <button onClick={() => handleModeSwitch('upload')} className={`px-6 py-2 cursor-pointer rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${mode === 'upload' ? 'bg-base-100 shadow-sm text-primary' : 'opacity-50 hover:opacity-100'}`}>
                        <Upload size={16} /> My Photos
                    </button>
                </div>
            </div>

            <div className="mt-12 w-full">
                {mode === 'generate' ? (
                    <div className="flex flex-col lg:flex-row gap-8 w-full items-stretch">
                        <div className="w-full lg:max-w-[560px] relative rounded-[2.5rem] border border-base-content/5 bg-base-100 p-8 flex flex-col justify-between shrink-0">
                            <div className="grid grid-cols-2 gap-x-10 gap-y-5"> {/* Reduced gap-y from 10 to 5 */}
                                {[
                                    { label: "Ethnicity", key: "ethnicity", opts: OPTIONS.ethnicity },
                                    { label: "Skin Color", key: "skinColor", opts: OPTIONS.skinColor },
                                    { label: "Age", key: "age", opts: OPTIONS.age },
                                    { label: "Attractiveness", key: "attractiveness", opts: OPTIONS[savedGender].attractiveness },
                                    { label: "Body", key: "body", opts: OPTIONS[savedGender].body },
                                    { label: "Bust Size", key: "bustSize", opts: OPTIONS.bustSize },
                                    { label: "Face", key: "face", opts: OPTIONS[savedGender].face },
                                    { label: "Hair Style", key: "hairStyle", opts: OPTIONS[savedGender].hairStyle },
                                    { label: "Hair Color", key: "hairColor", opts: OPTIONS[savedGender].hairColor },
                                    { label: "Ears", key: "ears", opts: OPTIONS.ears },
                                    { label: "Nose", key: "nose", opts: OPTIONS.nose },
                                    { label: "Lips", key: "lips", opts: OPTIONS.lips },
                                    { label: "Eyes", key: "eyes", opts: OPTIONS.eyes }, // Fixed the typo here
                                    { label: "Eye Lashes", key: "eyeLashes", opts: OPTIONS.eyeLashes },
                                    { label: "Eye Brows", key: "eyeBrows", opts: OPTIONS.eyeBrows },
                                    { label: "Skin", key: "skin", opts: OPTIONS[savedGender].skin },
                                    { label: "Facial Hair", key: "facialHair", opts: OPTIONS[savedGender].facialHair },
                                    { label: "Outfit", key: "outfit", opts: OPTIONS[savedGender].outfit },
                                ].map((field) => (
                                    <div key={field.key} className="group flex flex-col gap-0.5"> {/* Tightened gap */}
                                        <label className="text-[10px] font-medium uppercase tracking-[0.3em] text-base-content/20">
                                            {field.label}
                                        </label>
                                        <div className="relative">
                                            <select 
                                                value={selections[field.key as keyof typeof selections]}
                                                onChange={(e) => setSelections({...selections, [field.key]: e.target.value})}
                                                className="w-full py-1.5 bg-transparent border-b border-base-content/10 focus:border-primary transition-all duration-500 outline-none text-base font-medium tracking-tight appearance-none cursor-pointer pr-8"
                                            > {/* Reduced py-2 to py-1.5 and text-lg to text-base */}
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
                            <button 
                                onClick={generateIdPhoto} 
                                disabled={!isFormValid || generateLoading || activeJob !== null}
                                className="btn btn-primary btn-dash group relative w-full h-14 mt-8 rounded-2xl transition-all duration-500 hover:scale-[1.01]"
                            > {/* Reduced h-16 to h-14 and mt-12 to mt-8 */}
                                {generateLoading && <span className="loading loading-spinner"></span>}
                                <span className="text-sm uppercase tracking-[0.4em]">Generate ID Photo</span>
                                <Sparkles size={20} className="ml-2 group-hover:rotate-12 transition-transform" />
                            </button>
                        </div>
                        {renderRightColumn()}
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8 w-full items-stretch">
                        {/* LEFT COLUMN: EXPLANATION AND EXAMPLE */}
                        <div className="w-full lg:max-w-[510px] relative rounded-[2.5rem] border border-base-content/5 bg-base-100 p-10 flex flex-col justify-between shrink-0">
                            <div className="flex flex-col gap-8">
                                <div className="flex items-center gap-4 text-primary">
                                    <Info size={24} />
                                    <span className="text-sm font-bold uppercase tracking-[0.2em]">Upload Instructions</span>
                                </div>
                                <div className="space-y-6">
                                    <p className="text-base-content/60 text-sm leading-relaxed">
                                        Please upload a clear, high-resolution portrait photo. This photo will be used as a reference to create your digital twin.
                                    </p>
                                    <ul className="space-y-4">
                                        {[
                                            "Face should be clearly visible and well-lit",
                                            "Neutral expression or a natural smile",
                                            "Avoid hats, sunglasses, or heavy filters",
                                            "Direct look into the camera is preferred"
                                        ].map((text, i) => (
                                            <li key={i} className="flex gap-3 items-start">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                                <span className="text-xs font-medium text-base-content/40 uppercase tracking-wider">{text}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <div className="mt-12 p-8 rounded-3xl bg-base-200/50 border border-base-content/5 flex items-center justify-center opacity-40">
                                <div className="relative">
                                    <User size={80} strokeWidth={0.5} />
                                    <div className="absolute inset-0 border-2 border-dashed border-primary/30 rounded-full scale-125" />
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: PORTRAIT UPLOAD WITH DRAG & DROP */}
                        <div 
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => !photos.portrait && portraitInputRef.current?.click()}
                            className={`flex-1 relative rounded-[3rem] border border-dashed flex flex-col items-center justify-center min-h-[600px] group transition-all duration-700 overflow-hidden ${photos.portrait ? 'border-primary/20 bg-base-200' : 'border-base-content/15 bg-transparent cursor-pointer hover:border-primary/40'} ${isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : ''}`}
                        >
                            <input type="file" ref={portraitInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'portrait')} />
                            {photos.portrait ? (
                                <>
                                    <img src={photos.portrait} className="absolute inset-0 w-full h-full object-contain p-16 z-0" alt="Portrait" />
                                    <button onClick={(e) => { e.stopPropagation(); setPhotos(p => ({ ...p, portrait: null })); sessionStorage.removeItem(`${STORAGE_KEY}_uploaded_portrait`); }} className="btn btn-circle btn-primary btn-outline absolute top-8 right-8 z-50 shadow-lg"><X size={20} /></button>
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-6 pointer-events-none">
                                    <div className="w-24 h-24 rounded-3xl border border-base-content/10 bg-base-content/[0.02] flex items-center justify-center group-hover:scale-105 group-hover:border-primary/30 transition-all duration-500">
                                        <User size={40} strokeWidth={0.8} className={`transition-colors ${isDragging ? 'text-primary' : 'text-base-content/30 group-hover:text-primary'}`} />
                                    </div>
                                    <div className="text-center">
                                        <span className={`text-[15px] font-bold uppercase tracking-[0.4em] transition-colors ${isDragging ? 'text-primary' : 'text-base-content/40 group-hover:text-primary'}`}>
                                            {isDragging ? 'Drop Image Here' : 'Portrait Photo'}
                                        </span>
                                        <p className="text-[11px] font-medium uppercase tracking-widest text-base-content/20 mt-2">Click or drag & drop</p>
                                    </div>
                                </div>
                            )}
                            {!photos.portrait && (
                                <>
                                    <div className="absolute top-12 left-12 w-8 h-8 border-t-2 border-l-2 border-base-content/10 pointer-events-none" />
                                    <div className="absolute bottom-12 right-12 w-8 h-8 border-b-2 border-r-2 border-base-content/10 pointer-events-none" />
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-12 flex justify-center gap-6">
                <button className="btn btn-lg btn-ghost uppercase tracking-widest px-12 opacity-50 hover:opacity-100" onClick={() => navigate('/avatar/create/general')}>Back</button>
                <button 
                    disabled={!canProceed}
                    className={`btn btn-lg uppercase tracking-[0.3em] px-16 transition-all duration-500 ${canProceed ? 'btn-primary shadow-primary/20 scale-100' : 'btn-disabled opacity-30 scale-95'}`}
                    onClick={nextStep}
                >
                    {nextLoading && <span className="loading loading-spinner"></span>}
                    Next
                </button>
            </div>
        </div>
    );
}

export default CreateIdPhotoPage;