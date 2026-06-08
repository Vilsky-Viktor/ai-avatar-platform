type Props = {
    opts: string[];
    value: string | null;
    onChange: (val: string | null) => void;
    label?: string;
    nullable?: boolean;
    disabled?: boolean;
    fmt?: (opt: string) => string;
};

function PillSelect({ opts, value, onChange, label, nullable = false, disabled = false, fmt }: Props) {
    return (
        <div className={`flex flex-col gap-2.5 ${disabled ? 'opacity-50' : ''}`}>
            {label && (
                <label className="text-xs uppercase tracking-[0.25em] text-base-content/40">
                    {label}
                </label>
            )}
            <div className="flex flex-wrap gap-2">
                {opts.map(opt => (
                    <button
                        key={opt}
                        disabled={disabled}
                        onClick={() => onChange(nullable && value === opt ? null : opt)}
                        className={`px-3 py-1 rounded-full text-[11px] tracking-[0.15em] transition-all duration-200 cursor-pointer disabled:pointer-events-none
                            ${value === opt
                                ? 'bg-primary/15 text-primary border border-primary/30'
                                : 'bg-base-content/5 text-base-content/40 border border-transparent hover:bg-base-content/10 hover:text-base-content/60'
                            }
                        `}
                    >
                        {fmt ? fmt(opt) : opt}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default PillSelect;
