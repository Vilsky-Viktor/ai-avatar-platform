import CreateAvatarCard from "../components/avatars/CreateAvatarCard";
import AvatarCard from "../components/avatars/AvatarCard";
import { useEffect, useState } from "react";
import { getAllUserAvatars } from "../services/apiGateway";
import { type Avatar } from "../types/avatar";
import { User } from 'lucide-react';

function AvatarsPage() {
    const [avatars, setAvatars] = useState([] as Avatar[]);
    const [loading, setLoading] = useState(true);

    const fetchAvatars = async () => {
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

    return (
        <div className="p-10 bg-base-200 min-h-screen">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <CreateAvatarCard />

                {loading && (
                    <>
                        {[1,2,3,4,5].map((val) => (
                            <div key={val} className="skeleton h-113 w-91 rounded-2xl flex items-center justify-center">
                                <User 
                                    size={100} 
                                    strokeWidth={1.5} 
                                    className="text-base-content/10" 
                                />
                            </div>
                        ))}
                    </>
                )}

                {!loading && avatars.map((avatar: Avatar) => (
                    <AvatarCard key={avatar.id} avatar={avatar} />
                ))}
            </div>
        </div>
    );
}

export default AvatarsPage;