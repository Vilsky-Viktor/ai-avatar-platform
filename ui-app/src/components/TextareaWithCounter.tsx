import { forwardRef } from 'react';

type Props = {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    maxLength: number;
    placeholder?: string;
    rows?: number;
    autoFocus?: boolean;
    onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    className?: string;
};

const TextareaWithCounter = forwardRef<HTMLTextAreaElement, Props>(
    ({ value, onChange, maxLength, placeholder, rows, autoFocus, onKeyDown, className }, ref) => (
        <div className={`flex flex-col bg-base-200/50 border border-base-content/10 rounded-2xl focus-within:border-primary/40 transition-colors ${className ?? ''}`}>
            <textarea
                ref={ref}
                value={value}
                onChange={onChange}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                rows={rows}
                autoFocus={autoFocus}
                maxLength={maxLength}
                className="flex-1 min-h-0 w-full bg-transparent px-5 pt-4 pb-2 text-sm text-base-content placeholder:text-base-content/25 resize-none focus:outline-none"
            />
            <span className={`text-center text-[10px] tabular-nums pt-2 pb-2.5 border-t transition-colors ${value.length >= maxLength ? 'text-error border-error/20' : 'text-base-content/25 border-base-content/8'}`}>
                {value.length}/{maxLength}
            </span>
        </div>
    )
);

TextareaWithCounter.displayName = 'TextareaWithCounter';

export default TextareaWithCounter;
