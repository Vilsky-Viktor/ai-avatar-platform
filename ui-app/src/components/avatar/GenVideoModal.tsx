import { useState, useEffect, useRef, forwardRef } from 'react';
import Loading from '../Loading';
import { Sparkles, ImagePlus, Trash2, Mic, Square, RotateCcw, Check, Images, Film, Volume2 } from 'lucide-react';
import type { Avatar } from '@loom24/shared/types';
import { MIN_VIDEO_DURATION_SEC, MAX_VIDEO_DURATION_SEC, MAX_VIDEO_AUDIO_RECORDING_SEC, MAX_VIDEO_AUDIO_TEXT_CHARS, MIN_PROMPT_TEXT_CHARS, MAX_PROMPT_TEXT_CHARS, MIN_AUDIO_TEXT_CHARS } from '@loom24/shared/types';
import type { VideoRatio } from '../../types/image';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useApp } from '../../providers/ContextProvider';
import MediaSelectorModal from '../mediaSelector/MediaSelectorModal';
import { uploadBlobToBucket } from '../../services/storage';
import { convertBlobToWav } from '../../utils/audioConverter';


function renderHighlighted(text: string) {
    const display = text.endsWith('\n') ? text + ' ' : text;
    return display.split(/(\[[^\]]+\])/g).map((part, idx) =>
        /^\[[^\]]+\]$/.test(part)
            ? <span key={idx} className="bg-primary/20 text-primary rounded">{part}</span>
            : <span key={idx}>{part}</span>
    );
}

type PromptTextareaProps = {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    maxLength: number;
    placeholder?: string;
    rows?: number;
    autoFocus?: boolean;
    onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    className?: string;
};

const PromptTextarea = forwardRef<HTMLTextAreaElement, PromptTextareaProps>(
    ({ value, onChange, maxLength, placeholder, rows, autoFocus, onKeyDown, className }, ref) => {
        const overlayRef = useRef<HTMLDivElement>(null);
        const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
            if (overlayRef.current) overlayRef.current.scrollTop = e.currentTarget.scrollTop;
        };
        return (
            <div className={`flex flex-col bg-base-200/50 border border-base-content/10 rounded-2xl focus-within:border-primary/40 transition-colors ${className ?? ''}`}>
                <div className="relative flex-1 min-h-0">
                    <div
                        ref={overlayRef}
                        aria-hidden
                        className="absolute inset-0 px-5 pt-4 pb-2 text-sm whitespace-pre-wrap break-words pointer-events-none overflow-hidden"
                    >
                        {renderHighlighted(value)}
                    </div>
                    <textarea
                        ref={ref}
                        value={value}
                        onChange={onChange}
                        onKeyDown={onKeyDown}
                        onScroll={handleScroll}
                        placeholder={placeholder}
                        rows={rows}
                        autoFocus={autoFocus}
                        maxLength={maxLength}
                        className="relative w-full h-full bg-transparent px-5 pt-4 pb-2 text-sm text-transparent caret-base-content placeholder:text-base-content/25 resize-none focus:outline-none"
                    />
                </div>
                <span className={`text-center text-[10px] tabular-nums pt-2 pb-2.5 border-t transition-colors ${value.length >= maxLength ? 'text-error border-error/20' : 'text-base-content/25 border-base-content/8'}`}>
                    {value.length}/{maxLength}
                </span>
            </div>
        );
    }
);

PromptTextarea.displayName = 'PromptTextarea';

type VoiceMode = 'text' | 'record';
type ModalMode = 'gen-video' | 'mimic-motion';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    avatar?: Avatar;
    onGenerate: (prompt: string, ratio: VideoRatio, referenceImagePath: string | null, durationSec: number, audioText: string | null, audioPath: string | null, objectPhotoPaths: string[]) => Promise<void>;
    onMimicMotion: (imagePath: string, videoPath: string, keepOriginalAudio: boolean) => Promise<void>;
};


function GenVideoModal({ isOpen, onClose, avatar, onGenerate, onMimicMotion }: Props) {
    const { user } = useApp();

    const [modalMode, setModalMode] = useState<ModalMode>('gen-video');

    // mimic motion state
    const [mimicVideoPath, setMimicVideoPath] = useState<string | null>(null);
    const [mimicVideoPreviewUrl, setMimicVideoPreviewUrl] = useState<string | null>(null);
    const [mimicVideoUploading, setMimicVideoUploading] = useState(false);
    const [mimicImagePath, setMimicImagePath] = useState<string | null>(null);
    const [mimicImageUrl, setMimicImageUrl] = useState<string | null>(null);
    const [mimicImageThumbnailUrl, setMimicImageThumbnailUrl] = useState<string | null>(null);
    const [keepOriginalAudio, setKeepOriginalAudio] = useState(false);
    const [mimicSelectorOpen, setMimicSelectorOpen] = useState(false);

    const [prompt, setPrompt] = useState('');
    const [ratio, setRatio] = useState<VideoRatio>('9:16');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<{ path: string; url: string; thumbnailUrl?: string } | null>(null);
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [durationSec, setLengthSec] = useState(5);
    const [generateVoice, setGenerateVoice] = useState(false);
    const [voiceMode, setVoiceMode] = useState<VoiceMode>('text');
    const [audioText, setAudioText] = useState('');

    // recording state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
    const [isConverting, setIsConverting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedAudioPath, setUploadedAudioPath] = useState<string | null>(null);

    const [objectPhotosEnabled, setObjectPhotosEnabled] = useState(false);
    const [objectPhotoSlots, setObjectPhotoSlots] = useState<(string | null)[]>([null, null, null, null]);
    const [objectPhotoPreviews, setObjectPhotoPreviews] = useState<(string | null)[]>([null, null, null, null]);
    const [objectPhotoUploading, setObjectPhotoUploading] = useState<boolean[]>([false, false, false, false]);

    const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const audioUploadPathRef = useRef<string | null>(null);
    const mimicVideoInputRef = useRef<HTMLInputElement>(null);
    const objInputRef0 = useRef<HTMLInputElement>(null);
    const objInputRef1 = useRef<HTMLInputElement>(null);
    const objInputRef2 = useRef<HTMLInputElement>(null);
    const objInputRef3 = useRef<HTMLInputElement>(null);
    const objectPhotoInputRefs = [objInputRef0, objInputRef1, objInputRef2, objInputRef3];

    useEffect(() => {
        if (!isOpen) {
            if (mediaRecorderRef.current?.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if (autoStopRef.current) {
                clearTimeout(autoStopRef.current);
                autoStopRef.current = null;
            }
            setPrompt('');
            setSelectedImage(null);
            setGenerateVoice(false);
            setVoiceMode('text');
            setAudioText('');
            setRecordedBlob(null);
            setRecordedUrl(null);
            setUploadedAudioPath(null);
            setRecordingTime(0);
            setIsConverting(false);
            audioUploadPathRef.current = null;
            setObjectPhotosEnabled(false);
            setObjectPhotoSlots([null, null, null, null]);
            setObjectPhotoPreviews([null, null, null, null]);
            setObjectPhotoUploading([false, false, false, false]);
            setModalMode('gen-video');
            setError(null);
            setMimicVideoPath(null);
            setMimicVideoPreviewUrl(null);
            setMimicVideoUploading(false);
            setMimicImagePath(null);
            setMimicImageUrl(null);
            setKeepOriginalAudio(false);
        }
    }, [isOpen]);

    useScrollLock(isOpen);
    useEscapeKey(onClose, isOpen);
    if (!isOpen) return null;

    const canGenerate = () => {
        if (loading) return false;
        if (modalMode === 'mimic-motion') {
            return !mimicVideoUploading && mimicVideoPath !== null && mimicImagePath !== null;
        }
        if (!prompt.trim() || prompt.trim().length < MIN_PROMPT_TEXT_CHARS) return false;
        if (!selectedImage) return false;
        if (objectPhotosEnabled) {
            if (objectPhotoUploading.some(u => u)) return false;
            if (objectPhotoSlots.filter(p => p !== null).length < 2) return false;
        }
        if (generateVoice) {
            if (voiceMode === 'text') return audioText.trim().length >= MIN_AUDIO_TEXT_CHARS;
            if (voiceMode === 'record') return !isConverting && !isUploading && uploadedAudioPath !== null;
        }
        return true;
    };

    const handleGenerate = async () => {
        if (!canGenerate()) return;
        setLoading(true);
        setError(null);
        try {
            if (modalMode === 'mimic-motion') {
                await onMimicMotion(mimicImagePath!, mimicVideoPath!, keepOriginalAudio);
            } else {
                const audioTextVal = generateVoice && voiceMode === 'text' ? audioText.trim() : null;
                const audioPathVal = generateVoice && voiceMode === 'record' ? uploadedAudioPath : null;
                const objPaths = objectPhotosEnabled ? objectPhotoSlots.filter((p): p is string => p !== null) : [];
                const effectiveLengthSec = generateVoice && voiceMode === 'record' ? recordingTime : durationSec;
                await onGenerate(prompt.trim(), ratio, selectedImage?.path ?? null, effectiveLengthSec, audioTextVal, audioPathVal, objPaths);
            }
        } catch (err: any) {
            setError(err?.message ?? 'Something went wrong. Please try again.');
            console.error('Generate failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMimicVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        const previewUrl = URL.createObjectURL(file);
        setMimicVideoPreviewUrl(previewUrl);
        setMimicVideoUploading(true);
        try {
            const path = `media/${user?.id}-user/uploads/${crypto.randomUUID()}.mp4`;
            const storedPath = await uploadBlobToBucket(path, file);
            setMimicVideoPath(storedPath);
        } finally {
            setMimicVideoUploading(false);
        }
    };

    const handleObjectPhotoChange = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        const previewUrl = URL.createObjectURL(file);
        setObjectPhotoPreviews(prev => prev.map((p, i) => i === idx ? previewUrl : p));
        setObjectPhotoUploading(prev => prev.map((u, i) => i === idx ? true : u));
        try {
            const ext = file.name.split('.').pop() ?? 'jpg';
            const path = `media/${user?.id}-user/uploads/${crypto.randomUUID()}.${ext}`;
            const storedPath = await uploadBlobToBucket(path, file);
            setObjectPhotoSlots(prev => prev.map((s, i) => i === idx ? storedPath : s));
        } finally {
            setObjectPhotoUploading(prev => prev.map((u, i) => i === idx ? false : u));
        }
    };

    const insertObjectReference = () => {
        const tag = '[object1]';
        const el = promptTextareaRef.current;
        if (!el) return;
        const start = el.selectionStart ?? prompt.length;
        const end = el.selectionEnd ?? prompt.length;
        const before = prompt.slice(0, start);
        const after = prompt.slice(end);
        const separator = before.length > 0 && !before.endsWith(' ') ? ' ' : '';
        const next = `${before}${separator}${tag} ${after}`;
        setPrompt(next);
        const newCursor = before.length + separator.length + tag.length + 1;
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(newCursor, newCursor);
        });
    };

    const removeObjectPhoto = (idx: number) => {
        if (objectPhotoPreviews[idx]) URL.revokeObjectURL(objectPhotoPreviews[idx]!);
        setObjectPhotoPreviews(prev => prev.map((p, i) => i === idx ? null : p));
        setObjectPhotoSlots(prev => prev.map((s, i) => i === idx ? null : s));
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(t => t.stop());
                if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
                if (autoStopRef.current) { clearTimeout(autoStopRef.current); autoStopRef.current = null; }
                setIsRecording(false);

                const rawBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });

                // convert to wav first, then show preview
                setIsConverting(true);
                let wavBlob: Blob;
                try {
                    wavBlob = await convertBlobToWav(rawBlob);
                } finally {
                    setIsConverting(false);
                }

                const url = URL.createObjectURL(wavBlob);
                setRecordedBlob(wavBlob);
                setRecordedUrl(url);

                // auto-upload — reuse the same path for all re-recordings in this session
                setIsUploading(true);
                try {
                    if (!audioUploadPathRef.current) {
                        audioUploadPathRef.current = `media/${user?.id}-user/avatars/${avatar?.id}-avatar/audios/${crypto.randomUUID()}.wav`;
                    }
                    const storedPath = await uploadBlobToBucket(audioUploadPathRef.current, wavBlob);
                    setUploadedAudioPath(storedPath);
                } finally {
                    setIsUploading(false);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            setRecordedBlob(null);
            setRecordedUrl(null);
            setUploadedAudioPath(null);

            let elapsed = 0;
            timerRef.current = setInterval(() => {
                elapsed += 1;
                setRecordingTime(elapsed);
            }, 1000);

            autoStopRef.current = setTimeout(() => {
                if (mediaRecorderRef.current?.state === 'recording') {
                    mediaRecorderRef.current.stop();
                }
            }, MAX_VIDEO_AUDIO_RECORDING_SEC * 1000 + 300);
        } catch (err) {
            console.error('Microphone access denied:', err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (autoStopRef.current) {
            clearTimeout(autoStopRef.current);
            autoStopRef.current = null;
        }
    };

    const resetRecording = () => {
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        setRecordedBlob(null);
        setRecordedUrl(null);
        setUploadedAudioPath(null);
        setRecordingTime(0);
    };

    const formatTime = (s: number) =>
        `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    return (
        <>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="absolute inset-0 bg-base-300/60 animate-modal-backdrop" onClick={onClose} />
                <div className="relative bg-base-100 rounded-2xl border border-base-content/5 flex flex-col w-[680px] max-h-[90vh] animate-modal-card">

                    {/* Header */}
                    <div className="flex items-center gap-3 px-10 pt-10 pb-6 flex-shrink-0">
                        <span className="w-8 h-px bg-primary/50" />
                        <h3 className="text-xl uppercase tracking-[0.2em] text-base-content/70">
                            {modalMode === 'gen-video' ? 'Generate video' : 'Mimic motion'}
                        </h3>
                    </div>

                    {/* Scrollable body */}
                    <div className="flex flex-col gap-5 px-10 overflow-y-auto flex-1 pb-2">

                    {/* Mode switcher */}
                    <div className="flex w-full p-1.5 bg-base-content/5 rounded-2xl">
                        {(['gen-video', 'mimic-motion'] as ModalMode[]).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setModalMode(mode)}
                                className={`flex-1 py-3 px-4 rounded-xl text-xs uppercase tracking-[0.2em] transition-all duration-300 cursor-pointer ${
                                    modalMode === mode ? 'bg-base-100 text-primary shadow-sm scale-[1.02]' : 'text-base-content/40 hover:text-base-content/60'
                                }`}
                            >
                                {mode === 'gen-video' ? 'Gen Video' : 'Mimic Motion'}
                            </button>
                        ))}
                    </div>

                    {modalMode === 'gen-video' && (<>
                    <div className="flex gap-4">
                        <div className="flex flex-col gap-2 shrink-0">
                            <div className="group relative w-44 h-44 rounded-xl overflow-hidden border border-base-content/10">
                                {selectedImage ? (
                                    <>
                                        <img
                                            src={selectedImage.thumbnailUrl || selectedImage.url}
                                            className="w-full h-full object-cover object-top cursor-pointer"
                                            onClick={() => avatar?.id && setSelectorOpen(true)}
                                        />
                                        <button
                                            onClick={() => setSelectedImage(null)}
                                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-error transition-all cursor-pointer"
                                        >
                                            <Trash2 size={15} className="text-white" />
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => avatar?.id && setSelectorOpen(true)}
                                        className="w-full h-full flex flex-col items-center justify-center gap-2 text-base-content/30 hover:text-primary transition-all cursor-pointer border border-dashed border-base-content/20 hover:border-primary/50 rounded-xl"
                                    >
                                        <ImagePlus size={28} strokeWidth={1} />
                                        <span className="text-[11px] uppercase tracking-widest text-center leading-relaxed">Avatar Image</span>
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-1">
                            <PromptTextarea
                                ref={promptTextareaRef}
                                autoFocus
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                                placeholder={`Describe what ${avatar?.name ?? 'your avatar'} is doing...`}
                                maxLength={MAX_PROMPT_TEXT_CHARS}
                                className="flex-1"
                            />
                        </div>
                    </div>

                    {/* Length slider */}
                    {!generateVoice && <div className="relative rounded-2xl border border-base-content/10 px-6 py-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs uppercase tracking-[0.25em] text-base-content/40">Duration</span>
                            <span className="text-2xl text-primary tabular-nums leading-none">
                                {durationSec}<span className="text-sm text-base-content/30 ml-1">sec</span>
                            </span>
                        </div>
                        <div className="w-full @container">
                            <input
                                type="range"
                                min={MIN_VIDEO_DURATION_SEC}
                                max={MAX_VIDEO_DURATION_SEC}
                                step={1}
                                value={durationSec}
                                onChange={e => setLengthSec(Number(e.target.value))}
                                className="range range-primary range-sm w-full"
                            />
                        </div>
                        <div className="flex justify-between px-0.5">
                            {Array.from({ length: MAX_VIDEO_DURATION_SEC - MIN_VIDEO_DURATION_SEC + 1 }, (_, index) => index + MIN_VIDEO_DURATION_SEC).map(n => (
                                <span key={n} className={`text-[10px] tabular-nums transition-colors duration-200 ${n === durationSec ? 'text-primary' : 'text-base-content/25'}`}>{n}</span>
                            ))}
                        </div>
                    </div>}

                    {/* Object photos section */}
                    <div className={`rounded-2xl border transition-all duration-300 ${objectPhotosEnabled ? 'border-primary/30 bg-primary/[0.03]' : 'border-base-content/10'}`}>
                        <label className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer">
                            <div className="flex items-center gap-3">
                                <Images size={22} strokeWidth={1.2} className={`shrink-0 transition-colors duration-300 ${objectPhotosEnabled ? 'text-primary' : 'text-base-content/25'}`} />
                                <div>
                                    <p className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${objectPhotosEnabled ? 'text-primary' : 'text-base-content/50'}`}>Add object images</p>
                                    <p className="text-[10px] text-base-content/30 mt-0.5">Show AI the object you would like to place in the scene</p>
                                </div>
                            </div>
                            <div className={`relative w-9 h-5 rounded-full transition-colors duration-300 shrink-0 ${objectPhotosEnabled ? 'bg-primary/30' : 'bg-base-content/10'}`}>
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 ${objectPhotosEnabled ? 'left-[18px] bg-primary' : 'left-0.5 bg-base-content/30'}`} />
                            </div>
                            <input type="checkbox" checked={objectPhotosEnabled} onChange={e => setObjectPhotosEnabled(e.target.checked)} className="hidden" />
                        </label>

                        {objectPhotosEnabled && (
                            <div className="px-5 pb-5">
                                <p className="text-[11px] text-base-content/30 leading-relaxed mb-4">
                                    Upload 2–4 photos of the same object from different angles. The AI will be able to understand its proportions in 3D. The first image is the main one.
                                </p>
                                <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr] gap-3 mb-4">
                                    {[0, 1, 2, 3].map(idx => (
                                        <div key={idx} className={`group relative aspect-square rounded-xl overflow-hidden border transition-colors duration-300 ${idx === 0 ? 'border-primary/20' : 'border-base-content/10'}`}>
                                            {objectPhotoPreviews[idx] ? (
                                                <>
                                                    <img
                                                        src={objectPhotoPreviews[idx]!}
                                                        onClick={() => insertObjectReference()}
                                                        className="w-full h-full object-cover object-top cursor-pointer"
                                                    />
                                                    {objectPhotoUploading[idx] && (
                                                        <div className="absolute inset-0 bg-base-100/60 flex items-center justify-center">
                                                            <Loading size="xs" className="" />
                                                        </div>
                                                    )}
                                                    {idx === 0 && (
                                                        <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-white text-[10px] uppercase tracking-widest pointer-events-none">
                                                            object 1
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={() => removeObjectPhoto(idx)}
                                                        className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-error transition-all cursor-pointer"
                                                    >
                                                        <Trash2 size={13} className="text-white" />
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => objectPhotoInputRefs[idx].current?.click()}
                                                    className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-base-content/30 hover:text-primary transition-all cursor-pointer border border-dashed border-base-content/20 hover:border-primary/50 rounded-xl"
                                                >
                                                    <ImagePlus size={30} strokeWidth={1} />
                                                </button>
                                            )}
                                            <input
                                                ref={objectPhotoInputRefs[idx]}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={e => handleObjectPhotoChange(idx, e)}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => insertObjectReference()}
                                    className="text-[10px] uppercase tracking-[0.2em] text-base-content/40 hover:text-primary transition-colors cursor-pointer"
                                >
                                    + Add object to prompt
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Generate voice section */}
                    <div className={`rounded-2xl border transition-all duration-300 ${generateVoice ? 'border-primary/30 bg-primary/[0.03]' : 'border-base-content/10'}`}>
                        <label className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer">
                            <div className="flex items-center gap-3">
                                <Mic size={22} strokeWidth={1.2} className={`shrink-0 transition-colors duration-300 ${generateVoice ? 'text-primary' : 'text-base-content/25'}`} />
                                <div>
                                    <p className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${generateVoice ? 'text-primary' : 'text-base-content/50'}`}>Add voice</p>
                                    <p className="text-[10px] text-base-content/30 mt-0.5">Add avatar speech to the video</p>
                                </div>
                            </div>
                            <div className={`relative w-9 h-5 rounded-full transition-colors duration-300 shrink-0 ${generateVoice ? 'bg-primary/30' : 'bg-base-content/10'}`}>
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 ${generateVoice ? 'left-[18px] bg-primary' : 'left-0.5 bg-base-content/30'}`} />
                            </div>
                            <input type="checkbox" checked={generateVoice} onChange={e => setGenerateVoice(e.target.checked)} className="hidden" />
                        </label>

                        {generateVoice && (
                            <div className="px-5 pb-5 flex flex-col gap-4">
                                {/* Mode tabs */}
                                <div className="flex w-full p-1 bg-base-content/5 rounded-xl">
                                    {(['text', 'record'] as VoiceMode[]).map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => {
                                                setVoiceMode(mode);
                                                if (mode === 'text') {
                                                    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
                                                    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
                                                    setIsRecording(false);
                                                    setRecordedBlob(null);
                                                    setRecordedUrl(null);
                                                    setUploadedAudioPath(null);
                                                    setRecordingTime(0);
                                                    audioUploadPathRef.current = null;
                                                } else {
                                                    setAudioText('');
                                                }
                                            }}
                                            className={`flex-1 py-2 px-4 rounded-lg text-[10px]  uppercase tracking-[0.2em] transition-all duration-300 cursor-pointer ${
                                                voiceMode === mode
                                                    ? 'bg-base-100 text-primary shadow-sm scale-[1.02]'
                                                    : 'text-base-content/40 hover:text-base-content/60'
                                            }`}
                                        >
                                            {mode === 'text' ? 'Type text' : 'Record voice'}
                                        </button>
                                    ))}
                                </div>

                                {voiceMode === 'text' && (
                                    <>
                                    <PromptTextarea
                                        autoFocus
                                        value={audioText}
                                        onChange={e => setAudioText(e.target.value)}
                                        placeholder={`Write what you want ${avatar?.name ?? 'your avatar'} to say in the video...`}
                                        rows={3}
                                        maxLength={MAX_VIDEO_AUDIO_TEXT_CHARS}
                                    />
                                    <p className="text-[11px] text-base-content/30 leading-relaxed">
                                        Use <span className="font-mono text-base-content/40">[tags]</span> to add emotions, actions or sounds — e.g. <span className="font-mono text-base-content/40">[excited]</span>, <span className="font-mono text-base-content/40">[laughs]</span>, <span className="font-mono text-base-content/40">[whispers]</span>.
                                    </p>
                                    </>
                                )}

                                {voiceMode === 'record' && (
                                    <div className="flex flex-col items-center gap-4 py-2">
                                        {!isRecording && !recordedBlob && (
                                            <button
                                                onClick={startRecording}
                                                className="w-16 h-16 rounded-full bg-error/10 border border-error/30 hover:bg-error/20 flex items-center justify-center transition-all cursor-pointer"
                                            >
                                                <Mic size={26} className="text-error" />
                                            </button>
                                        )}

                                        {isRecording && (
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse" />
                                                    <span className="font-mono text-sm text-base-content/70">{formatTime(recordingTime)}</span>
                                                    <span className="text-[10px] text-base-content/30">/ {formatTime(MAX_VIDEO_AUDIO_RECORDING_SEC)}</span>
                                                </div>
                                                <button
                                                    onClick={stopRecording}
                                                    className="w-12 h-12 rounded-full bg-error/10 border border-error/30 hover:bg-error/20 flex items-center justify-center transition-all cursor-pointer"
                                                >
                                                    <Square size={18} className="text-error fill-error" />
                                                </button>
                                            </div>
                                        )}

                                        {recordedBlob && recordedUrl && (
                                            <div className="w-full flex flex-col gap-3">
                                                <audio src={recordedUrl} controls className="w-full" />
                                                <div className="flex items-center justify-between">
                                                    <button
                                                        onClick={resetRecording}
                                                        className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-base-content/40 hover:text-base-content/70 transition-colors cursor-pointer"
                                                    >
                                                        <RotateCcw size={12} />
                                                        Re-record
                                                    </button>
                                                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em]">
                                                        {isConverting && (
                                                            <>
                                                                <Loading size="xs" color="text-base-content/40" className="" />
                                                                <span className="text-base-content/40">Converting…</span>
                                                            </>
                                                        )}
                                                        {!isConverting && isUploading && (
                                                            <>
                                                                <Loading size="xs" color="text-base-content/40" className="" />
                                                                <span className="text-base-content/40">Uploading…</span>
                                                            </>
                                                        )}
                                                        {!isConverting && !isUploading && uploadedAudioPath && (
                                                            <>
                                                                <Check size={12} className="text-success" />
                                                                <span className="text-success">Ready</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    </>)}

                    {modalMode === 'mimic-motion' && (
                        <div className="flex flex-col gap-5">
                            <div className="flex gap-4">
                                {/* Video reference */}
                                <div className="flex-1">
                                <div className="group relative aspect-square rounded-xl overflow-hidden border border-base-content/10">
                                    {mimicVideoPreviewUrl ? (
                                        <>
                                            <video src={mimicVideoPreviewUrl} muted loop playsInline className="w-full h-full object-cover" />
                                            {mimicVideoUploading && (
                                                <div className="absolute inset-0 bg-base-100/60 flex items-center justify-center">
                                                    <Loading size="sm" className="" />
                                                </div>
                                            )}
                                            <button
                                                onClick={() => { setMimicVideoPath(null); setMimicVideoPreviewUrl(null); }}
                                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-error transition-all cursor-pointer"
                                            >
                                                <Trash2 size={15} className="text-white" />
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => mimicVideoInputRef.current?.click()}
                                            className="w-full h-full flex flex-col items-center justify-center gap-2 text-base-content/30 hover:text-primary transition-all cursor-pointer border border-dashed border-base-content/20 hover:border-primary/50 rounded-xl"
                                        >
                                            <Film size={40} strokeWidth={1} />
                                            <span className="text-[11px] uppercase tracking-widest text-center leading-relaxed">Reference<br/>Video</span>
                                        </button>
                                    )}
                                    <input ref={mimicVideoInputRef} type="file" accept="video/*" className="hidden" onChange={handleMimicVideoChange} />
                                </div>
                                </div>

                                {/* Image reference */}
                                <div className="flex-1">
                                <div className="group relative aspect-square rounded-xl overflow-hidden border border-base-content/10">
                                    {mimicImageUrl ? (
                                        <>
                                            <img src={mimicImageThumbnailUrl || mimicImageUrl} className="w-full h-full object-cover object-top" />
                                            <button
                                                onClick={() => { setMimicImagePath(null); setMimicImageUrl(null); }}
                                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-error transition-all cursor-pointer"
                                            >
                                                <Trash2 size={15} className="text-white" />
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setMimicSelectorOpen(true)}
                                            className="w-full h-full flex flex-col items-center justify-center gap-2 text-base-content/30 hover:text-primary transition-all cursor-pointer border border-dashed border-base-content/20 hover:border-primary/50 rounded-xl"
                                        >
                                            <ImagePlus size={40} strokeWidth={1} />
                                            <span className="text-[11px] uppercase tracking-widest text-center leading-relaxed">Avatar<br/>Image</span>
                                        </button>
                                    )}
                                </div>
                                </div>
                            </div>

                            <div className={`rounded-2xl border transition-all duration-300 ${keepOriginalAudio ? 'border-primary/30 bg-primary/[0.03]' : 'border-base-content/10'}`}>
                                <label className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <Volume2 size={22} strokeWidth={1.2} className={`shrink-0 transition-colors duration-300 ${keepOriginalAudio ? 'text-primary' : 'text-base-content/25'}`} />
                                        <div>
                                            <p className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${keepOriginalAudio ? 'text-primary' : 'text-base-content/50'}`}>Keep original audio</p>
                                            <p className="text-[10px] text-base-content/30 mt-0.5">Preserve the audio from the reference video</p>
                                        </div>
                                    </div>
                                    <div className={`relative w-9 h-5 rounded-full transition-colors duration-300 shrink-0 ${keepOriginalAudio ? 'bg-primary/30' : 'bg-base-content/10'}`}>
                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 ${keepOriginalAudio ? 'left-[18px] bg-primary' : 'left-0.5 bg-base-content/30'}`} />
                                    </div>
                                    <input type="checkbox" checked={keepOriginalAudio} onChange={e => setKeepOriginalAudio(e.target.checked)} className="hidden" />
                                </label>
                            </div>
                        </div>
                    )}

                    {error && (
                        <p className="text-xs text-error">{error}</p>
                    )}

                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-10 py-6 flex-shrink-0">
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

            <MediaSelectorModal
                isOpen={selectorOpen}
                onClose={() => setSelectorOpen(false)}
                avatarId={avatar?.id ?? ''}
                onSelect={(path, url, imageRatio, thumbnailUrl) => {
                    setSelectedImage({ path, url, thumbnailUrl });
                    setRatio(imageRatio);
                }}
            />
            <MediaSelectorModal
                isOpen={mimicSelectorOpen}
                onClose={() => setMimicSelectorOpen(false)}
                avatarId={avatar?.id ?? ''}
                title="Select Avatar Image"
                onSelect={(path, url, _ratio, thumbnailUrl) => {
                    setMimicImagePath(path);
                    setMimicImageUrl(url);
                    setMimicImageThumbnailUrl(thumbnailUrl ?? null);
                }}
            />
        </>
    );
}

export default GenVideoModal;
