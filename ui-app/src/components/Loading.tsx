type Props = {
    size?: 'sm' | 'md' | 'xl';
}

function Loading({ size = 'xl' }: Props) {
    const sizeClass = size === 'xl' ? 'loading-xl w-16' : size === 'md' ? 'loading-md w-10' : 'loading-sm w-8';

    return (
        <div className="text-center mt-6">
            <span className={`loading loading-dots text-primary ${sizeClass}`}></span>
        </div>
    );
}

export default Loading;