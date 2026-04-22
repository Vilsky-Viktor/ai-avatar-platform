import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateAvatarStepper from '../../components/createAvatar/CreateAvatarStepper';
import { User, ChevronDown } from 'lucide-react';
import { createAvatar, getAvatarById } from '../../services/apiGateway';
import { AvatarTypes, type Avatar } from '../../types/avatar';
import { AvatarGender } from '../../types/avatar';
import { getAvatarData, initialAvatarData, initialNewAvatarData, saveAvatarData } from '../../utils/avatarCreation';
import { type NewAvatarData  } from "../../types/avatarCreation";
import BottomDock from '../../components/createAvatar/BottomDock'
import { AVATAR_PARAMETER_OPTIONS } from "../../utils/avatarCreation";
import { scrollToTop } from '../../utils/scroller';


function GeneralPage() {
    const navigate = useNavigate();

    const [newAvatarData, setNewAvatarData] = useState(() => getAvatarData());
    const [pageLoading, setPageLoading] = useState(true);
    const [avatar, setAvatar] = useState(initialAvatarData);

    useEffect(() => {
        scrollToTop();

        initPage();
    }, []);

    useEffect(() => {
        saveAvatarData(newAvatarData);
    }, [newAvatarData]);

    useEffect(() => {
        const slug = avatar.name
        .toLowerCase()
        .replace(/[_\s]+/g, '-')     
        .replace(/[^a-z0-9-]/g, '')  
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

        setSlug(slug);
    }, [avatar.name]);

    const initPage = async () => {
        if (newAvatarData.avatarId) {
            const existingAvatar = await getAvatarById(newAvatarData.avatarId);
            setAvatar(existingAvatar);
        }

        setPageLoading(false);
    }

    const setSlug = (slug: string) => {
        setAvatar((avatar: Avatar) => ({...avatar, slug}))
    }

    const setName = (name: string) => {
        setAvatar((avatar: Avatar) => ({...avatar, name}))
    }

    const setType = (type: AvatarTypes) => {
        setAvatar((avatar: Avatar) => ({...avatar, type}))
    }

    const setParameter = (key: string, value: string) => {
        setAvatar((avatar: Avatar) => ({...avatar, parameters: { ...avatar.parameters, [key]: value }}))
    }

    const setAvatarId = (avatarId: string) => {
        setNewAvatarData((prev: NewAvatarData) => ({...prev, avatarId}));
    }

    const canProceed = () => {
        if (!avatar) return false;

        const nameFilled = avatar.name.trim().length > 2;
        const typeFilled = avatar.type;
        const paramsFilled = avatar.parameters.gender && avatar.parameters.height && avatar.parameters.body && avatar.parameters.bodyHair && avatar.parameters.bustSize;
        
        return nameFilled && typeFilled && paramsFilled;
    };
    
    const stepLocked = () => {
        return Boolean(avatar.id);
    }

    const nextStep = async () => {
        try {
            if (!stepLocked()) {
                const avatarDb = await createAvatar(avatar);
                setAvatarId(avatarDb.id!);
            }

            if (avatar.type === AvatarTypes.digitalTwin) {
                navigate('/avatar/create/twin-id-photos');
            } else {
                navigate('/avatar/create/synthetic-id-photos');
            }
        } catch (error) {
            console.log('Failed to create a new avatar');
        } 
    }

    return (
        <div className="max-w-4xl mx-auto px-4 pb-20">
            <CreateAvatarStepper step={0}/>

            {pageLoading ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <span className="loading loading-spinner loading-xl text-primary scale-150"></span>
                </div>
            ) : (
                <div className="mt-12 w-full max-w-2xl mx-auto">
                    <div className="p-12 flex flex-col gap-8">
                        
                        <div className={`group flex flex-col gap-1 transition-opacity duration-500 ${stepLocked() ? 'opacity-50' : 'opacity-100'}`}>
                            <div className="group flex flex-col gap-4">
                                <div className="flex w-full p-1.5 bg-base-content/5 rounded-2xl">
                                    {Object.values(AvatarGender).map((gender) => {
                                        const isActive = avatar.parameters.gender === gender;
                                        return (
                                            <button
                                                key={gender}
                                                type="button"
                                                disabled={stepLocked()}
                                                onClick={() => setParameter('gender', gender)}
                                                className={`
                                                    flex-1 py-4 px-4 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300
                                                    ${isActive 
                                                        ? 'bg-base-100 text-primary shadow-sm scale-[1.02]' 
                                                        : 'text-base-content/40 hover:text-base-content/60'
                                                    }
                                                    ${stepLocked() ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                                                `}
                                            >
                                                {gender}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-base-content/20 mt-6">
                                Name of Avatar
                            </label>
                            <div className="relative">
                                <input 
                                    type="text"
                                    value={avatar.name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={stepLocked()}
                                    placeholder="Enter name..."
                                    maxLength={20}
                                    className={`w-full py-3 bg-transparent border-b border-base-content/10 focus:border-primary transition-all duration-500 outline-none text-xl font-medium tracking-tight ${stepLocked() ? 'cursor-not-allowed' : ''}`}
                                />
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-base-content/20 group-focus-within:text-primary transition-colors">
                                    <User size={18} strokeWidth={2.5} />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-1 -mt-4">
                            <div className="flex items-center gap-2 group cursor-default">
                                <span className="text-[11px] font-mono font-bold tracking-tight text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/5">
                                    /{avatar.slug || "---"}
                                </span>
                            </div>
                        </div>

                        <div className="group flex flex-col gap-4">
                            <div className="flex w-full p-1.5 bg-base-content/5 rounded-2xl">
                                {Object.values(AvatarTypes).map((type) => {
                                    const isActive = avatar.type === type;
                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            disabled={stepLocked()}
                                            onClick={() => setType(type)}
                                            className={`
                                                flex-1 py-4 px-4 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300
                                                ${isActive 
                                                    ? 'bg-base-100 text-primary shadow-sm scale-[1.02]' 
                                                    : 'text-base-content/40 hover:text-base-content/60'
                                                }
                                                ${stepLocked() ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                                            `}
                                        >
                                            {type}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="hidden md:grid md:grid-cols-2 rounded-3xl gap-8 mt-4">
                            {[
                                { label: "Height", key: "height", opts: AVATAR_PARAMETER_OPTIONS.height },
                                { label: "Body", key: "body", opts: AVATAR_PARAMETER_OPTIONS[avatar.parameters.gender].body },
                                { label: "Bust Size", key: "bustSize", opts: AVATAR_PARAMETER_OPTIONS.bustSize },
                                { label: "Body Hair", key: "bodyHair", opts: AVATAR_PARAMETER_OPTIONS.bodyHair },
                            ].map((field) => (
                                <div key={field.key} className={`group flex flex-col gap-0.5 ${stepLocked() ? 'opacity-50' : 'opacity-100'}`}>
                                    <label className="text-[10px] font-medium uppercase tracking-[0.3em] text-base-content/20">
                                        {field.label}
                                    </label>

                                    <div className="relative">
                                        <select
                                            value={avatar.parameters[field.key as keyof typeof avatar.parameters]}
                                            disabled={stepLocked()}
                                            onChange={(e) => setParameter(field.key, e.target.value)}
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
                </div>
            )}

            <BottomDock
                avatarId={newAvatarData.avatarId}
                canProceed={canProceed}
                nextStep={nextStep}
                finish={false}
            />
        </div>
    );
}

export default GeneralPage;