import CreateAvatarCard from "../components/avatars/CreateAvatarCard";
import AvatarCard from "../components/avatars/AvatarCard";
import DeleteAvatarModal from "../components/avatars/DeleteAvatarModal";
import { useEffect, useState } from "react";
import { getAllUserAvatars, deleteAvatarById } from "../services/apiGateway";
import { type Avatar } from "@loom24/shared/types";
import { ScanFace } from 'lucide-react';
import { clearAvatarDataIfMatch } from "../utils/avatarCreation";

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
            clearAvatarDataIfMatch(avatarToDelete.id);
            setAvatarToDelete(null); // Close modal
            await fetchAvatars(); // Refresh list
        } catch {
            console.error('Failed to remove avatar');
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div className="px-15 pt-12 pb-20 bg-base-200 relative">
            <div className="max-w-6xl mx-auto flex flex-col gap-10">
            <div className="flex items-center gap-3">
                <span className="w-8 h-px bg-primary/50" />
                <h1 className="text-xl uppercase tracking-[0.2em] text-base-content/70">Your avatars</h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <CreateAvatarCard />

                {loading && (
                    <>
                        {[1, 2, 3, 4, 5].map((val) => (
                            <div key={val} className="relative rounded-2xl aspect-square overflow-hidden border border-base-content/10 bg-base-100 animate-pulse">
                                <div
                                    className="absolute inset-0 opacity-[0.03]"
                                    style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                                />
                                <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-base-content/10" />
                                <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-base-content/10" />
                                <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-base-content/10" />
                                <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-base-content/10" />
                                <div className="flex items-center justify-center w-full h-full">
                                    <ScanFace size={80} strokeWidth={0.8} className="text-base-content/10" />
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {!loading && avatars.map((avatar: Avatar) => (
                    <AvatarCard 
                        key={avatar.id} 
                        avatar={avatar} 
                        onDelete={() => setAvatarToDelete(avatar)} 
                    />
                ))}
            </div>

            {avatarToDelete && (
                <DeleteAvatarModal
                    avatar={avatarToDelete}
                    isDeleting={isDeleting}
                    onConfirm={confirmDelete}
                    onCancel={() => setAvatarToDelete(null)}
                />
            )}
            </div>
        </div>
    );
}

export default AvatarsPage;