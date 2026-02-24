import { useState } from 'react';
import { handleCancel } from '../../utils/avatarCreation';
import { useNavigate } from 'react-router-dom';

type Props = {
    avatarId: string;
    canProceed: Function;
    previousStep?: Function;
    nextStep: Function;
    finish: boolean;
}

function BottomDock({avatarId, canProceed, nextStep, previousStep, finish}: Props) {
    const [nextLoading, setNextLoading] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);

    const navigate = useNavigate();

    const next = async () => {
        setNextLoading(true);
        try {
            await nextStep();
        } finally {
            setNextLoading(false);
        }
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-base-100/80 backdrop-blur-md border-t border-base-content/5 py-6">
            <div className="max-w-4xl mx-auto px-4 flex justify-center gap-6">
                {handleCancel && (
                    <button 
                        className="btn btn-lg btn-ghost btn-error uppercase tracking-[0.3em] px-16 opacity-50 hover:opacity-100 transition-all duration-500" 
                        onClick={() => handleCancel(avatarId, setCancelLoading, navigate)}
                        disabled={cancelLoading}
                    >
                        {cancelLoading && <span className="loading loading-spinner"></span>}
                        Cancel
                    </button>
                )}
                {previousStep && (
                    <button 
                        className="btn btn-lg btn-outline btn-primary uppercase tracking-[0.3em] px-16 transition-all duration-500" 
                        onClick={() => previousStep()}
                    >
                        Back
                    </button>
                )}
                {nextStep && (
                    <button 
                        className={`btn btn-lg uppercase tracking-[0.3em] px-16 transition-all duration-500 ${
                            canProceed() 
                            ? 'btn-primary shadow-lg shadow-primary/20 scale-100' 
                            : 'btn-disabled opacity-30 cursor-not-allowed'
                        }`}
                        disabled={nextLoading || !canProceed()}
                        onClick={next}
                    >
                        {nextLoading && <span className="loading loading-spinner"></span>}
                        {finish ? "Finish" : "Next"}
                    </button>
                )}
                
            </div>
        </div>
    );
}

export default BottomDock;