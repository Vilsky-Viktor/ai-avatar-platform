import { useState, useEffect, useRef, useCallback } from 'react';
import CreateAvatarStepper from "../../components/createAvatar/CreateAvatarStepper";
import { useNavigate } from 'react-router-dom';
import BottomDock from '../../components/createAvatar/BottomDock';

import {
    getAvatarData,
    initialAvatarData
} from '../../utils/avatarCreation';
import { AvatarGender, AvatarTypes, type Avatar } from '../../types/avatar';
import { updateAvatar, getVoicesByGender, getAvatarById } from '../../services/apiGateway';
import type { Voice } from '../../types/voice';
import { Play, Pause, Check } from 'lucide-react';
import { scrollToTop } from '../../utils/scroller';

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

function AssignVoicePage() {
    const navigate = useNavigate();

    const [newAvatarData, _] = useState(() => getAvatarData());
    const [avatar, setAvatar] = useState(initialAvatarData);
    const [pageLoading, setPageLoading] = useState(true);
    const [voices, setVoices] = useState<Voice[]>([]);

    const [playingId, setPlayingId] = useState<string | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [audioProgress, setAudioProgress] = useState(0);

    const [filterLanguage, setFilterLanguage] = useState<string | null>(null);
    const [filterAge, setFilterAge] = useState<string | null>(null);
    const [filterCategory, setFilterCategory] = useState<string | null>(null);
    const [filterUseCase, setFilterUseCase] = useState<string | null>(null);

    const [visibleCount, setVisibleCount] = useState(30);
    const observerRef = useRef<IntersectionObserver | null>(null);

    const sentinelRef = useCallback((node: HTMLDivElement | null) => {
        if (observerRef.current) observerRef.current.disconnect();
        if (!node) return;
        observerRef.current = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting) setVisibleCount(c => c + 30); },
            { threshold: 0.1 }
        );
        observerRef.current.observe(node);
    }, []);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const savedVoicePathRef = useRef<string | null>(null);

    useEffect(() => {
        scrollToTop();
    }, [])

    useEffect(() => {
        initPage();
        return () => { audioRef.current?.pause(); };
    }, []);

    const initPage = async () => {
        try {
            const existingAvatar = await getAvatarById(newAvatarData.avatarId);
            setAvatar(existingAvatar);
            savedVoicePathRef.current = existingAvatar.voiceId ?? null;
            await getVoices(existingAvatar.parameters.gender);
        } finally {
            setPageLoading(false);
        }
    }

    const getVoices = async (gender: AvatarGender) => {
        const voices = await getVoicesByGender(gender);
        setVoices(voices);
    }

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
            if (audio.duration && isFinite(audio.duration)) {
                setAudioProgress((audio.currentTime / audio.duration) * 100);
            }
        };
        audio.onended = () => {
            setPlayingId(null);
            setAudioProgress(0);
        };

        try {
            await audio.play();
            setPlayingId(id);
        } finally {
            setLoadingId(null);
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


    const uniqueValues = (key: keyof Voice) =>
        [...new Set(voices.map(v => v[key] as string))].filter(Boolean).sort();

    const filteredVoices = voices.filter(v =>
        (!filterLanguage || v.language === filterLanguage) &&
        (!filterAge      || v.age      === filterAge)      &&
        (!filterCategory || v.category === filterCategory) &&
        (!filterUseCase  || v.useCase  === filterUseCase)
    );

    const visibleVoices = filteredVoices.slice(0, visibleCount);

    // Reset visible count when filters change
    useEffect(() => { setVisibleCount(50); }, [filterLanguage, filterAge, filterCategory, filterUseCase]);

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
    }

    const setAvatarField = (key: keyof Avatar, value: any) => {
        setAvatar((prev: Avatar) => ({...prev, [key]: value}));
    }

    const previousStep = () => {
        if (avatar.type === AvatarTypes.twin) {
            navigate('/avatar/create/twin-id-photos');
        } else {
            navigate('/avatar/create/synthetic-id-photos');
        }
    }

    return (
        <>
            <CreateAvatarStepper step={2}/>

            {pageLoading ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <span className="loading loading-spinner loading-xl text-primary scale-150"></span>
                </div>
            ) : (
                <div className="max-w-6xl mx-auto px-4 pt-12 pb-40">
                    {voices.length === 0 ? (
                        <div className="flex items-center justify-center py-16">
                            <span className="loading loading-spinner loading-md text-base-content/20" />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-8">

                            {/* Filters */}
                            <div className="flex items-center gap-8">
                                {[
                                    { label: 'Language', values: uniqueValues('language'), active: filterLanguage, set: setFilterLanguage },
                                    { label: 'Age',      values: uniqueValues('age'),      active: filterAge,      set: setFilterAge      },
                                    { label: 'Category', values: uniqueValues('category'), active: filterCategory, set: setFilterCategory },
                                    { label: 'Use case', values: uniqueValues('useCase'),  active: filterUseCase,  set: setFilterUseCase  },
                                ].map(({ label, values, active, set }) => (
                                    <select
                                        key={label}
                                        value={active ?? ''}
                                        onChange={e => set(e.target.value || null)}
                                        className="flex-1 py-2 bg-transparent border-b border-base-content/10 focus:border-primary focus:outline-none transition-all duration-300 text-sm text-base-content/60 cursor-pointer"
                                    >
                                        <option value="">{label}</option>
                                        {values.map(v => (
                                            <option key={v} value={v}>{label === 'Language' ? languageLabel(v) : sanitize(v)}</option>
                                        ))}
                                    </select>
                                ))}
                            </div>

                            {/* Voice grid */}
                            <div className="grid grid-cols-2 gap-4">
                            {visibleVoices.map((voice) => {
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

                                            {/* Progress bar */}
                                            <div
                                                className="flex-1 h-1.5 rounded-full bg-base-content/10 overflow-hidden cursor-pointer"
                                                onClick={e => { e.stopPropagation(); seekAudio(e); }}
                                            >
                                                <div
                                                    className="h-full bg-primary rounded-full transition-all duration-100"
                                                    style={{ width: `${isPlaying ? audioProgress : 0}%` }}
                                                />
                                            </div>

                                            {/* Play button */}
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
                            {visibleCount < filteredVoices.length && (
                                <div ref={sentinelRef} className="flex justify-center py-6">
                                    <span className="loading loading-spinner loading-sm text-base-content/20" />
                                </div>
                            )}
                        </div>
                    )}
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
