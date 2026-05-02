import { AlertTriangle, Trash2 } from 'lucide-react';
import type { Avatar } from '../../types/avatar';
import { useScrollLock } from '../../hooks/useScrollLock';

type Props = {
    avatar: Avatar;
    isDeleting: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

function DeleteAvatarModal({ avatar, isDeleting, onConfirm, onCancel }: Props) {
    useScrollLock();
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div
                className="absolute inset-0 bg-base-300/60 animate-modal-backdrop"
                onClick={() => !isDeleting && onCancel()}
            />
            <div className="relative bg-base-100 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-base-content/5 p-10 animate-modal-card">
                <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mb-6">
                        <AlertTriangle className="text-error" size={32} />
                    </div>

                    <h3 className="text-xl font-bold uppercase tracking-widest mb-2">Confirm Delete</h3>
                    <p className="text-sm text-base-content/60 leading-relaxed mb-8">
                        Are you sure you want to delete <span className="text-base-content font-bold uppercase tracking-tight">{avatar.name}</span>?
                        This action will remove all associated media and data.
                    </p>

                    <div className="flex flex-col w-full gap-3">
                        <button
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="btn btn-error btn-lg rounded-2xl w-full uppercase tracking-widest text-xs"
                        >
                            {isDeleting ? <span className="loading loading-spinner" /> : <Trash2 size={16} className="mr-2" />}
                            Delete Avatar
                        </button>
                        <button
                            onClick={onCancel}
                            disabled={isDeleting}
                            className="btn btn-ghost btn-lg rounded-2xl w-full uppercase tracking-widest text-xs opacity-50 hover:opacity-100"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DeleteAvatarModal;
