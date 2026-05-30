type Props = {
    step: number;
}

function CreateAvatarStepper({ step }: Props) {
    const steps = [
        { id: 0, label: "General" },
        { id: 1, label: "ID Photos" },
        { id: 2, label: "Voice" },
        { id: 3, label: "Finilize" }
    ];

    return (
        <div className="w-full max-w-3xl mx-auto py-10 px-4">
            <div className="flex items-center justify-between relative">
                {/* Background Track */}
                <div className="absolute top-[18px] left-0 w-full h-[1px] bg-base-content/5" />
                
                {/* Active Progress Fill */}
                <div 
                    className="absolute top-[18px] left-0 h-[1px] bg-primary transition-all duration-700 ease-in-out"
                    style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((s) => {
                    const isActive = step === s.id;
                    const isCompleted = step > s.id;

                    return (
                        <div key={s.id} className="relative z-10 flex flex-col items-center group">
                            {/* The Dot */}
                            <div className={`
                                w-9 h-9 rounded-lg flex items-center justify-center
                                transition-all duration-500 border
                                ${isActive 
                                    ? 'bg-base-100 border-primary shadow-[0_0_15px_rgba(var(--p),0.2)]' 
                                    : isCompleted 
                                        ? 'bg-primary border-primary' 
                                        : 'bg-base-100 border-base-content/10'}
                            `}>
                                {isCompleted ? (
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-content animate-in zoom-in duration-300" />
                                ) : (
                                    <span className={`text-[10px] font-bold tracking-tighter ${isActive ? 'text-primary' : 'text-base-content/30'}`}>
                                        {s.id + 1}
                                    </span>
                                )}
                            </div>

                            {/* The Label */}
                            <div className="absolute top-12 flex flex-col items-center whitespace-nowrap">
                                <span className={`
                                    text-[10px] uppercase font-bold tracking-[0.2em] transition-colors duration-500
                                    ${isActive ? 'text-primary' : 'text-base-content/20'}
                                `}>
                                    {s.label}
                                </span>
                                {isActive && (
                                    <div className="w-1 h-1 bg-primary rounded-full mt-1 animate-pulse" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default CreateAvatarStepper;