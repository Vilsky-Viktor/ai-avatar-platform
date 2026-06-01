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
        <CreateAvatarStepper step={3}/>
        <div className="max-w-xl mx-auto px-4 pt-16 pb-40 flex flex-col items-center">
            <div className="w-full flex flex-col items-center gap-12 text-center">

                {/* Icon */}
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
                    <Sparkles size={36} className="text-primary" strokeWidth={1.5} />
                </div>

                {/* Heading */}
                <div className="flex flex-col gap-3">
                    <h1 className="text-4xl font-bold tracking-tight">Your avatar is ready.</h1>
                    <p className="text-base text-base-content/40 font-light leading-relaxed">
                        New digital life is set. Here's what you can do with it right now.
                    </p>
                </div>

                {/* Capabilities */}
                <div className="w-full flex flex-col gap-4">
                    {CAPABILITIES.map(({ icon: Icon, title, description }) => (
                        <div key={title} className="flex items-start gap-5 p-5 rounded-2xl bg-base-100 border border-base-content/5 text-left">
                            <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                                <Icon size={18} className="text-primary" strokeWidth={1.5} />
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-semibold tracking-tight">{title}</span>
                                <span className="text-[12px] text-base-content/40 leading-relaxed">{description}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <button
                    onClick={handleStart}
                    className="btn btn-primary h-12 px-8 rounded-xl border-none text-base font-bold normal-case shadow-[0_8px_16px_-6px_rgba(var(--p),0.4)] hover:shadow-[0_12px_20px_-6px_rgba(var(--p),0.5)] hover:-translate-y-0.5 transition-all duration-300 gap-2"
                >
                    Start creating
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
        </>
    );
}

export default FinalizePage;
