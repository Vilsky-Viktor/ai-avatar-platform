import { useState, useEffect, useRef } from 'react';
import CreateAvatarStepper from "../../components/createAvatar/CreateAvatarStepper";
import { useNavigate } from 'react-router-dom';
import BottomDock from '../../components/createAvatar/BottomDock';
import { useApp } from '../../providers/ContextProvider';
import {
    getAvatarData,
    initialAvatarData
} from '../../utils/avatarCreation';
import { AvatarGender, AvatarTypes, type Avatar } from '../../types/avatar';
import { updateAvatar, getVoicesByGender, getAvatarById } from '../../services/apiGateway';
import type { Voice } from '../../types/voice';
import { uploadMediaToBucket, getMediaUrlFromPath } from '../../services/storage';
import { Upload, Play, Pause, Check, Music, Trash2 } from 'lucide-react';
import { scrollToTop } from '../../utils/scroller';

function AssignVoicePage() {
    const navigate = useNavigate();
    const { user } = useApp();

    const [newAvatarData, _] = useState(() => getAvatarData());
    const [avatar, setAvatar] = useState(initialAvatarData);
    const [pageLoading, setPageLoading] = useState(true);
    const [voices, setVoices] = useState<Voice[]>([]);

    const [playingId, setPlayingId] = useState<string | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [audioProgress, setAudioProgress] = useState(0);
    const [voiceUrls, setVoiceUrls] = useState<Record<string, string>>({});
    const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const savedVoicePathRef = useRef<string | null>(null);

    const stopRaf = () => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    };

    const startRaf = (audio: HTMLAudioElement) => {
        stopRaf();
        const tick = () => {
            if (!audio.paused && !audio.ended) {
                setAudioProgress((audio.currentTime / audio.duration) * 100 || 0);
                rafRef.current = requestAnimationFrame(tick);
            }
        };
        rafRef.current = requestAnimationFrame(tick);
    };

    useEffect(() => {
        scrollToTop();
    }, [])

    useEffect(() => {
        initPage();
        return () => { audioRef.current?.pause(); stopRaf(); };
    }, []);

    const initPage = async () => {
        try {
            const existingAvatar = await getAvatarById(newAvatarData.avatarId);
            setAvatar(existingAvatar);
            savedVoicePathRef.current = existingAvatar.voicePath ?? null;

            await getVoices(existingAvatar.parameters.gender);

            const voiceUrl = await getMediaUrlFromPath(getUploadedVoicePath()).catch(() => null);
            if (voiceUrl) {
                setUploadedAudioUrl(voiceUrl);
            }
        } finally {
            setPageLoading(false);
        }
    }

    const getVoices = async (gender: AvatarGender) => {
        const voices = await getVoicesByGender(gender);
        setVoices(voices);
    }

    const getUploadedVoicePath = () =>
        `media/${user?.id}-user/avatars/${newAvatarData.avatarId}-avatar/voices/voice.mp3`;

    const uploadToBucket = async (voice: string) => {
        const mediaPath = getUploadedVoicePath();
        await uploadMediaToBucket(mediaPath, voice);
        setAvatarField('isUploadedVoice', true);
        setAvatarField('voicePath', mediaPath);
    }

    const handleFileChange = async (file: File) => {
        setUploadError(null);

        if (!file.name.toLowerCase().endsWith('.mp3') && file.type !== 'audio/mpeg') {
            setUploadError('Only .mp3 files are supported');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const dataUrl = e.target?.result as string;
            const audio = new Audio(dataUrl);
            audio.onloadedmetadata = async () => {
                if (audio.duration > 30) {
                    setUploadError('Audio must be 30 seconds or less');
                    return;
                }
                setUploadedAudioUrl(dataUrl);
                setUploading(true);
                try {
                    await uploadToBucket(dataUrl);
                } catch {
                    setUploadError('Upload failed. Please try again.');
                } finally {
                    setUploading(false);
                }
            };
        };
        reader.readAsDataURL(file);
    };

    const playAudio = async (id: string, url?: string) => {
        if (playingId === id) {
            audioRef.current?.pause();
            stopRaf();
            setPlayingId(null);
            return;
        }

        audioRef.current?.pause();
        stopRaf();
        setAudioProgress(0);
        setLoadingId(id);

        let audioUrl = url;
        if (!audioUrl) {
            if (voiceUrls[id]) {
                audioUrl = voiceUrls[id];
            } else {
                const voice = voices.find(v => v.id === id);
                if (voice) {
                    audioUrl = await getMediaUrlFromPath(voice.audioPath);
                    setVoiceUrls(prev => ({ ...prev, [id]: audioUrl! }));
                }
            }
        }

        if (!audioUrl) {
            setLoadingId(null);
            return;
        }

        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => {
            stopRaf();
            setPlayingId(null);
            setAudioProgress(0);
        };
        try {
            await audio.play();
            setPlayingId(id);
            startRaf(audio);
        } finally {
            setLoadingId(null);
        }
    };

    const handleSelectVoice = (voice: Voice) => {
        if (playingId && playingId !== voice.id) {
            audioRef.current?.pause();
            setPlayingId(null);
        }
        setAvatarField('isUploadedVoice', false);
        setAvatarField('voicePath', voice.audioPath);
    };

    const handleRemoveUpload = () => {
        setUploadedAudioUrl(null);
        if (avatar.isUploadedVoice) {
            setAvatarField('isUploadedVoice', false);
            setAvatarField('voicePath', null);
        }
        if (playingId === 'uploaded') {
            audioRef.current?.pause();
            stopRaf();
            setPlayingId(null);
            setAudioProgress(0);
        }
    };

    const handleSelectUpload = () => {
        if (avatar.isUploadedVoice) return;
        if (uploadedAudioUrl) {
            setAvatarField('isUploadedVoice', true);
            setAvatarField('voicePath', getUploadedVoicePath());
        }
    };

    const canProceed = () => {
        return Boolean(avatar.voicePath);
    };

    const stepLocked = () => Boolean(savedVoicePathRef.current);

    const nextStep = async () => {
        if (!canProceed()) return;
        try {
            if (!stepLocked()) {
                const payload: Partial<Avatar> = {
                    voicePath: avatar.voicePath,
                    isUploadedVoice: avatar.isUploadedVoice
                };
                await updateAvatar(newAvatarData.avatarId, payload);
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
        if (avatar.type === AvatarTypes.digitalTwin) {
            navigate('/avatar/create/twin-id-photos');
        } else {
            navigate('/avatar/create/synthetic-id-photos');
        }
    }

    const showUploadedState = avatar.isUploadedVoice || !!uploadedAudioUrl;
    const hasUploadedAudio = !!uploadedAudioUrl;

    return (
        <>
            <CreateAvatarStepper step={2}/>

            {pageLoading ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <span className="loading loading-spinner loading-xl text-primary scale-150"></span>
                </div>
            ) : (
                <div className="max-w-6xl mx-auto px-4 pt-12 pb-40">
                    <div className="flex flex-col gap-2">

                        {/* ── Upload Row ── */}
                        <div
                            onClick={() => {
                                if (stepLocked()) return;
                                if (hasUploadedAudio) {
                                    handleSelectUpload();
                                } else {
                                    fileInputRef.current?.click();
                                }
                            }}
                            onDragOver={(e) => { if (stepLocked()) return; e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setIsDragging(false);
                                if (stepLocked()) return;
                                const file = e.dataTransfer.files?.[0];
                                if (file) handleFileChange(file);
                            }}
                            className={`
                                flex items-center gap-4 p-5 rounded-2xl transition-all duration-300
                                ${stepLocked() ? 'cursor-default opacity-60' : 'cursor-pointer'}
                                ${isDragging
                                    ? 'border border-primary bg-primary/5 scale-[1.01]'
                                    : avatar.isUploadedVoice
                                        ? 'border border-primary/30 bg-primary/5'
                                        : 'border border-transparent bg-base-100 hover:bg-primary/5'
                                }
                            `}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".mp3,audio/mpeg"
                                className="hidden"
                                disabled={stepLocked()}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileChange(file);
                                    e.target.value = '';
                                }}
                            />

                            {/* Radio dot */}
                            <div className={`
                                w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0
                                transition-all duration-300
                                ${avatar.isUploadedVoice ? 'border-primary bg-primary' : 'border-base-content/20'}
                            `}>
                                {avatar.isUploadedVoice && <Check size={13} strokeWidth={3} className="text-primary-content" />}
                            </div>

                            {/* Icon */}
                            <div className={`
                                w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                                transition-all duration-300
                                ${avatar.isUploadedVoice ? 'bg-primary/10' : 'bg-base-content/5'}
                            `}>
                                {uploading
                                    ? <span className="loading loading-spinner loading-sm text-primary" />
                                    : showUploadedState
                                        ? <Music size={18} className={avatar.isUploadedVoice ? 'text-primary' : 'text-base-content/40'} />
                                        : <Upload size={18} className={isDragging ? 'text-primary' : 'text-base-content/40'} />
                                }
                            </div>

                            {/* Label */}
                            <div className={`flex flex-col gap-0.5 min-w-0 ${showUploadedState ? 'shrink-0' : 'flex-1'}`}>
                                <span className="text-sm tracking-tight">
                                    {showUploadedState ? 'Voice uploaded' : 'Upload your voice'}
                                </span>
                                <span className="text-[11px] text-base-content/40 uppercase tracking-wider">
                                    {showUploadedState
                                        ? (avatar.isUploadedVoice ? 'Selected · click to replace' : 'Click to select · or replace')
                                        : '.mp3 file 30 seconds'
                                    }
                                </span>
                                {uploadError && (
                                    <span className="text-[11px] text-error mt-0.5 normal-case tracking-normal">
                                        {uploadError}
                                    </span>
                                )}
                            </div>

                            {/* Progress bar + play (when audio is ready) */}
                            {showUploadedState && (
                                <>
                                    <div className="flex-1 h-2 rounded-full bg-base-content/10 overflow-hidden mx-1">
                                        <div
                                            className="h-full bg-primary rounded-full"
                                            style={{ width: `${playingId === 'uploaded' ? audioProgress : 0}%` }}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (uploadedAudioUrl) playAudio('uploaded', uploadedAudioUrl);
                                        }}
                                        disabled={!uploadedAudioUrl}
                                        className={`
                                            w-11 h-11 rounded-full flex items-center justify-center shrink-0
                                            cursor-pointer transition-all duration-200
                                            ${!uploadedAudioUrl ? 'opacity-40 cursor-default' : ''}
                                            ${playingId === 'uploaded'
                                                ? 'bg-primary/10 text-primary'
                                                : 'bg-base-content/5 hover:bg-primary/10 text-base-content/50 hover:text-primary'
                                            }
                                        `}
                                    >
                                        {!uploadedAudioUrl || loadingId === 'uploaded'
                                            ? <span className="loading loading-spinner loading-xs" />
                                            : playingId === 'uploaded'
                                                ? <Pause size={17} />
                                                : <Play size={17} className="ml-0.5" />
                                        }
                                    </button>
                                    <button
                                        type="button"
                                        disabled={stepLocked()}
                                        onClick={(e) => { e.stopPropagation(); handleRemoveUpload(); }}
                                        className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 cursor-pointer bg-base-content/5 hover:bg-error/10 text-base-content/30 hover:text-error transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* ── OR Divider ── */}
                        <div className="flex items-center gap-4 py-3 px-1">
                            <div className="flex-1 h-px bg-base-content/5" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-base-content/20">or</span>
                            <div className="flex-1 h-px bg-base-content/5" />
                        </div>

                        {/* ── Voice List ── */}
                        {voices.length === 0 ? (
                            <div className="flex items-center justify-center py-16">
                                <span className="loading loading-spinner loading-md text-base-content/20" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-5">
                                {voices.map((voice) => {
                                    const isSelected = avatar.voicePath === voice.audioPath;
                                    const isPlaying = playingId === voice.id;

                                    return (
                                        <div
                                            key={voice.id}
                                            className={`
                                                relative rounded-2xl
                                                transition-all duration-300
                                                ${stepLocked() ? 'opacity-60' : ''}
                                                ${isSelected
                                                    ? 'border border-primary/30 bg-primary/5'
                                                    : `border border-transparent bg-base-100 ${!stepLocked() ? 'hover:bg-primary/5' : ''}`
                                                }
                                            `}
                                        >
                                            {/* Tags — absolute, top center, out of flow */}
                                            <div className="absolute top-1 inset-x-0 flex justify-center gap-1 pointer-events-none">
                                                {voice.languages?.slice(0, 2).map((l) => (
                                                    <span
                                                        key={l}
                                                        className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-primary/5 text-primary/60"
                                                    >
                                                        {l}
                                                    </span>
                                                ))}
                                                {voice.features?.slice(0, 3).map((f) => (
                                                    <span
                                                        key={f}
                                                        className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-base-content/5 text-base-content/40"
                                                    >
                                                        {f}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Content row — determines card height, items centered */}
                                            <div
                                                className="flex items-center gap-4 p-5"
                                                style={{ gridTemplateColumns: 'auto 8rem 1fr auto' }}
                                            >

                                            {/* Radio dot */}
                                            <button
                                                type="button"
                                                onClick={() => !stepLocked() && handleSelectVoice(voice)}
                                                disabled={stepLocked()}
                                                className={`
                                                    w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0
                                                    transition-all duration-300
                                                    ${stepLocked() ? 'cursor-default' : 'cursor-pointer'}
                                                    ${isSelected
                                                        ? 'border-primary bg-primary'
                                                        : `border-base-content/20 ${!stepLocked() ? 'hover:border-primary/50' : ''}`
                                                    }
                                                `}
                                            >
                                                {isSelected && <Check size={13} strokeWidth={3} className="text-primary-content" />}
                                            </button>

                                            {/* Voice name */}
                                            <div
                                                className={`w-20 shrink-0 min-w-0 ${!stepLocked() ? 'cursor-pointer' : 'cursor-default'}`}
                                                onClick={() => !stepLocked() && handleSelectVoice(voice)}
                                            >
                                                <span className="text-sm tracking-tight truncate block">{voice.name}</span>
                                            </div>

                                            {/* Progress bar */}
                                            <div className="flex-1 h-2 rounded-full bg-base-content/10 overflow-hidden mx-1">
                                                <div
                                                    className="h-full bg-primary rounded-full"
                                                    style={{ width: `${isPlaying ? audioProgress : 0}%` }}
                                                />
                                            </div>

                                            {/* Play button */}
                                            <button
                                                type="button"
                                                onClick={() => playAudio(voice.id)}
                                                className={`
                                                    w-11 h-11 rounded-full flex items-center justify-center shrink-0
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
                                                        ? <Pause size={17} />
                                                        : <Play size={17} className="ml-0.5" />
                                                }
                                            </button>
                                            </div>
                                        </div>
                                    );
                                })}
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
