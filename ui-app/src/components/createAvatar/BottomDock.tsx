import { useState } from 'react';
import Loading from '../Loading';
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
                        className="flex items-center gap-3 px-10 py-5 rounded-xl text-base uppercase tracking-[0.2em] cursor-pointer text-base-content/30 hover:text-error/70 transition-colors duration-300"
                        onClick={() => setCancelDialogOpen(true)}
                        disabled={cancelLoading}
                    >
                        <X size={16} strokeWidth={1.5} />
                        Cancel
                    </button>

                    {/* Right — Back + Next */}
                    <div className="flex items-center gap-3">
                        {previousStep && (
                            <button
                                className="flex items-center gap-3 px-10 py-5 rounded-xl text-base uppercase tracking-[0.2em] cursor-pointer border border-base-content/10 text-base-content/40 hover:border-base-content/20 hover:text-base-content/70 transition-all duration-300"
                                onClick={() => previousStep()}
                            >
                                <ArrowLeft size={16} strokeWidth={1.5} />
                                Back
                            </button>
                        )}
                        <button
                            className="group flex items-center gap-3 px-14 py-5 rounded-xl text-base uppercase tracking-[0.2em] transition-all duration-300 bg-primary/10 border border-primary/20 hover:bg-primary hover:border-primary text-primary hover:text-primary-content cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            disabled={nextLoading || !canProceed()}
                            onClick={next}
                        >
                            {nextLoading
                                ? <Loading size="sm" className="" />
                                : finish
                                    ? <Check size={16} strokeWidth={1.5} />
                                    : <ArrowRight size={16} strokeWidth={1.5} />
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
