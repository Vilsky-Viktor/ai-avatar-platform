import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Link } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';

type Props = {
    url: string;
    onClose: () => void;
};

const PlatformButton = ({
    label,
    href,
    bg,
    children,
}: {
    label: string;
    href: string;
    bg: string;
    children: React.ReactNode;
}) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        className="flex flex-col items-center gap-2 group"
    >
        <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-200"
            style={{ background: bg }}
        >
            {children}
        </div>
        <span className="text-[11px] text-base-content/50 group-hover:text-base-content/80 transition-colors">{label}</span>
    </a>
);

function SharePopup({ url, onClose }: Props) {
    useScrollLock();
    const [copied, setCopied] = useState(false);
    const enc = encodeURIComponent(url);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleNativeShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.share({ url });
    };

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="absolute inset-0 bg-base-300/60 animate-modal-backdrop" onClick={onClose} />
            <div className="relative bg-base-100 w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-base-content/5 p-8 animate-modal-card">
                <p className="text-center text-sm font-bold tracking-widest uppercase text-base-content/50 mb-6">Share</p>

                <div className="grid grid-cols-4 gap-4 justify-items-center">
                    <PlatformButton label="WhatsApp" href={`https://wa.me/?text=${enc}`} bg="#25D366">
                        <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
                            <path d="M.057 24 1.744 17.837C.703 16.033.156 13.988.157 11.891.16 5.335 5.495.001 12.05.001c3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.867-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.149-.172.198-.296.298-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.227 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
                        </svg>
                    </PlatformButton>

                    <PlatformButton label="Telegram" href={`https://t.me/share/url?url=${enc}`} bg="#0088cc">
                        <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                        </svg>
                    </PlatformButton>

                    <PlatformButton label="X / Twitter" href={`https://twitter.com/intent/tweet?url=${enc}`} bg="#000000">
                        <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L2.25 2.25h6.865l4.258 5.622 5.871-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                        </svg>
                    </PlatformButton>

                    <PlatformButton label="Facebook" href={`https://www.facebook.com/sharer/sharer.php?u=${enc}`} bg="#1877F2">
                        <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                    </PlatformButton>

                    <PlatformButton label="LinkedIn" href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc}`} bg="#0A66C2">
                        <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                    </PlatformButton>

                    <PlatformButton label="Reddit" href={`https://reddit.com/submit?url=${enc}`} bg="#FF4500">
                        <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
                            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                        </svg>
                    </PlatformButton>

                    <PlatformButton label="Pinterest" href={`https://pinterest.com/pin/create/button/?url=${enc}`} bg="#E60023">
                        <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
                            <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
                        </svg>
                    </PlatformButton>

                    <button
                        onClick={handleCopy}
                        className="flex flex-col items-center gap-2 group cursor-pointer"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-base-300 flex items-center justify-center transition-transform group-hover:scale-110 duration-200">
                            {copied
                                ? <Check size={24} className="text-success" />
                                : <Link size={24} className="text-base-content/60" />
                            }
                        </div>
                        <span className="text-[11px] text-base-content/50 group-hover:text-base-content/80 transition-colors">
                            {copied ? 'Copied!' : 'Copy Link'}
                        </span>
                    </button>

                    {'share' in navigator && (
                        <button
                            onClick={handleNativeShare}
                            className="flex flex-col items-center gap-2 group cursor-pointer"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-base-300 flex items-center justify-center transition-transform group-hover:scale-110 duration-200">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-base-content/60">
                                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                    <polyline points="16 6 12 2 8 6" />
                                    <line x1="12" y1="2" x2="12" y2="15" />
                                </svg>
                            </div>
                            <span className="text-[11px] text-base-content/50 group-hover:text-base-content/80 transition-colors">More</span>
                        </button>
                    )}
                </div>

                <button
                    onClick={onClose}
                    className="btn btn-ghost btn-lg rounded-2xl w-full uppercase tracking-widest text-xs opacity-50 hover:opacity-100 mt-6"
                >
                    Close
                </button>
            </div>
        </div>,
        document.body
    );
}

export default SharePopup;
