import { useState } from 'react';
import { handleCancel } from '../../utils/avatarCreation';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, X, Check } from 'lucide-react';
import CancelAvatarDialog from './CancelAvatarDialog';

type Props = {
    avatarId: string;
    canProceed: Function;
    previousStep?: Function;
    nextStep: Function;
    finish: boolean;
}

function BottomDock({ avatarId, canProceed, nextStep, previousStep, finish }: Props) {
    const [nextLoading, setNextLoading] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const navigate = useNavigate();

    const next = async () => {
        setNextLoading(true);
        try {
            await nextStep();
        } finally {
            setNextLoading(false);
        }
    };

    const confirmCancel = async () => {
        await handleCancel(avatarId, setCancelLoading, navigate);
        setCancelDialogOpen(false);
    };

    return (
        <>
            <CancelAvatarDialog isOpen={cancelDialogOpen} cancelLoading={cancelLoading} onClose={() => setCancelDialogOpen(false)} onConfirm={confirmCancel} />

            {/* Dock */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-base-100/80 backdrop-blur-md border-t border-base-content/5 py-5">
                <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">

                    {/* Left — Cancel */}
                    <button
                        className="flex items-center gap-3 px-7 py-4 rounded-xl text-base font-semibold uppercase tracking-[0.2em] cursor-pointer text-base-content/30 hover:text-error/70 transition-colors duration-300"
                        onClick={() => setCancelDialogOpen(true)}
                        disabled={cancelLoading}
                    >
                        <X size={17} strokeWidth={2} />
                        Cancel
                    </button>

                    {/* Right — Back + Next */}
                    <div className="flex items-center gap-4">
                        {previousStep && (
                            <button
                                className="flex items-center gap-3 px-7 py-4 rounded-xl text-base font-semibold uppercase tracking-[0.2em] cursor-pointer border border-base-content/10 text-base-content/40 hover:border-base-content/20 hover:text-base-content/70 transition-all duration-300"
                                onClick={() => previousStep()}
                            >
                                <ArrowLeft size={17} strokeWidth={2} />
                                Back
                            </button>
                        )}
                        <button
                            className={`
                                flex items-center gap-3 px-10 py-4 rounded-xl text-base font-semibold uppercase tracking-[0.2em]
                                transition-all duration-300
                                ${canProceed()
                                    ? 'cursor-pointer bg-primary text-primary-content shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:brightness-110'
                                    : 'cursor-not-allowed bg-base-content/5 text-base-content/20'
                                }
                            `}
                            disabled={nextLoading || !canProceed()}
                            onClick={next}
                        >
                            {nextLoading
                                ? <span className="loading loading-spinner loading-sm" />
                                : finish
                                    ? <Check size={17} strokeWidth={2.5} />
                                    : <ArrowRight size={17} strokeWidth={2} />
                            }
                            {finish ? 'Finish' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default BottomDock;
