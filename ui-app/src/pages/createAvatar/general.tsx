import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateAvatarStepper from '../../components/createAvatar/CreateAvatarStepper';
import { User, ChevronDown } from 'lucide-react';
import { createAvatar } from '../../services/apiGateway';
import type { Avatar } from '../../types/avatar';
import { deleteAvatarById } from '../../services/apiGateway';
import { AvatarGender } from '../../types/avatar';

const STORAGE_KEY = 'avatar_creation_data';

function GeneralPage() {
    const navigate = useNavigate();

    const [name, setName] = useState(() => localStorage.getItem(`${STORAGE_KEY}_name`) || '');
    const [gender, setGender] = useState(() => localStorage.getItem(`${STORAGE_KEY}_gender`) || AvatarGender.female);
    const [nextLoading, setNextLoading] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);

    const canProceed = name.trim().length > 0;

    useEffect(() => {
        localStorage.setItem(`${STORAGE_KEY}_name`, name);
        localStorage.setItem(`${STORAGE_KEY}_gender`, gender);
    }, [name, gender]);

    const handleCancel = async () => {
        const avatarId = localStorage.getItem(`${STORAGE_KEY}_avatar_id`) || null

        localStorage.removeItem(`${STORAGE_KEY}_name`);
        localStorage.removeItem(`${STORAGE_KEY}_gender`);
        localStorage.removeItem(`${STORAGE_KEY}_mode`);
        localStorage.removeItem(`${STORAGE_KEY}_selections`);
        localStorage.removeItem(`${STORAGE_KEY}_avatar_id`);

        if (avatarId) {
            setCancelLoading(true);
            try {
                await deleteAvatarById(avatarId);
                setCancelLoading(false);
            } catch (error: any) {
                console.log(`Failed to remove avatar`);
            } finally {
                setCancelLoading(false);
            }
            
        }

        navigate('/');
    };

    const saveAvatarId = (avatar: Avatar) => {
        localStorage.setItem(`${STORAGE_KEY}_avatar_id`, avatar.id!);
    }

    const getAvatarId = (): string | null => {
        return localStorage.getItem(`${STORAGE_KEY}_avatar_id`) || null;
    }

    const nextStep = async () => {
        try {
            if (!getAvatarId()) {
                setNextLoading(true)
                const avatar = {name, gender};
                const avatarDb = await createAvatar(avatar);
                saveAvatarId(avatarDb);
                setNextLoading(false);
            }

            navigate('/avatar/create/id-photo');
        } catch (error) {
            console.log('Failed to create a new avatar');
        } finally {
            setNextLoading(false);
        }
    }

    return (
        <div className="max-w-4xl mx-auto px-4 pb-20">
            <CreateAvatarStepper step={0}/>

            <div className="mt-12 w-full max-w-2xl mx-auto">
                <div className="rounded-[2.5rem] border border-base-content/5 bg-base-100 p-12 flex flex-col gap-10 shadow-sm">
                    
                    {/* Name Input */}
                    <div className="group flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-base-content/20">
                            Name of Avatar
                        </label>
                        <div className="relative">
                            <input 
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter name..."
                                className="w-full py-3 bg-transparent border-b border-base-content/10 focus:border-primary transition-all duration-500 outline-none text-xl font-medium tracking-tight"
                            />
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-base-content/20 group-focus-within:text-primary transition-colors">
                                <User size={18} strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>

                    {/* Gender Switcher */}
                    <div className="group flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-base-content/20">
                            Gender
                        </label>
                        <div className="relative">
                            <select 
                                value={gender} 
                                onChange={(e) => setGender(e.target.value)} 
                                className="w-full py-3 bg-transparent border-b border-base-content/10 focus:border-primary transition-all duration-500 outline-none text-xl font-medium tracking-tight appearance-none cursor-pointer pr-8"
                            >
                                <option value="female">Female</option>
                                <option value="male">Male</option>
                            </select>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-base-content/20 group-hover:text-primary transition-colors">
                                <ChevronDown size={18} strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-12 flex justify-center gap-6">
                <button 
                    className="btn btn-lg btn-ghost uppercase tracking-widest px-12 opacity-50 hover:opacity-100" 
                    onClick={handleCancel}
                >
                    {cancelLoading && <span className="loading loading-spinner"></span>}
                    Cancel
                </button>
                <button 
                    className={`btn btn-lg uppercase tracking-[0.3em] px-16 transition-all duration-500 ${
                        canProceed 
                        ? 'btn-primary shadow-primary/20 scale-100' 
                        : 'btn-disabled opacity-30 scale-95 pointer-events-none'
                    }`}
                    onClick={() => canProceed && nextStep()}
                >
                    {nextLoading && <span className="loading loading-spinner"></span>}
                    Next
                </button>
            </div>
        </div>
    );
}

export default GeneralPage;