type Props = {
    step: number;
}

function CreateAvatarStepper({ step }: Props) {
    const steps = [
        { id: 0, label: 'General' },
        { id: 1, label: 'ID Photos' },
        { id: 2, label: 'Voice' },
        { id: 3, label: 'Finalize' },
    ];

    return (
        <div className="w-full max-w-3xl mx-auto py-10 px-4">
            <div className="flex items-center justify-between relative">

                <div className="absolute top-[16px] left-0 w-full h-px bg-base-content/5" />
                <div
                    className="absolute top-[16px] left-0 h-px bg-primary/50 transition-all duration-700 ease-in-out"
                    style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((s) => {
                    const isActive = step === s.id;
                    const isCompleted = step > s.id;

                    return (
                        <div key={s.id} className="relative z-10 flex flex-col items-center">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center
                                transition-all duration-500 border
                                ${isActive
                                    ? 'bg-base-100 border-primary/60'
                                    : isCompleted
                                        ? 'bg-primary/20 border-primary/40'
                                        : 'bg-base-100 border-base-content/10'}
                            `}>
                                {isCompleted ? (
                                    <div className="w-2 h-2 rounded-full bg-primary/60" />
                                ) : (
                                    <span className={`text-[10px] tracking-tighter ${isActive ? 'text-primary' : 'text-base-content/25'}`}>
                                        {s.id + 1}
                                    </span>
                                )}
                            </div>

                            <div className="absolute top-11 flex flex-col items-center whitespace-nowrap">
                                <span className={`
                                    text-[10px] uppercase tracking-[0.25em] transition-colors duration-500
                                    ${isActive ? 'text-primary' : 'text-base-content/20'}
                                `}>
                                    {s.label}
                                </span>
                                {isActive && (
                                    <div className="w-1 h-1 bg-primary/60 rounded-full mt-1 animate-pulse" />
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
