type Props = {
    size?: 'xs' | 'sm' | 'md' | 'xl';
    color?: string;
    className?: string;
}

function Loading({ size = 'xl', color = 'text-primary', className = 'text-center mt-6' }: Props) {
    const sizeClass = size === 'xl' ? 'loading-xl w-16' : size === 'md' ? 'loading-md w-10' : size === 'sm' ? 'loading-sm w-8' : 'loading-xs w-6';

    return (
        <div className={className}>
            <span className={`loading loading-ring ${color} ${sizeClass}`}></span>
        </div>
    );
}

export default Loading;
