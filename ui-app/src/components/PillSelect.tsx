type Props = {
    label: string;
    fieldKey: string;
    opts: string[];
    value: string;
    disabled: boolean;
    onChange: (key: string, val: string) => void;
};

function PillSelect({ label, fieldKey, opts, value, disabled, onChange }: Props) {
    return (
        <div className={`flex flex-col gap-2.5 ${disabled ? 'opacity-50' : ''}`}>
            <label className="text-xs font-medium uppercase tracking-[0.3em] text-base-content/20">
                {label}
            </label>
            <div className="flex flex-wrap gap-2">
                {opts.map(opt => (
                    <button
                        key={opt}
                        disabled={disabled}
                        onClick={() => onChange(fieldKey, opt)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer disabled:pointer-events-none
                            ${value === opt
                                ? 'bg-primary/15 text-primary border border-primary/30'
                                : 'bg-base-content/5 text-base-content/30 border border-transparent hover:bg-base-content/10 hover:text-base-content/60'
                            }
                        `}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default PillSelect;
