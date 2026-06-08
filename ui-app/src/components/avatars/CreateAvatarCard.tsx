import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CreateAvatarCard = () => {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate('/avatar/create/general')}
            className="group relative p-[1.5px] rounded-2xl aspect-square overflow-hidden active:scale-[0.98] focus:outline-none cursor-pointer text-left w-full"
        >
            <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 group-hover:animate-spin-border transition-opacity duration-300 pointer-events-none"
                style={{ backgroundImage: 'conic-gradient(from var(--gen-angle), transparent 0%, transparent 60%, color-mix(in oklch, var(--color-primary) 85%, transparent) 80%, transparent 100%)' }}
            />
            <div className="relative w-full h-full rounded-2xl bg-base-100 border border-base-content/10 group-hover:border-transparent transition-colors duration-300 flex flex-col items-center justify-center overflow-hidden">
                <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-500 opacity-0 group-hover:opacity-100"
                    style={{ background: 'radial-gradient(circle at 50% 120%, color-mix(in oklch, var(--color-primary) 12%, transparent), transparent)' }}
                />
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                />
                <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-base-content/10 group-hover:border-primary/40 pointer-events-none transition-colors duration-300" />
                <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-base-content/10 group-hover:border-primary/40 pointer-events-none transition-colors duration-300" />
                <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-base-content/10 group-hover:border-primary/40 pointer-events-none transition-colors duration-300" />
                <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-base-content/10 group-hover:border-primary/40 pointer-events-none transition-colors duration-300" />
                <div className="relative z-10 flex flex-col items-center justify-center gap-5 text-center">
                    <div className="relative">
                        <div className="absolute inset-0 blur-2xl bg-primary/20 scale-0 group-hover:scale-150 transition-transform duration-500 rounded-full" />
                        <div className="relative text-base-content/20 group-hover:text-primary transition-all duration-500 ease-out group-hover:rotate-90">
                            <Plus size={80} strokeWidth={1} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <span className="block text-lg uppercase tracking-[0.25em] text-base-content/80 group-hover:text-base-content transition-colors">
                            New Life
                        </span>
                        <span className="block text-xs uppercase tracking-[0.1em] text-base-content/40 group-hover:text-primary/70 transition-colors">
                            Generate AI avatar
                        </span>
                    </div>
                </div>
            </div>
        </button>
    );
};

export default CreateAvatarCard;
