import { useState, useEffect, useRef } from 'react';
import CreateAvatarStepper from "../../components/createAvatar/CreateAvatarStepper";
import { useNavigate } from 'react-router-dom';
import BottomDock from '../../components/createAvatar/BottomDock';
import { useApp } from '../../providers/ContextProvider';
import {
    GENERAL_STORAGE_KEY,
    VOICE_STORAGE_KEY,
    getLocalStorageData,
    saveLocalStorageData,
} from '../../utils/avatarCreation';
import { type GeneralStepData, type VoiceStepData } from "../../types/avatarCreation";
import { AvatarStatus, type Avatar } from '../../types/avatar';
import { updateAvatar, getVoicesByGender } from '../../services/apiGateway';
import type { Voice } from '../../types/voice';
import { uploadMediaToBucket, getMediaUrlFromPath } from '../../services/storage';
import { Upload, Play, Pause, Check, Music } from 'lucide-react';

function AssignVoicePage() {
    const navigate = useNavigate();
    const { user } = useApp();

    const [generalData] = useState(() => getLocalStorageData<GeneralStepData>(GENERAL_STORAGE_KEY));
    const [stepData, setStepData] = useState(() => getLocalStorageData<VoiceStepData>(VOICE_STORAGE_KEY));
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
        getVoices();
        if (stepData.uploaded && stepData.mediaPath) {
            getMediaUrlFromPath(stepData.mediaPath).then(setUploadedAudioUrl);
        }
        return () => { audioRef.current?.pause(); stopRaf(); };
    }, []);

    useEffect(() => {
        saveLocalStorageData<VoiceStepData>(VOICE_STORAGE_KEY, stepData);
    }, [stepData]);

    const getVoices = async () => {
        const voices = await getVoicesByGender(generalData.parameters.gender);
        setVoices(voices);
    }

    const uploadToBucket = async (voice: string) => {
        const mediaPath = `media/${user?.id}-user/avatars/${generalData.avatarId}-avatar/voices/voice.mp3`;
        await uploadMediaToBucket(mediaPath, voice);
        setStepData(prev => ({ ...prev, uploaded: true, mediaPath, selectedId: null }));
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
        setStepData(prev => ({
            ...prev,
            selectedId: voice.id,
            mediaPath: voice.audioPath,
            uploaded: false,
        }));
    };

    const handleSelectUpload = () => {
        if (stepData.uploaded) return;
        if (uploadedAudioUrl) {
            setStepData(prev => ({ ...prev, uploaded: true, selectedId: null }));
        }
    };

    const canProceed = () => stepData.uploaded || !!stepData.selectedId;

    const nextStep = async () => {
        if (!canProceed()) return;
        try {
            if (!stepData.finished) {
                const payload: Partial<Avatar> = {
                    status: AvatarStatus.voiceAssigned,
                    voicePath: stepData.mediaPath,
                };
                await updateAvatar(generalData.avatarId, payload);
                setFinished();
            }
            navigate('/avatar/create/training');
        } catch (error) {
            console.log(`Did not manage to update avatar: ${error}`);
        }
    }

    const setFinished = () => {
        setStepData((prev: VoiceStepData) => ({ ...prev, finished: true }));
    }

    const previousStep = () => {
        navigate('/avatar/create/photo-set');
    }

    const isFinished = stepData.finished;
    const isUploadSelected = stepData.uploaded;
    // True immediately on reload (from localStorage), even before the URL is fetched
    const showUploadedState = stepData.uploaded || !!uploadedAudioUrl;
    const hasUploadedAudio = !!uploadedAudioUrl;

    return (
        <>
            <CreateAvatarStepper step={3}/>

            <div className="max-w-6xl mx-auto px-4 pt-12 pb-40">
                <div className="flex flex-col gap-2">

                    {/* ── Upload Row ── */}
                    <div
                        onClick={() => {
                            if (isFinished) return;
                            if (hasUploadedAudio) {
                                handleSelectUpload();
                            } else {
                                fileInputRef.current?.click();
                            }
                        }}
                        onDragOver={(e) => { if (isFinished) return; e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            if (isFinished) return;
                            const file = e.dataTransfer.files?.[0];
                            if (file) handleFileChange(file);
                        }}
                        className={`
                            flex items-center gap-4 p-5 rounded-2xl transition-all duration-300
                            ${isFinished ? 'cursor-default opacity-60' : 'cursor-pointer'}
                            ${isDragging
                                ? 'border border-primary bg-primary/5 scale-[1.01]'
                                : isUploadSelected
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
                            disabled={isFinished}
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
                            ${isUploadSelected ? 'border-primary bg-primary' : 'border-base-content/20'}
                        `}>
                            {isUploadSelected && <Check size={13} strokeWidth={3} className="text-primary-content" />}
                        </div>

                        {/* Icon */}
                        <div className={`
                            w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                            transition-all duration-300
                            ${isUploadSelected ? 'bg-primary/10' : 'bg-base-content/5'}
                        `}>
                            {uploading
                                ? <span className="loading loading-spinner loading-sm text-primary" />
                                : showUploadedState
                                    ? <Music size={18} className={isUploadSelected ? 'text-primary' : 'text-base-content/40'} />
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
                                    ? (isUploadSelected ? 'Selected · click to replace' : 'Click to select · or replace')
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
                                        transition-all duration-200
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
                                const isSelected = stepData.selectedId === voice.id;
                                const isPlaying = playingId === voice.id;

                                return (
                                    <div
                                        key={voice.id}
                                        className={`
                                            relative rounded-2xl
                                            transition-all duration-300
                                            ${isFinished ? 'opacity-60' : ''}
                                            ${isSelected
                                                ? 'border border-primary/30 bg-primary/5'
                                                : `border border-transparent bg-base-100 ${!isFinished ? 'hover:bg-primary/5' : ''}`
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
                                            onClick={() => !isFinished && handleSelectVoice(voice)}
                                            disabled={isFinished}
                                            className={`
                                                w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0
                                                transition-all duration-300
                                                ${isFinished ? 'cursor-default' : 'cursor-pointer'}
                                                ${isSelected
                                                    ? 'border-primary bg-primary'
                                                    : `border-base-content/20 ${!isFinished ? 'hover:border-primary/50' : ''}`
                                                }
                                            `}
                                        >
                                            {isSelected && <Check size={13} strokeWidth={3} className="text-primary-content" />}
                                        </button>

                                        {/* Voice name */}
                                        <div
                                            className={`w-20 shrink-0 min-w-0 ${!isFinished ? 'cursor-pointer' : 'cursor-default'}`}
                                            onClick={() => !isFinished && handleSelectVoice(voice)}
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

            <BottomDock
                avatarId={generalData.avatarId}
                canProceed={canProceed}
                nextStep={nextStep}
                previousStep={previousStep}
                finish={false}
            />
        </>
    );
}

export default AssignVoicePage;
