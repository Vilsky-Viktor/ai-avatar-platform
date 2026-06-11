import { useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import Loading from '../Loading';

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
            <div className="modal-box bg-base-100 border border-base-content/5 rounded-2xl p-10 max-w-md">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-px bg-error/50" />
                            <h3 className="text-xl uppercase tracking-[0.2em] text-base-content/70">Cancel creation?</h3>
                        </div>
                        <p className="text-sm text-base-content/40 leading-relaxed pl-11">
                            All progress will be lost and the avatar will be permanently deleted.
                        </p>
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button
                            className="px-7 py-3.5 rounded-xl text-xs uppercase tracking-[0.2em] cursor-pointer text-base-content/30 hover:text-base-content/70 transition-colors duration-300"
                            onClick={onClose}
                            disabled={cancelLoading}
                        >
                            Keep going
                        </button>
                        <button
                            className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-xs uppercase tracking-[0.2em] cursor-pointer border border-error/20 text-error/50 hover:border-error/50 hover:text-error transition-all duration-300"
                            onClick={onConfirm}
                            disabled={cancelLoading}
                        >
                            {cancelLoading
                                ? <Loading size="xs" className="" />
                                : <Trash2 size={13} strokeWidth={2} />
                            }
                            Discard
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
