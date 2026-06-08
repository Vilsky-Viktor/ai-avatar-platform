import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateAvatarStepper from '../../components/createAvatar/CreateAvatarStepper';
import { User, ScanFace, Sparkles } from 'lucide-react';
import { createAvatar, getAvatarById } from '../../services/apiGateway';
import { AvatarTypes, AvatarGender, type Avatar } from '@loom24/shared/types';
import { getAvatarData, initialAvatarData, saveAvatarData } from '../../utils/avatarCreation';
import { type NewAvatarData  } from "../../types/avatarCreation";
import BottomDock from '../../components/createAvatar/BottomDock'
import { scrollToTop } from '../../utils/scroller';

const AVATAR_TYPE_OPTIONS = [
    {
        type: AvatarTypes.twin,
        icon: ScanFace,
        label: 'Digital Twin',
        description: 'Upload your real photos. The AI learns your exact face and creates a hyper-realistic version of you.',
    },
    {
        type: AvatarTypes.synthetic,
        icon: Sparkles,
        label: 'Synthetic',
        description: 'No photos needed. The AI generates a brand-new fictional face based on your settings.',
    },
];

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
        setAvatar((prev: Avatar) => ({...prev, slug}))
    }

    const setName = (name: string) => {
        setAvatar((prev: Avatar) => ({...prev, name}))
    }

    const setType = (type: AvatarTypes) => {
        setAvatar((prev: Avatar) => ({...prev, type}))
    }

    const setParameter = (key: string, value: string) => {
        setAvatar((prev: Avatar) => ({...prev, parameters: { ...prev.parameters, [key]: value }}))
    }

    const setAvatarId = (avatarId: string) => {
        setNewAvatarData((prev: NewAvatarData) => ({...prev, avatarId}));
    }

    const canProceed = () => {
        if (!avatar) return false;

        const nameFilled = avatar.name.trim().length > 2;
        const typeFilled = avatar.type;
        const genderFilled = avatar.parameters.gender;

        return nameFilled && typeFilled && genderFilled;
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

            if (avatar.type === AvatarTypes.twin) {
                navigate('/avatar/create/twin-id-photos');
            } else {
                navigate('/avatar/create/synthetic-id-photos');
            }
        } catch (error) {
            console.log('Failed to create a new avatar');
        }
    }

    const locked = stepLocked();

    return (
        <div className="max-w-5xl mx-auto px-4 pb-20">
            <CreateAvatarStepper step={0}/>

            {pageLoading ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <span className="loading loading-spinner loading-xl text-primary scale-150"></span>
                </div>
            ) : (
                <div className="mt-12 w-full max-w-3xl mx-auto">
                    <div className="p-12 flex flex-col gap-10">

                        {/* Name */}
                        <div className={`flex flex-col gap-3 transition-opacity duration-500 ${locked ? 'opacity-50' : 'opacity-100'}`}>
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-px bg-primary/50" />
                                <label className="text-xl uppercase tracking-[0.2em] text-base-content/70">
                                    Name your avatar
                                </label>
                            </div>
                            <div className="flex flex-col gap-4 p-5 rounded-2xl bg-base-content/5">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={avatar.name}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={locked}
                                        placeholder="Enter a name..."
                                        maxLength={20}
                                        className={`w-full py-3 bg-transparent border-b border-base-content/10 focus:border-primary transition-all duration-500 outline-none text-xl font-medium tracking-tight ${locked ? 'cursor-not-allowed' : ''}`}
                                    />
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-base-content/20">
                                        <User size={18} strokeWidth={2.5} />
                                    </div>
                                </div>
                                <span className="text-[11px] font-mono font-bold tracking-tight text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/5 self-start">
                                    /{avatar.slug || "---"}
                                </span>
                            </div>
                        </div>

                        {/* Gender */}
                        <div className={`flex flex-col gap-3 transition-opacity duration-500 ${locked ? 'opacity-50' : 'opacity-100'}`}>
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-px bg-primary/50" />
                                <label className="text-xl uppercase tracking-[0.2em] text-base-content/70">
                                    Select gender
                                </label>
                            </div>
                            <div className="flex w-full p-1.5 bg-base-content/5 rounded-2xl">
                                {Object.values(AvatarGender).map((gender) => {
                                    const isActive = avatar.parameters.gender === gender;
                                    return (
                                        <button
                                            key={gender}
                                            type="button"
                                            disabled={locked}
                                            onClick={() => setParameter('gender', gender)}
                                            className={`
                                                flex-1 py-4 px-4 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300
                                                ${isActive
                                                    ? 'bg-base-100 text-primary shadow-sm scale-[1.02]'
                                                    : 'text-base-content/40 hover:text-base-content/60'
                                                }
                                                ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}
                                            `}
                                        >
                                            {gender}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Avatar type */}
                        <div className={`flex flex-col gap-3 transition-opacity duration-500 ${locked ? 'opacity-50' : 'opacity-100'}`}>
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-px bg-primary/50" />
                                <label className="text-xl uppercase tracking-[0.2em] text-base-content/70">
                                    Choose avatar type
                                </label>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {AVATAR_TYPE_OPTIONS.map(({ type, icon: Icon, label, description }) => {
                                    const isActive = avatar.type === type;
                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            disabled={locked}
                                            onClick={() => setType(type)}
                                            className={`
                                                flex flex-col items-start gap-3 p-5 rounded-2xl border-2 text-left transition-all duration-300
                                                ${isActive
                                                    ? 'border-primary bg-primary/5 shadow-sm'
                                                    : 'border-base-content/10 bg-base-content/[0.02] hover:border-base-content/20'
                                                }
                                                ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}
                                            `}
                                        >
                                            <Icon
                                                size={28}
                                                className={`transition-colors duration-300 ${isActive ? 'text-primary' : 'text-base-content/30'}`}
                                            />
                                            <div className="flex flex-col gap-1">
                                                <span className={`text-sm font-bold uppercase tracking-[0.15em] transition-colors duration-300 ${isActive ? 'text-primary' : 'text-base-content/60'}`}>
                                                    {label}
                                                </span>
                                                <span className="text-[11px] leading-relaxed text-base-content/40">
                                                    {description}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
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
