import CreateAvatarCard from "../components/avatars/CreateAvatarCard";
import AvatarCard from "../components/avatars/AvatarCard";
import { useEffect, useState } from "react";
import { getAllUserAvatars } from "../services/apiGateway";
import { type Avatar } from "../types/avatar";
import { User, AlertTriangle, Trash2 } from 'lucide-react';
import { deleteAvatarById } from '../services/apiGateway';

function AvatarsPage() {
    const [avatars, setAvatars] = useState([] as Avatar[]);
    const [loading, setLoading] = useState(true);
    
    // State for managing the delete confirmation
    const [avatarToDelete, setAvatarToDelete] = useState<Avatar | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchAvatars = async () => {
        setLoading(true);
        try {
            const data = await getAllUserAvatars();
            setAvatars(data);
        } catch (error: any) {
            console.error('failed to fetch avatars');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAvatars();
    }, []);

    const confirmDelete = async () => {
        if (!avatarToDelete?.id) return;
        
        setIsDeleting(true);
        try {
            await deleteAvatarById(avatarToDelete.id);
            setAvatarToDelete(null); // Close modal
            await fetchAvatars(); // Refresh list
        } catch {
            console.error('Failed to remove avatar');
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div className="p-10 bg-base-200 min-h-screen relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <CreateAvatarCard />

                {loading && (
                    <>
                        {[1, 2, 3, 4, 5].map((val) => (
                            <div key={val} className="skeleton h-[450px] w-full rounded-2xl flex items-center justify-center bg-base-100/50">
                                <User size={100} strokeWidth={0.5} className="text-base-content/5" />
                            </div>
                        ))}
                    </>
                )}

                {!loading && avatars.map((avatar: Avatar) => (
                    <AvatarCard 
                        key={avatar.id} 
                        avatar={avatar} 
                        // Instead of deleting immediately, we open the modal
                        onDelete={() => setAvatarToDelete(avatar)} 
                    />
                ))}
            </div>

            {/* DELETE CONFIRMATION MODAL */}
            {avatarToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-base-300/60 backdrop-blur-sm animate-in fade-in duration-300" 
                        onClick={() => !isDeleting && setAvatarToDelete(null)}
                    />
                    
                    {/* Modal Content */}
                    <div className="relative bg-base-100 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-base-content/5 p-10 animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mb-6">
                                <AlertTriangle className="text-error" size={32} />
                            </div>
                            
                            <h3 className="text-xl font-bold uppercase tracking-widest mb-2">Confirm Delete</h3>
                            <p className="text-sm text-base-content/60 leading-relaxed mb-8">
                                Are you sure you want to delete <span className="text-base-content font-bold uppercase tracking-tight">{avatarToDelete.name}</span>? 
                                This action will remove all associated media and data.
                            </p>

                            <div className="flex flex-col w-full gap-3">
                                <button 
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="btn btn-error btn-lg rounded-2xl w-full uppercase tracking-widest text-xs"
                                >
                                    {isDeleting ? <span className="loading loading-spinner" /> : <Trash2 size={16} className="mr-2" />}
                                    Delete Avatar
                                </button>
                                
                                <button 
                                    onClick={() => setAvatarToDelete(null)}
                                    disabled={isDeleting}
                                    className="btn btn-ghost btn-lg rounded-2xl w-full uppercase tracking-widest text-xs opacity-50 hover:opacity-100"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AvatarsPage;