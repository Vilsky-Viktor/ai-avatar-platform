import { useState, useEffect, useRef } from 'react';
import Loading from '../Loading';
import { Sparkles, ChevronDown } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import type { Avatar } from '@loom24/shared/types';
import { MIN_AUDIO_TEXT_CHARS, MAX_AUDIO_TEXT_CHARS } from '@loom24/shared/types';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    avatar?: Avatar;
    onGenerate: (text: string) => Promise<void>;
};

const AUDIO_TAGS: { label: string; tags: string[] }[] = [
    { label: 'Emotions',  tags: ['excited', 'nervous', 'frustrated', 'sorrowful', 'calm', 'happy', 'sad', 'angry'] },
    { label: 'Sounds',    tags: ['laughs', 'sighs', 'coughs', 'gasps', 'gulps', 'clapping'] },
    { label: 'Delivery',  tags: ['whispers', 'shouts', 'pauses', 'hesitates', 'stammers', 'rushed'] },
    { label: 'Tone',      tags: ['cheerfully', 'flatly', 'deadpan', 'playfully'] },
];

function GenAudioModal({ isOpen, onClose, avatar, onGenerate }: Props) {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [tagsOpen, setTagsOpen] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!isOpen) setText('');
    }, [isOpen]);

    useScrollLock(isOpen);
    useEscapeKey(onClose, isOpen);
    if (!isOpen) return null;

    const canGenerate = () => text.trim().length >= MIN_AUDIO_TEXT_CHARS && !loading;

    const handleGenerate = async () => {
        if (!canGenerate()) return;
        setLoading(true);
        await onGenerate(text.trim());
        setLoading(false);
    };

    const insertTag = (tag: string) => {
        const el = textareaRef.current;
        const insertion = `[${tag}]`;
        if (!el) {
            setText(prev => prev + insertion);
            return;
        }
        const start = el.selectionStart ?? text.length;
        const end   = el.selectionEnd   ?? text.length;
        const before = text.slice(0, start);
        const after  = text.slice(end);
        const separator = before.length > 0 && !before.endsWith(' ') ? ' ' : '';
        const next = `${before}${separator}${insertion} ${after}`;
        setText(next);
        const newCursor = before.length + separator.length + insertion.length + 1;
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(newCursor, newCursor);
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="absolute inset-0 bg-base-300/60 animate-modal-backdrop" onClick={onClose} />
            <div className="relative bg-base-100 rounded-2xl border border-base-content/5 flex flex-col gap-6 p-10 w-[580px] animate-modal-card">

                <div className="flex items-center gap-3">
                    <span className="w-8 h-px bg-primary/50" />
                    <h3 className="text-xl uppercase tracking-[0.2em] text-base-content/70">Generate voice</h3>
                </div>

                <div className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.25em] text-base-content/40">Script</span>
                    <textarea
                        ref={textareaRef}
                        autoFocus
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                        placeholder={`Write what you want ${avatar?.name ?? 'your avatar'} to say...`}
                        rows={5}
                        maxLength={MAX_AUDIO_TEXT_CHARS}
                        className="w-full bg-base-200/50 border border-base-content/10 rounded-2xl px-5 py-4 text-sm text-base-content placeholder:text-base-content/25 resize-none focus:outline-none focus:border-primary/40 transition-colors"
                    />
                    <span className={`self-end text-[10px] tabular-nums transition-colors ${text.length >= MAX_AUDIO_TEXT_CHARS ? 'text-error' : 'text-base-content/30'}`}>
                        {text.length}/{MAX_AUDIO_TEXT_CHARS}
                    </span>
                    <p className="text-[11px] text-base-content/25 leading-relaxed">
                        The voice will be generated using {avatar?.name ?? "your avatar"}'s assigned voice.
                    </p>
                </div>

                {/* Audio tags accordion */}
                <div className="border border-base-content/8 rounded-2xl overflow-hidden">
                    <button
                        onClick={() => setTagsOpen(prev => !prev)}
                        className="w-full flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-base-content/[0.02] transition-colors duration-200"
                    >
                        <span className="text-xs uppercase tracking-[0.25em] text-base-content/40">Available tags · click to insert</span>
                        <ChevronDown size={14} strokeWidth={2} className={`text-base-content/30 transition-transform duration-300 ${tagsOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={`grid transition-all duration-300 ease-in-out ${tagsOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                        <div className="overflow-hidden">
                            <div className="flex gap-2 flex-wrap px-5 pb-4 pt-3 border-t border-base-content/8">
                                {AUDIO_TAGS.flatMap(({ tags }) => tags).map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => insertTag(tag)}
                                        className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-base-content/5 text-base-content/40 hover:bg-primary/10 hover:text-primary transition-colors duration-200 cursor-pointer"
                                    >
                                        [{tag}]
                                    </button>
                                ))}
                                <div className="border-t border-base-content/8 -mx-5" />
                                <p className="text-[11px] text-base-content/50 border-l-2 border-primary/40 pl-3 leading-relaxed italic my-2">
                                    These are examples — any descriptive tag in brackets may work.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="px-7 py-3.5 rounded-xl text-xs uppercase tracking-[0.2em] cursor-pointer text-base-content/30 hover:text-base-content/70 transition-colors duration-300"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={!canGenerate()}
                        className="group flex items-center gap-3 px-7 py-3.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary hover:border-primary text-primary hover:text-primary-content transition-all duration-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        {loading
                            ? <Loading size="xs" className="" />
                            : <Sparkles size={16} className="group-hover:animate-pulse" />
                        }
                        <span className="text-sm uppercase tracking-[0.2em]">Generate</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default GenAudioModal;
