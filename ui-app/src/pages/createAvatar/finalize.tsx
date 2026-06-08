import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateAvatarStepper from '../../components/createAvatar/CreateAvatarStepper';
import { NEW_AVATAR_DATA } from '../../utils/avatarCreation';
import { scrollToTop } from '../../utils/scroller';
import { Sparkles, Image, Video, Mic, ArrowRight } from 'lucide-react';

const CAPABILITIES = [
    {
        icon: Image,
        title: 'Generate photos',
        description: 'Create stunning photos of your avatar in any style, outfit, or setting.',
    },
    {
        icon: Video,
        title: 'Create videos',
        description: 'Bring your avatar to life with AI-generated video clips.',
    },
    {
        icon: Mic,
        title: 'Sync voice',
        description: 'Sync your avatar\'s videos with its voice to create natural talking content.',
    },
];

function FinalizePage() {
    const navigate = useNavigate();

    useEffect(() => {
        scrollToTop();
    }, []);

    const handleStart = () => {
        localStorage.removeItem(NEW_AVATAR_DATA);
        navigate('/');
    };

    return (
        <>
            <CreateAvatarStepper step={3} />
            <div className="max-w-xl mx-auto px-4 pt-16 pb-40 flex flex-col items-center gap-12">

                {/* Header */}
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Sparkles size={24} className="text-primary" strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-px bg-primary/50" />
                            <h1 className="text-xl uppercase tracking-[0.2em] text-base-content/70">
                                Your avatar is ready
                            </h1>
                            <span className="w-8 h-px bg-primary/50" />
                        </div>
                        <p className="text-sm text-base-content/40 leading-relaxed max-w-xs">
                            Here's what you can do with it right now.
                        </p>
                    </div>
                </div>

                {/* Capabilities */}
                <div className="w-full flex flex-col gap-3">
                    {CAPABILITIES.map(({ icon: Icon, title, description }) => (
                        <div key={title} className="flex items-start gap-4 p-5 rounded-2xl bg-base-100 text-left">
                            <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                                <Icon size={22} className="text-primary" strokeWidth={1.5} />
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-sm uppercase tracking-[0.15em] text-base-content/70">{title}</span>
                                <span className="text-[12px] text-base-content/40 leading-relaxed">{description}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <button
                    onClick={handleStart}
                    className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-primary text-primary-content text-sm uppercase tracking-[0.3em] transition-all duration-300 hover:brightness-110 hover:scale-[1.02] cursor-pointer"
                >
                    Start creating
                </button>
            </div>
        </>
    );
}

export default FinalizePage;
