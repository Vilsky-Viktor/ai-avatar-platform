import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import CreateAvatarStepper from "../../components/createAvatar/CreateAvatarStepper";
import PillSelect from "../../components/PillSelect";
import Loading from "../../components/Loading";
import { useNavigate } from 'react-router-dom';
import BottomDock from '../../components/createAvatar/BottomDock';
import { getAvatarData, initialAvatarData } from '../../utils/avatarCreation';
import { AvatarGender, AvatarTypes, type Avatar } from '@loom24/shared/types';
import { updateAvatar, getVoices } from '../../services/apiGateway';
import type { Voice } from '@loom24/shared/types';
import { Play, Pause, Check, ChevronDown } from 'lucide-react';
import { scrollToTop } from '../../utils/scroller';
import { getAvatarById } from '../../services/apiGateway';

const LANGUAGE_NAMES: Record<string, string> = {
    ar: 'Arabic',     bg: 'Bulgarian',  cs: 'Czech',      da: 'Danish',     de: 'German',
    el: 'Greek',      en: 'English',    es: 'Spanish',    fi: 'Finnish',    fil: 'Filipino',
    fr: 'French',     hi: 'Hindi',      hr: 'Croatian',   hu: 'Hungarian',  id: 'Indonesian',
    it: 'Italian',    ja: 'Japanese',   ko: 'Korean',     ms: 'Malay',      nl: 'Dutch',
    no: 'Norwegian',  pl: 'Polish',     pt: 'Portuguese', ro: 'Romanian',   ru: 'Russian',
    sk: 'Slovak',     sv: 'Swedish',    ta: 'Tamil',      tr: 'Turkish',    uk: 'Ukrainian',
    vi: 'Vietnamese', zh: 'Chinese',
};

const languageLabel = (code: string) => LANGUAGE_NAMES[code] ?? code;
const sanitize = (value: string) => value.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());

const VOICE_FILTER_LANGUAGES  = Object.keys(LANGUAGE_NAMES).sort((a, b) => languageLabel(a).localeCompare(languageLabel(b)));
const VOICE_FILTER_AGES        = ['middle-aged', 'old', 'young'].sort((a, b) => sanitize(a).localeCompare(sanitize(b)));
const VOICE_FILTER_CATEGORIES  = ['high_quality', 'premade', 'professional'].sort((a, b) => sanitize(a).localeCompare(sanitize(b)));
const VOICE_FILTER_USE_CASES   = ['advertisement', 'characters_animation', 'conversational', 'entertainment_tv', 'informative_educational', 'narrative_story', 'social_media'].sort((a, b) => sanitize(a).localeCompare(sanitize(b)));

const COLS = 1;
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
    const [openSection, setOpenSection] = useState<string>('language');

    const toggleSection = (key: string) => setOpenSection(prev => prev === key ? '' : key);

    const [optLanguages] = useState<string[]>(VOICE_FILTER_LANGUAGES);
    const [optAges] = useState<string[]>(VOICE_FILTER_AGES);
    const [optCategories] = useState<string[]>(VOICE_FILTER_CATEGORIES);
    const [optUseCases] = useState<string[]>(VOICE_FILTER_USE_CASES);

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

            const { voices: v, nextCursor: cursor } = await getVoices(g);
            setVoices(v);
            setNextCursor(cursor);
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

    const filters = [
        { label: 'Language', key: 'language', options: optLanguages, active: filterLanguage, set: setFilterLanguage, fmt: languageLabel },
        { label: 'Age',      key: 'age',      options: optAges,      active: filterAge,      set: setFilterAge,      fmt: sanitize },
        { label: 'Category', key: 'category', options: optCategories, active: filterCategory, set: setFilterCategory, fmt: sanitize },
        { label: 'Use case', key: 'useCase',  options: optUseCases,  active: filterUseCase,  set: setFilterUseCase,  fmt: sanitize },
    ];

    return (
        <>
            <CreateAvatarStepper step={2} />

            {pageLoading ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loading />
                </div>
            ) : (
                <div className="max-w-7xl mx-auto px-4 pt-10 pb-32 flex gap-8 items-start">

                    {/* Left — Filters */}
                    <div className="w-96 flex-shrink-0 sticky top-6">
                        <div className="flex flex-col">
                            {filters.map(({ label, key, options, active, set, fmt }) => {
                                const isOpen = openSection === key;
                                return (
                                    <div key={key} className="border-b border-base-content/5 last:border-0">
                                        <button
                                            className="w-full flex items-center justify-between py-4 cursor-pointer"
                                            onClick={() => toggleSection(key)}
                                        >
                                            <div className="flex flex-col items-start gap-1">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-8 h-px transition-colors duration-200 ${isOpen ? 'bg-primary' : 'bg-primary/50'}`} />
                                                    <span className={`text-sm uppercase tracking-[0.2em] transition-colors duration-200 ${isOpen ? 'text-base-content/90' : 'text-base-content/70'}`}>
                                                        {label}
                                                    </span>
                                                </div>
                                                {!isOpen && active && (
                                                    <span className="text-xs text-base-content/30 truncate max-w-[190px] pl-11">
                                                        {fmt(active)}
                                                    </span>
                                                )}
                                            </div>
                                            <ChevronDown
                                                size={13}
                                                strokeWidth={2.5}
                                                className={`text-base-content/30 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180 text-primary' : ''}`}
                                            />
                                        </button>

                                        <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                                            <div className="overflow-hidden">
                                                <div className="pb-5">
                                                    <PillSelect
                                                        opts={options}
                                                        value={active}
                                                        nullable
                                                        fmt={fmt}
                                                        onChange={set}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right — Voice grid */}
                    <div className="flex-1 flex flex-col gap-8">

                        <div className="flex flex-col gap-2 pt-4">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-px bg-primary/50" />
                                <h1 className="text-xl uppercase tracking-[0.2em] text-base-content/70">
                                    Choose a voice
                                </h1>
                            </div>
                            <p className="text-sm text-base-content/40 pl-11 leading-relaxed">
                                Play any voice to preview it, then click a card to select it for your avatar.
                            </p>
                            <p className="text-xs text-base-content/25 pl-11">
                                You'll also be able to record your own voice later.
                            </p>
                        </div>

                        {voices.length === 0 && loadingMore ? (
                            <div className="flex items-center justify-center py-32">
                                <Loading size="md" />
                            </div>
                        ) :voices.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 gap-3">
                                <span className="text-base-content/20 text-sm uppercase tracking-[0.2em]">No voices match these filters</span>
                                <button
                                    onClick={() => { setFilterLanguage(null); setFilterAge(null); setFilterCategory(null); setFilterUseCase(null); }}
                                    className="text-xs text-primary/50 hover:text-primary transition-colors cursor-pointer underline underline-offset-4"
                                >
                                    Clear all filters
                                </button>
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
                                        <div className="grid grid-cols-1 gap-4 pb-4">
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
                                                        <div className="flex items-center gap-3">
                                                            <div className={`
                                                                w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                                                                transition-all duration-300
                                                                ${isSelected ? 'border-primary bg-primary' : 'border-base-content/20'}
                                                            `}>
                                                                {isSelected && <Check size={11} strokeWidth={3} className="text-primary-content" />}
                                                            </div>

                                                            <span className="text-sm font-medium tracking-tight truncate flex-1">{voice.name}</span>

                                                            <div className="flex items-center gap-1.5 ml-auto flex-wrap justify-end flex-shrink-0">
                                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/8 text-primary/70">
                                                                    {languageLabel(voice.language)}
                                                                </span>
                                                                <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-base-content/5 text-base-content/40">
                                                                    {sanitize(voice.age)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <p className="text-[12px] text-base-content/50 leading-relaxed line-clamp-2">
                                                            {voice.description}
                                                        </p>

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
                                                                    ? <span className="loading loading-dots loading-xs" />
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
                                <Loading size="md" />
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
