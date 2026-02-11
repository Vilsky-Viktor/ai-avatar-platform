import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateAvatarStepper from "../../components/createAvatar/CreateAvatarStepper";
import { Upload, Sparkles, User, ChevronDown, X, PersonStanding } from 'lucide-react';
import { AvatarGender } from '../../types/avatar';
import { createIdPhotoJob } from '../../services/apiGateway';
import type { IdPhotoJobInput, Job } from '../../types/job';

const STORAGE_KEY = 'avatar_creation_data';

const OPTIONS = {
    ethnicity: ["northern european", "southern european", "eastern european", "east asian", "south asian", "southeast asian", "central asian", "middle eastern", "north african", "west african", "east african", "latino", "native american", "pacific islander"],
    age: ["child", "teenager", "20s", "30s", "40s", "50s", "60s", "70s", "80s+"],
    eyes: ["dark brown", "light brown", "amber", "hazel", "green", "blue", "gray", "violet", "two-toned"],
    male: {
        body: ["slim", "athletic", "average", "muscular", "large"],
        face: ["square", "oval", "round", "diamond", "angular"],
        hairStyle: ["short cut", "crew cut", "side part", "long straight", "man bun", "waves", "dreadlocks", "afro", "undercut", "bald", "braids"],
        hairColor: ["black", "dark brown", "light brown", "blonde", "ash blonde", "red", "platinum", "salt & pepper", "white"],
        skin: ["smooth", "freckled", "tanned", "weathered"],
        facialHair: ["clean-shaven", "stubble", "full beard", "short beard", "mustache", "goatee"]
    },
    female: {
        body: ["slim", "athletic", "average", "curvy", "full-figured"],
        face: ["oval", "heart", "round", "square", "diamond"],
        hairStyle: ["long straight", "long waves", "pixie cut", "ponytail", "bob cut", "curly", "afro", "box braids", "space buns", "shaved sides"],
        hairColor: ["black", "dark brown", "light brown", "honey blonde", "platinum", "auburn", "red", "silver", "pastel blue", "pastel pink"],
        skin: ["smooth", "dewy", "freckled", "matte", "sun-kissed"],
        facialHair: ["none", "full beard", "short stubble", "mustache", "light fuzz"]
    }
};

const INITIAL_SELECTIONS = {
    ethnicity: '', age: '', body: '', 
    face: '', hairStyle: '', hairColor: '', eyes: '', 
    skin: '', facialHair: ''
};

function CreateIdPhotoPage() {
    const navigate = useNavigate();
    const portraitInputRef = useRef<HTMLInputElement>(null);
    const bodyInputRef = useRef<HTMLInputElement>(null);
    
    const savedGender = (localStorage.getItem(`${STORAGE_KEY}_gender`) as AvatarGender) || AvatarGender.female;
    
    const [mode, setMode] = useState<'generate' | 'upload'>(() => 
        (localStorage.getItem(`${STORAGE_KEY}_mode`) as 'generate' | 'upload') || 'generate'
    );
    
    const [selections, setSelections] = useState(() => {
        const saved = localStorage.getItem(`${STORAGE_KEY}_selections`);
        return saved ? JSON.parse(saved) : INITIAL_SELECTIONS;
    });

    const [photos, setPhotos] = useState<{portrait: string | null, body: string | null}>({ 
        portrait: null, 
        body: null 
    });

    const [jobs, setJobs] = useState([] as Job[]);
    const [generateLoading, setGenerateLoading] = useState(false);

    const generateIdPhoto = async () => {
        setGenerateLoading(true);

        const idPhotoJob = {
            avatarId: getAvatarId(),
            input: {...selections, gender: getGender()} as IdPhotoJobInput,
        }

        try {
            const job = await createIdPhotoJob(idPhotoJob);
            setJobs((prev) => [...prev, job])
        } catch (error: any) {
            console.log('Failed to generate ID photo');
        } finally {
            setGenerateLoading(false);
        }
    }

    const getAvatarId = (): string => {
        return localStorage.getItem(`${STORAGE_KEY}_avatar_id`) || ''
    }

    const getGender = (): string => {
        return localStorage.getItem(`${STORAGE_KEY}_gender`) || ''
    }

    const handleModeSwitch = (newMode: 'generate' | 'upload') => {
        if (newMode === mode) return;
        if (newMode === 'generate') {
            setPhotos({ portrait: null, body: null });
        } else {
            setSelections(INITIAL_SELECTIONS);
            localStorage.removeItem(`${STORAGE_KEY}_selections`);
        }
        setMode(newMode);
    };

    useEffect(() => { localStorage.setItem(`${STORAGE_KEY}_mode`, mode); }, [mode]);
    
    useEffect(() => {
        if (mode === 'generate') {
            localStorage.setItem(`${STORAGE_KEY}_selections`, JSON.stringify(selections));
        }
    }, [selections, mode]);

    useEffect(() => {
        console.log(jobs);
    }, [jobs])

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'portrait' | 'body') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotos(prev => ({ ...prev, [type]: reader.result as string }));
                e.target.value = ''; 
            };
            reader.readAsDataURL(file);
        }
    };

    const isFormValid = Object.values(selections).every(value => value !== '');
    const arePhotosUploaded = photos.portrait !== null && photos.body !== null;
    const canProceed = mode === 'generate' ? isFormValid : arePhotosUploaded;

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
                        <div className="flex-1 relative rounded-[2.5rem] border border-base-content/5 bg-base-100 p-12 flex flex-col justify-between">
                            <div className="grid grid-cols-2 gap-x-12 gap-y-12">
                                {[
                                    { label: "Ethnicity", key: "ethnicity", opts: OPTIONS.ethnicity },
                                    { label: "Age", key: "age", opts: OPTIONS.age },
                                    { label: "Body", key: "body", opts: OPTIONS[savedGender].body },
                                    { label: "Face", key: "face", opts: OPTIONS[savedGender].face },
                                    { label: "Hair Style", key: "hairStyle", opts: OPTIONS[savedGender].hairStyle },
                                    { label: "Hair Color", key: "hairColor", opts: OPTIONS[savedGender].hairColor },
                                    { label: "Eyes", key: "eyes", opts: OPTIONS.eyes },
                                    { label: "Skin", key: "skin", opts: OPTIONS[savedGender].skin },
                                    { label: "Facial Hair", key: "facialHair", opts: OPTIONS[savedGender].facialHair },
                                ].map((field) => (
                                    <div key={field.key} className="group flex flex-col gap-1">
                                        <label className="text-[10px] font-medium uppercase tracking-[0.3em] text-base-content/20">{field.label}</label>
                                        <div className="relative">
                                            <select 
                                                value={selections[field.key as keyof typeof selections]}
                                                onChange={(e) => setSelections({...selections, [field.key]: e.target.value})}
                                                className="w-full py-3 bg-transparent border-b border-base-content/10 focus:border-primary transition-all duration-500 outline-none text-xl font-medium tracking-tight appearance-none cursor-pointer pr-8"
                                            >
                                                <option value="" disabled>Select</option>
                                                {field.opts.map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-base-content/20 group-hover:text-primary transition-colors">
                                                <ChevronDown size={18} strokeWidth={2.5} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={generateIdPhoto} className="btn btn-primary btn-dash group relative w-full h-20 mt-16 rounded-2xl transition-all duration-500 hover:scale-[1.01]">
                                {generateLoading && <span className="loading loading-spinner"></span>}
                                <span className="text-sm uppercase tracking-[0.4em]">Generate ID Photo</span>
                                <Sparkles size={20} className="ml-2 group-hover:rotate-12 transition-transform" />
                            </button>
                        </div>

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
                            <div className="absolute top-12 left-12 w-8 h-8 border-t-2 border-l-2 border-base-content/10" />
                            <div className="absolute bottom-12 right-12 w-8 h-8 border-b-2 border-r-2 border-base-content/10" />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8 w-full items-stretch">
                        {['portrait', 'body'].map((type) => (
                            <div 
                                key={type}
                                onClick={() => !photos[type as keyof typeof photos] && (type === 'portrait' ? portraitInputRef : bodyInputRef).current?.click()}
                                className={`flex-1 relative rounded-[3rem] border border-dashed flex flex-col items-center justify-center min-h-[600px] group transition-all duration-700 overflow-hidden ${photos[type as keyof typeof photos] ? 'border-primary/20 bg-base-200' : 'border-base-content/15 bg-transparent cursor-pointer hover:border-primary/40'}`}
                            >
                                <input type="file" ref={type === 'portrait' ? portraitInputRef : bodyInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, type as 'portrait' | 'body')} />
                                
                                {photos[type as keyof typeof photos] ? (
                                    <>
                                        <img 
                                            src={photos[type as keyof typeof photos]!} 
                                            className="absolute inset-0 w-full h-full object-contain p-16 z-0" 
                                            alt={type} 
                                        />
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setPhotos(p => ({ ...p, [type]: null })); }} 
                                            className="btn btn-circle btn-primary btn-outline absolute top-8 right-8 z-50 shadow-lg"
                                        >
                                            <X size={20} />
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="w-24 h-24 rounded-3xl border border-base-content/10 bg-base-content/[0.02] flex items-center justify-center group-hover:scale-105 group-hover:border-primary/30 transition-all duration-500">
                                            {type === 'portrait' ? (
                                                <User size={40} strokeWidth={0.8} className="text-base-content/30 group-hover:text-primary transition-colors" />
                                            ) : (
                                                <PersonStanding size={40} strokeWidth={0.8} className="text-base-content/30 group-hover:text-primary transition-colors" />
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <span className="text-[15px] font-bold uppercase tracking-[0.4em] text-base-content/40 group-hover:text-primary transition-colors">
                                                {type === 'portrait' ? 'Portrait Photo' : 'Full Body Photo'}
                                            </span>
                                            <p className="text-[11px] font-medium uppercase tracking-widest text-base-content/20 mt-1">
                                                {type === 'portrait' ? 'Upload Head & Shoulders' : 'Upload Full Body'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="absolute top-12 left-12 w-8 h-8 border-t-2 border-l-2 border-base-content/15 group-hover:border-primary/40 transition-colors z-20 pointer-events-none" />
                                <div className="absolute bottom-12 right-12 w-8 h-8 border-b-2 border-r-2 border-base-content/15 group-hover:border-primary/40 transition-colors z-20 pointer-events-none" />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-12 flex justify-center gap-6">
                <button className="btn btn-lg btn-ghost uppercase tracking-widest px-12 opacity-50 hover:opacity-100" onClick={() => navigate('/avatar/create/general')}>
                    Back
                </button>
                <button 
                    className={`btn btn-lg uppercase tracking-[0.3em] px-16 transition-all duration-500 ${
                        canProceed 
                        ? 'btn-primary shadow-primary/20 scale-100' 
                        : 'btn-disabled opacity-30 scale-95 pointer-events-none'
                    }`}
                    onClick={() => canProceed && navigate('/avatar/create-photo-set')}
                >
                    Next
                </button>
            </div>
        </div>
    );
}

export default CreateIdPhotoPage;