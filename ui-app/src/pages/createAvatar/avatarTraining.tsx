import { useState, useEffect, useRef } from 'react';
import CreateAvatarStepper from "../../components/createAvatar/CreateAvatarStepper";
import { useNavigate } from 'react-router-dom';
import {
    getAvatarData,
    initialAvatarData,
    NEW_AVATAR_DATA
} from '../../utils/avatarCreation';
import { getMediaByAvatarId, createTrainingMedia, getAvatarById, trainLoras, updateAvatar } from '../../services/apiGateway';
import BottomDock from '../../components/createAvatar/BottomDock';
import { scrollToTop } from '../../utils/scroller';
import type { Media } from '../../types/media';
import type { Avatar, AvatarLoras } from '../../types/avatar';
import { Check, X } from 'lucide-react';

type StepStatus = 'pending' | 'loading' | 'done' | 'error';

type Step = {
    label: string;
    description: string;
    status: StepStatus;
};

function AvatarTrainingPage() {
    const navigate = useNavigate();

    const [newAvatarData, _] = useState(() => getAvatarData());
    const [avatar, setAvatar] = useState(initialAvatarData);
    const [media, setMedia] = useState([] as Media[]);
    const [loras, setLoras] = useState({} as AvatarLoras);
    const [pageLoading, setPageLoading] = useState(true);
    const [steps, setSteps] = useState<Step[]>([
        { label: 'Processing training images', description: 'Preparing media', status: 'pending' },
        { label: 'Training your new life', description: 'Launching training', status: 'pending' },
    ]);
    const initialized = useRef<boolean>(false);
    

    const setStepStatus = (index: number, status: StepStatus) => {
        setSteps(prev => prev.map((s, i) => i === index ? { ...s, status } : s));
    };

    useEffect(() => {
        scrollToTop();
        initPage();
    }, []);

    const initPage = async () => {
        if (initialized.current) return;
        initialized.current = true;

        const existingAvatar = await getAvatarById(newAvatarData.avatarId);
        setAvatar(existingAvatar);
        setLoras(existingAvatar.loras || {});

        const existingMedia = await getMediaByAvatarId(newAvatarData.avatarId);

        setPageLoading(false);

        if (existingMedia.length) {
            setMedia(existingMedia);
            setSteps(prev => prev.map(s => ({ ...s, status: 'done' })));
        } else {
            setStepStatus(0, 'loading');
            let newMedia: Media[];
            try {
                newMedia = await createTrainingMedia(newAvatarData.groupId);
                setMedia(newMedia);
                setStepStatus(0, 'done');
            } catch {
                setStepStatus(0, 'error');
                return;
            }
        }

        if (existingAvatar.loras && Object.keys(existingAvatar.loras).length > 0) {
            setStepStatus(1, 'done');
        } else {
            setStepStatus(1, 'loading');
            try {
                const loraPaths = await trainLoras({avatarId: newAvatarData.avatarId, groupId: newAvatarData.groupId, parameters: avatar.parameters});
                setLoras(loraPaths);

                const payload: Partial<Avatar> = {
                    loras: loraPaths, 
                };

                await updateAvatar(newAvatarData.avatarId, payload);

                setStepStatus(1, 'done');
            } catch {
                setStepStatus(1, 'error');
            }
        }
    };

    const canProceed = () => {
        return media.length > 0 && Object.keys(loras).length > 0 && steps.every(s => s.status === 'done');
    };

    const nextStep = async () => {
        if (!canProceed()) return;

        localStorage.removeItem(NEW_AVATAR_DATA);

        navigate('/');
    };

    const previousStep = () => {
        navigate('/avatar/create/assign-voice');
    };

    return (
        <>
            <CreateAvatarStepper step={4}/>

            {pageLoading ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <span className="loading loading-spinner loading-xl text-primary scale-150"></span>
                </div>
            ) : (
                <div className="max-w-3xl mx-auto px-4 pt-20 mb-50">
                    <div className="flex flex-col gap-10">
                        {steps.map((step, i) => (
                            <div key={i} className="flex items-center gap-8">
                                {/* Checkbox */}
                                <div className="relative shrink-0 flex items-center justify-center">
                                    {step.status === 'loading' && (
                                        <span className="absolute w-16 h-16 rounded-2xl border border-primary/25 animate-ping" />
                                    )}
                                    <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-700
                                        ${step.status === 'done'
                                            ? 'border-primary bg-primary'
                                            : step.status === 'loading'
                                                ? 'border-primary/50'
                                                : step.status === 'error'
                                                    ? 'border-error bg-error'
                                                    : 'border-base-content/10'
                                        }`}
                                    >
                                        {step.status === 'done' && <Check size={22} strokeWidth={2.5} className="text-primary-content" />}
                                        {step.status === 'loading' && <span className="loading loading-spinner loading-md text-primary" />}
                                        {step.status === 'error' && <X size={22} strokeWidth={2.5} className="text-error-content" />}
                                    </div>
                                </div>

                                {/* Text */}
                                <div className="flex flex-col gap-1.5">
                                    <span className={`text-2xl font-light tracking-tight transition-colors duration-700
                                        ${step.status === 'error' ? 'text-error' : step.status === 'pending' ? 'text-base-content/20' : 'text-base-content'}`}
                                    >
                                        {step.label}
                                    </span>
                                    <span className={`text-[11px] uppercase tracking-[0.25em] transition-colors duration-700
                                        ${step.status === 'done' ? 'text-primary/50' : step.status === 'loading' ? 'text-base-content/35' : step.status === 'error' ? 'text-error/50' : 'text-base-content/15'}`}
                                    >
                                        {step.status === 'done' ? 'Completed' : step.status === 'loading' ? step.description : step.status === 'error' ? 'Failed' : 'Waiting'}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {canProceed() && (
                            <div className="flex flex-col gap-3 mt-4">
                                <span className="text-3xl font-light tracking-tight text-base-content">All set.</span>
                                <span className="text-sm text-base-content/40 font-light">
                                    Your new life is being trained in the background.
                                </span>
                                <span className="text-sm text-base-content/25 font-light">
                                    This may take up to 12 hours — feel free to check back tomorrow.
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <BottomDock
                avatarId={newAvatarData.avatarId}
                canProceed={canProceed}
                nextStep={nextStep}
                previousStep={previousStep}
                finish={true}
            />
        </>
    );
}

export default AvatarTrainingPage;
