import CreateAvatarCard from "../components/avatars/CreateAvatarCard";
import AvatarCard from "../components/avatars/AvatarCard";
import DeleteAvatarModal from "../components/avatars/DeleteAvatarModal";
import { useEffect, useState } from "react";
import { getAllUserAvatars, deleteAvatarById } from "../services/apiGateway";
import { type Avatar } from "@loom24/shared/types";
import { User } from 'lucide-react';

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
    );
}

export default AvatarsPage;