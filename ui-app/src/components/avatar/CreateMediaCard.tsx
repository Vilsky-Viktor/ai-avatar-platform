import { Plus } from 'lucide-react';

type Props = {
    onClick: () => void;
};

const CreateMediaCard = ({ onClick }: Props) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group relative overflow-hidden rounded-2xl aspect-square border-2 border-transparent hover:border-primary/50 bg-base-100 transition-all duration-300 cursor-pointer focus:outline-none active:scale-[0.98] w-full"
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(var(--p),0.1),transparent)] group-hover:bg-[radial-gradient(circle_at_50%_120%,rgba(var(--p),0.2),transparent)] transition-all duration-500" />
            <div className="relative z-10 flex flex-col items-center justify-center h-full gap-3">
                <div className="relative">
                    <div className="absolute inset-0 blur-2xl bg-primary/20 scale-0 group-hover:scale-150 transition-transform duration-500 rounded-full" />
                    <div className="relative text-base-content/20 group-hover:text-primary transition-all duration-500 group-hover:rotate-90">
                        <Plus size={80} strokeWidth={1} />
                    </div>
                </div>
                <div className="space-y-0.5 text-center">
                    <span className="block text-sm font-semibold uppercase tracking-[0.25em] text-base-content/40 group-hover:text-base-content transition-colors">Create Media</span>
                    <span className="block text-[11px] font-medium uppercase tracking-[0.15em] text-base-content/20 group-hover:text-primary/70 transition-colors">Generate new content</span>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
        </button>
    );
};

export default CreateMediaCard;
