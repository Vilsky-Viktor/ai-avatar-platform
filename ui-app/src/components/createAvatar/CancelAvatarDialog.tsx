import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

type Props = {
    isOpen: boolean;
    cancelLoading: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

function CancelAvatarDialog({ isOpen, cancelLoading, onClose, onConfirm }: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        if (isOpen) dialogRef.current?.showModal();
        else dialogRef.current?.close();
    }, [isOpen]);

    return (
        <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle">
            <div className="modal-box bg-base-100 border border-base-content/5 rounded-2xl p-10 max-w-lg">
                <div className="flex flex-col gap-10">
                    <div className="flex flex-col gap-3">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-base-content/60">Cancel avatar creation?</h3>
                        <p className="text-base-content/40 leading-relaxed">
                            All progress will be lost and the avatar will be deleted.
                        </p>
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button
                            className="flex items-center gap-3 px-7 py-4 rounded-xl text-sm font-semibold uppercase tracking-[0.2em] cursor-pointer text-base-content/30 hover:text-base-content transition-colors duration-300"
                            onClick={onClose}
                            disabled={cancelLoading}
                        >
                            Keep going
                        </button>
                        <button
                            className="flex items-center gap-3 px-7 py-4 rounded-xl text-sm font-semibold uppercase tracking-[0.2em] cursor-pointer border border-error/30 text-error/60 hover:border-error/60 hover:text-error transition-all duration-300"
                            onClick={onConfirm}
                            disabled={cancelLoading}
                        >
                            {cancelLoading
                                ? <span className="loading loading-spinner loading-sm" />
                                : <X size={15} strokeWidth={2.5} />
                            }
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button disabled={cancelLoading} onClick={onClose}>close</button>
            </form>
        </dialog>
    );
}

export default CancelAvatarDialog;
