import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import CreateAvatarStepper from "../../components/createAvatar/CreateAvatarStepper";
import { useNavigate } from 'react-router-dom';
import BottomDock from '../../components/createAvatar/BottomDock';
import { getAvatarData, initialAvatarData } from '../../utils/avatarCreation';
import { AvatarGender, AvatarTypes, type Avatar } from '@loom24/shared/types';
import { updateAvatar, getVoices, getVoiceFilterOptions } from '../../services/apiGateway';
import type { Voice } from '@loom24/shared/types';
import { Play, Pause, Check } from 'lucide-react';
import { scrollToTop } from '../../utils/scroller';
import { getAvatarById } from '../../services/apiGateway';

const LANGUAGE_NAMES: Record<string, string> = {
    af: 'Afrikaans', ar: 'Arabic', bg: 'Bulgarian', bn: 'Bengali', bs: 'Bosnian',
    ca: 'Catalan', cs: 'Czech', cy: 'Welsh', da: 'Danish', de: 'German',
    el: 'Greek', en: 'English', eo: 'Esperanto', es: 'Spanish', et: 'Estonian',
    fa: 'Persian', fi: 'Finnish', fr: 'French', gl: 'Galician', gu: 'Gujarati',
    he: 'Hebrew', hi: 'Hindi', hr: 'Croatian', hu: 'Hungarian', hy: 'Armenian',
    id: 'Indonesian', is: 'Icelandic', it: 'Italian', ja: 'Japanese', ka: 'Georgian',
    km: 'Khmer', kn: 'Kannada', ko: 'Korean', lt: 'Lithuanian', lv: 'Latvian',
    mk: 'Macedonian', ml: 'Malayalam', mr: 'Marathi', ms: 'Malay', my: 'Burmese',
    nb: 'Norwegian', no: 'Norwegian', fil: 'Filipino', ne: 'Nepali', nl: 'Dutch', or: 'Odia', pa: 'Punjabi',
    pl: 'Polish', pt: 'Portuguese', ro: 'Romanian', ru: 'Russian', si: 'Sinhala',
    sk: 'Slovak', sl: 'Slovenian', sq: 'Albanian', sr: 'Serbian', su: 'Sundanese',
    sv: 'Swedish', sw: 'Swahili', ta: 'Tamil', te: 'Telugu', th: 'Thai',
    tr: 'Turkish', uk: 'Ukrainian', ur: 'Urdu', uz: 'Uzbek', vi: 'Vietnamese',
    zh: 'Chinese', 'zh-CN': 'Chinese (Simplified)', 'zh-TW': 'Chinese (Traditional)',
};

const languageLabel = (code: string) => LANGUAGE_NAMES[code] ?? code;
const sanitize = (value: string) => value.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());

const COLS = 2;
const ROW_HEIGHT = 200;

function AssignVoicePage() {
    const navigate = useNavigate();

    const [newAvatarData] = useState(() => getAvatarData());
    const [avatar, setAvatar] = useState(initialAvatarData);
    const [pageLoading, setPageLoading] = useState(true);

    const [voices, setVoices] = useState<Voice[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [gender, setGender] = useState<AvatarGender | null>(null);

    const [filterLanguage, setFilterLanguage] = useState<string | null>(null);
    const [filterAge, setFilterAge] = useState<string | null>(null);
    const [filterCategory, setFilterCategory] = useState<string | null>(null);
    const [filterUseCase, setFilterUseCase] = useState<string | null>(null);

    const [optLanguages, setOptLanguages] = useState<string[]>([]);
    const [optAges, setOptAges] = useState<string[]>([]);
    const [optCategories, setOptCategories] = useState<string[]>([]);
    const [optUseCases, setOptUseCases] = useState<string[]>([]);

    const [playingId, setPlayingId] = useState<string | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [audioProgress, setAudioProgress] = useState(0);

    const gridRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const savedVoicePathRef = useRef<string | null>(null);
    const mountedRef = useRef(true);
    const [scrollMargin, setScrollMargin] = useState(0);

    useEffect(() => {
        scrollToTop();
        mountedRef.current = true;
        initPage();
        return () => {
            mountedRef.current = false;
            audioRef.current?.pause();
        };
    }, []);

    useLayoutEffect(() => {
        if (pageLoading || !gridRef.current) return;
        setScrollMargin(gridRef.current.getBoundingClientRect().top + window.scrollY);
    }, [pageLoading]);

    const initPage = async () => {
        try {
            const existingAvatar = await getAvatarById(newAvatarData.avatarId);
            setAvatar(existingAvatar);
            savedVoicePathRef.current = existingAvatar.voiceId ?? null;

            const g = existingAvatar.parameters.gender;
            setGender(g);

            const [{ voices: v, nextCursor: cursor }, options] = await Promise.all([
                getVoices(g),
                getVoiceFilterOptions(g),
            ]);

            setVoices(v);
            setNextCursor(cursor);
            setOptLanguages(options.languages);
            setOptAges(options.ages);
            setOptCategories(options.categories);
            setOptUseCases(options.useCases);
        } finally {
            setPageLoading(false);
        }
    };

    // Re-fetch from scratch when filters change
    useEffect(() => {
        if (!gender) return;
        setVoices([]);
        setNextCursor(null);
        setLoadingMore(true);
        getVoices(gender, {
            language: filterLanguage ?? undefined,
            age: filterAge ?? undefined,
            category: filterCategory ?? undefined,
            useCase: filterUseCase ?? undefined,
        }).then(({ voices: v, nextCursor: cursor }) => {
            setVoices(v);
            setNextCursor(cursor);
        }).finally(() => setLoadingMore(false));
    }, [filterLanguage, filterAge, filterCategory, filterUseCase]);

    // Sentinel for loading more pages
    useEffect(() => {
        if (!sentinelRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && nextCursor && !loadingMore) {
                    setLoadingMore(true);
                    getVoices(gender!, {
                        language: filterLanguage ?? undefined,
                        age: filterAge ?? undefined,
                        category: filterCategory ?? undefined,
                        useCase: filterUseCase ?? undefined,
                    }, nextCursor).then(({ voices: more, nextCursor: cursor }) => {
                        setVoices(prev => [...prev, ...more]);
                        setNextCursor(cursor);
                    }).finally(() => setLoadingMore(false));
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [nextCursor, loadingMore, gender, filterLanguage, filterAge, filterCategory, filterUseCase]);

    const rows: Voice[][] = [];
    for (let i = 0; i < voices.length; i += COLS) {
        rows.push(voices.slice(i, i + COLS));
    }

    const rowVirtualizer = useWindowVirtualizer({
        count: rows.length,
        estimateSize: () => ROW_HEIGHT,
        overscan: 3,
        scrollMargin,
    });

    const playAudio = async (id: string, previewUrl: string) => {
        if (playingId === id) {
            audioRef.current?.pause();
            setPlayingId(null);
            return;
        }
        audioRef.current?.pause();
        setAudioProgress(0);
        setLoadingId(id);

        const audio = new Audio(previewUrl);
        audioRef.current = audio;

        audio.ontimeupdate = () => {
            if (!mountedRef.current) return;
            if (audio.duration && isFinite(audio.duration)) {
                setAudioProgress((audio.currentTime / audio.duration) * 100);
            }
        };
        audio.onended = () => {
            if (!mountedRef.current) return;
            setPlayingId(null);
            setAudioProgress(0);
        };

        try {
            await audio.play();
            if (mountedRef.current) setPlayingId(id);
        } finally {
            if (mountedRef.current) setLoadingId(null);
        }
    };

    const seekAudio = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        if (!audio || !audio.duration || !isFinite(audio.duration)) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        audio.currentTime = Math.max(0, Math.min(1, ratio)) * audio.duration;
    };

    const handleSelectVoice = (voice: Voice) => {
        if (playingId && playingId !== voice.id) {
            audioRef.current?.pause();
            setPlayingId(null);
        }
        setAvatarField('voiceId', voice.id);
    };

    const canProceed = () => Boolean(avatar.voiceId);
    const stepLocked = () => Boolean(savedVoicePathRef.current);

    const nextStep = async () => {
        if (!canProceed()) return;
        try {
            if (!stepLocked()) {
                await updateAvatar(newAvatarData.avatarId, { voiceId: avatar.voiceId });
            }
            navigate('/avatar/create/finalize');
        } catch (error) {
            console.log(`Did not manage to update avatar: ${error}`);
        }
    };

    const setAvatarField = (key: keyof Avatar, value: any) => {
        setAvatar((prev: Avatar) => ({ ...prev, [key]: value }));
    };

    const previousStep = () => {
        if (avatar.type === AvatarTypes.twin) {
            navigate('/avatar/create/twin-id-photos');
        } else {
            navigate('/avatar/create/synthetic-id-photos');
        }
    };

    return (
        <>
            <CreateAvatarStepper step={2} />

            {pageLoading ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <span className="loading loading-spinner loading-xl text-primary scale-150"></span>
                </div>
            ) : (
                <div className="max-w-6xl mx-auto px-4 pt-12 pb-40">
                    <div className="flex flex-col gap-8">

                        {/* Filters */}
                        <div className="flex items-center gap-8">
                            {[
                                { label: 'Language', options: optLanguages, active: filterLanguage, set: setFilterLanguage, fmt: languageLabel },
                                { label: 'Age',      options: optAges,      active: filterAge,      set: setFilterAge,      fmt: sanitize },
                                { label: 'Category', options: optCategories, active: filterCategory, set: setFilterCategory, fmt: sanitize },
                                { label: 'Use case', options: optUseCases,  active: filterUseCase,  set: setFilterUseCase,  fmt: sanitize },
                            ].map(({ label, options, active, set, fmt }) => (
                                <select
                                    key={label}
                                    value={active ?? ''}
                                    onChange={e => set(e.target.value || null)}
                                    className="flex-1 py-2 bg-transparent border-b border-base-content/10 focus:border-primary focus:outline-none transition-all duration-300 text-sm text-base-content/60 cursor-pointer"
                                >
                                    <option value="">{label}</option>
                                    {options.map(v => (
                                        <option key={v} value={v}>{fmt(v)}</option>
                                    ))}
                                </select>
                            ))}
                        </div>

                        {/* Voice grid */}
                        {voices.length === 0 && loadingMore ? (
                            <div className="flex items-center justify-center py-16">
                                <span className="loading loading-spinner loading-md text-base-content/20" />
                            </div>
                        ) : (
                            <div
                                ref={gridRef}
                                style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}
                            >
                                {rowVirtualizer.getVirtualItems().map(virtualRow => (
                                    <div
                                        key={virtualRow.key}
                                        data-index={virtualRow.index}
                                        ref={rowVirtualizer.measureElement}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            transform: `translateY(${virtualRow.start - scrollMargin}px)`,
                                        }}
                                    >
                                        <div className="grid grid-cols-2 gap-4 pb-4">
                                            {rows[virtualRow.index].map((voice) => {
                                                const isSelected = avatar.voiceId === voice.id;
                                                const isPlaying = playingId === voice.id;

                                                return (
                                                    <div
                                                        key={voice.id}
                                                        onClick={() => !stepLocked() && handleSelectVoice(voice)}
                                                        className={`
                                                            relative rounded-2xl p-5 flex flex-col gap-4
                                                            transition-all duration-300
                                                            ${stepLocked() ? 'opacity-60 cursor-default' : 'cursor-pointer'}
                                                            ${isSelected
                                                                ? 'border border-primary/30 bg-primary/5'
                                                                : `border border-transparent bg-base-100 ${!stepLocked() ? 'hover:bg-primary/5' : ''}`
                                                            }
                                                        `}
                                                    >
                                                        {/* Top row: radio + name + tags */}
                                                        <div className="flex items-center gap-3">
                                                            <div className={`
                                                                w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                                                                transition-all duration-300
                                                                ${isSelected ? 'border-primary bg-primary' : 'border-base-content/20'}
                                                            `}>
                                                                {isSelected && <Check size={11} strokeWidth={3} className="text-primary-content" />}
                                                            </div>

                                                            <span className="text-sm font-medium tracking-tight truncate max-w-[12rem]">{voice.name}</span>

                                                            <div className="flex items-center gap-1.5 ml-auto flex-wrap justify-end">
                                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/8 text-primary/70">
                                                                    {voice.language}
                                                                </span>
                                                                <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-base-content/5 text-base-content/40">
                                                                    {sanitize(voice.age)}
                                                                </span>
                                                                <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-base-content/5 text-base-content/40">
                                                                    {sanitize(voice.category)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Description */}
                                                        <p className="text-[12px] text-base-content/50 leading-relaxed line-clamp-2">
                                                            {voice.description}
                                                        </p>

                                                        {/* Bottom row: useCase + progress + play */}
                                                        <div className="flex items-center gap-3 mt-auto">
                                                            <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-base-content/5 text-base-content/40 shrink-0">
                                                                {sanitize(voice.useCase)}
                                                            </span>

                                                            <div
                                                                className="flex-1 h-1.5 rounded-full bg-base-content/10 overflow-hidden cursor-pointer"
                                                                onClick={e => { e.stopPropagation(); seekAudio(e); }}
                                                            >
                                                                <div
                                                                    className="h-full bg-primary rounded-full transition-all duration-100"
                                                                    style={{ width: `${isPlaying ? audioProgress : 0}%` }}
                                                                />
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); playAudio(voice.id, voice.previewUrl); }}
                                                                className={`
                                                                    w-9 h-9 rounded-full flex items-center justify-center shrink-0
                                                                    cursor-pointer transition-all duration-200
                                                                    ${isPlaying
                                                                        ? 'bg-primary/10 text-primary'
                                                                        : 'bg-base-content/5 hover:bg-primary/10 text-base-content/50 hover:text-primary'
                                                                    }
                                                                `}
                                                            >
                                                                {loadingId === voice.id
                                                                    ? <span className="loading loading-spinner loading-xs" />
                                                                    : isPlaying
                                                                        ? <Pause size={15} />
                                                                        : <Play size={15} className="ml-0.5" />
                                                                }
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div ref={sentinelRef} className="h-1" />
                        {loadingMore && voices.length > 0 && (
                            <div className="flex justify-center py-6">
                                <span className="loading loading-spinner loading-xl text-primary scale-150" />
                            </div>
                        )}
                    </div>
                </div>
            )}

            <BottomDock
                avatarId={newAvatarData.avatarId}
                canProceed={canProceed}
                nextStep={nextStep}
                previousStep={previousStep}
                finish={false}
            />
        </>
    );
}

export default AssignVoicePage;
