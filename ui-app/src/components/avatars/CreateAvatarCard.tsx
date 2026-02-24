import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CreateAvatarCard = () => {
    const navigate = useNavigate();

    return ( 
        <button
            onClick={() => navigate('/avatar/create/general')}
            className="group card bg-base-100 w-full h-[450px] shadow-md 
                    relative overflow-hidden rounded-2xl transition-all duration-300 
                    active:scale-[0.98] focus:outline-none cursor-pointer text-left"
        >
            <div className="absolute inset-0 z-50 pointer-events-none rounded-2xl border-2 border-transparent group-hover:border-primary/50 transition-colors duration-300" />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(var(--p),0.1),transparent)] group-hover:bg-[radial-gradient(circle_at_50%_120%,rgba(var(--p),0.2),transparent)] transition-all duration-500" />
            
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{ backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />

            <div className="card-body relative z-20 items-center justify-center text-center">
                
                <div className="relative mb-6">
                    <div className="absolute inset-0 blur-2xl bg-primary/20 scale-0 group-hover:scale-150 transition-transform duration-500 rounded-full" />
                    
                    <div className="relative text-base-content/20 group-hover:text-primary transition-all duration-500 ease-out group-hover:rotate-90">
                        <Plus size={120} strokeWidth={1} />
                    </div>
                </div>

                <div className="space-y-1">
                    <span className="block text-xl font-medium uppercase tracking-[0.25em] text-base-content/80 group-hover:text-base-content transition-colors">
                        Create New Life
                    </span>
                    <span className="block text-xs font-semibold uppercase tracking-[0.1em] text-base-content/40 group-hover:text-primary/70 transition-colors">
                        Generate AI avatar
                    </span>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
        </button>
     );
}

export default CreateAvatarCard;