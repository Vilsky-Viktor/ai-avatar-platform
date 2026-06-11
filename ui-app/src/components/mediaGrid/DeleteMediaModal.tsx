import { Trash2 } from 'lucide-react';
import Loading from '../Loading';
import { createPortal } from 'react-dom';
import { useScrollLock } from '../../hooks/useScrollLock';

type Props = {
    isDeleting: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

function DeleteMediaModal({ isDeleting, onConfirm, onCancel }: Props) {
    useScrollLock();
    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div
                className="absolute inset-0 bg-base-300/60 animate-modal-backdrop"
                onClick={() => !isDeleting && onCancel()}
            />
            <div className="relative bg-base-100 w-full max-w-md rounded-2xl border border-base-content/5 p-10 animate-modal-card">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-px bg-error/50" />
                            <h3 className="text-xl uppercase tracking-[0.2em] text-base-content/70">Delete media?</h3>
                        </div>
                        <p className="text-sm text-base-content/40 leading-relaxed pl-11">
                            This media will be permanently deleted and cannot be recovered.
                        </p>
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onCancel}
                            disabled={isDeleting}
                            className="px-7 py-3.5 rounded-xl text-xs uppercase tracking-[0.2em] cursor-pointer text-base-content/30 hover:text-base-content/70 transition-colors duration-300"
                        >
                            Keep it
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-xs uppercase tracking-[0.2em] cursor-pointer border border-error/20 text-error/50 hover:border-error/50 hover:text-error transition-all duration-300"
                        >
                            {isDeleting
                                ? <Loading size="xs" className="" />
                                : <Trash2 size={13} strokeWidth={2} />
                            }
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default DeleteMediaModal;
