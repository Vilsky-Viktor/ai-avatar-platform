import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateAvatarStepper from '../../components/createAvatar/CreateAvatarStepper';
import { User } from 'lucide-react';
import { createAvatar } from '../../services/apiGateway';
import type { Avatar } from '../../types/avatar';
import { AvatarGender } from '../../types/avatar';
import { GENERAL_STORAGE_KEY, getLocalStorageData, saveLocalStorageData } from '../../utils/avatarCreation';
import { type GeneralStepData  } from "../../types/avatarCreation";
import BottomDock from '../../components/createAvatar/BottomDock'


function GeneralPage() {
    const navigate = useNavigate();

    const [stepData, setStepData] = useState(() => getLocalStorageData<GeneralStepData>(GENERAL_STORAGE_KEY))

    const canProceed = () => stepData.name.trim().length > 3;

    useEffect(() => {
        saveLocalStorageData<GeneralStepData>(GENERAL_STORAGE_KEY, stepData)
    }, [stepData]);

    const setAvatarId = (avatar: Avatar) => {
        setStepData((prev: GeneralStepData) => ({...prev, avatarId: avatar.id!}));
    }

    const setName = (name: string) => {
        setStepData((prev: GeneralStepData) => ({...prev, name}));

        const slug = name
        .toLowerCase()
        .replace(/[_\s]+/g, '-')     
        .replace(/[^a-z0-9-]/g, '')  
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

        setStepData((prev: GeneralStepData) => ({...prev, slug}));
    }

    const setGender = (gender: AvatarGender) => {
        setStepData((prev: GeneralStepData) => ({...prev, gender}));
    }

    const setFinished = () => {
        setStepData((prev: GeneralStepData) => ({...prev, finished: true}));
    }

    const nextStep = async () => {
        try {
            if (!stepData.finished) {
                const avatar = {name: stepData.name, gender: stepData.gender, slug: stepData.slug, imageCount: 0, videoCount: 0};
                const avatarDb = await createAvatar(avatar);

                setAvatarId(avatarDb);
                setFinished();
            }

            navigate('/avatar/create/id-photo');
        } catch (error) {
            console.log('Failed to create a new avatar');
        } 
    }

    return (
        <div className="max-w-4xl mx-auto px-4 pb-20">
            <CreateAvatarStepper step={0}/>

            <div className="mt-12 w-full max-w-2xl mx-auto">
                <div className="rounded-[2.5rem] border border-base-content/5 bg-base-100 p-12 flex flex-col gap-8 shadow-sm">
                    
                    <div className={`group flex flex-col gap-1 transition-opacity duration-500 ${stepData.finished ? 'opacity-50' : 'opacity-100'}`}>
                        <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-base-content/20">
                            Name of Avatar
                        </label>
                        <div className="relative">
                            <input 
                                type="text"
                                value={stepData.name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={stepData.finished}
                                placeholder="Enter name..."
                                maxLength={20}
                                className={`w-full py-3 bg-transparent border-b border-base-content/10 focus:border-primary transition-all duration-500 outline-none text-xl font-medium tracking-tight ${stepData.finished ? 'cursor-not-allowed' : ''}`}
                            />
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-base-content/20 group-focus-within:text-primary transition-colors">
                                <User size={18} strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-1 -mt-4">
                        <div className="flex items-center gap-2 group cursor-default">
                            <span className="text-[11px] font-mono font-bold tracking-tight text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/5">
                                /{stepData.slug || "---"}
                            </span>
                        </div>
                    </div>

                    <div className="group flex flex-col gap-4">
                        <div className="flex w-full p-1.5 bg-base-content/5 rounded-2xl">
                            {Object.values(AvatarGender).map((gender) => {
                                const isActive = stepData.gender === gender;
                                return (
                                    <button
                                        key={gender}
                                        type="button"
                                        disabled={stepData.finished}
                                        onClick={() => setGender(gender)}
                                        className={`
                                            flex-1 py-4 px-4 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300
                                            ${isActive 
                                                ? 'bg-base-100 text-primary shadow-sm scale-[1.02]' 
                                                : 'text-base-content/40 hover:text-base-content/60'
                                            }
                                            ${stepData.finished ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                                        `}
                                    >
                                        {gender}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <BottomDock
                avatarId={stepData.avatarId}
                canProceed={canProceed}
                nextStep={nextStep}
                finish={false}
            />
        </div>
    );
}

export default GeneralPage;