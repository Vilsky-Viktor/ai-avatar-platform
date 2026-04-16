import { useRef, useState } from 'react';
import { handleCancel } from '../../utils/avatarCreation';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, X, Check } from 'lucide-react';

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
    const dialogRef = useRef<HTMLDialogElement>(null);
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
        dialogRef.current?.close();
    };

    return (
        <>
            {/* Confirmation dialog */}
            <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle">
                <div className="modal-box bg-base-100 border border-base-content/5 rounded-2xl p-8 max-w-sm">
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <h3 className="text-base font-semibold tracking-tight">Cancel avatar creation?</h3>
                            <p className="text-sm text-base-content/40 leading-relaxed">
                                All progress will be lost and the avatar will be deleted.
                            </p>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                className="btn btn-ghost text-base-content/50 hover:text-base-content tracking-wide"
                                onClick={() => dialogRef.current?.close()}
                                disabled={cancelLoading}
                            >
                                Keep going
                            </button>
                            <button
                                className="btn btn-error btn-outline tracking-wide"
                                onClick={confirmCancel}
                                disabled={cancelLoading}
                            >
                                {cancelLoading
                                    ? <span className="loading loading-spinner loading-sm" />
                                    : <X size={15} strokeWidth={2.5} />
                                }
                                {cancelLoading ? 'Cancelling...' : 'Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button disabled={cancelLoading}>close</button>
                </form>
            </dialog>

            {/* Dock */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-base-100/80 backdrop-blur-md border-t border-base-content/5 py-5">
                <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">

                    {/* Left — Cancel */}
                    <button
                        className="flex items-center gap-3 px-7 py-4 rounded-xl text-base font-semibold uppercase tracking-[0.2em] cursor-pointer text-base-content/30 hover:text-error/70 transition-colors duration-300"
                        onClick={() => dialogRef.current?.showModal()}
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
