import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, ImagePlus, Trash2, Clock, Mic, Square, RotateCcw, Check, Loader2, Images, Film, Volume2 } from 'lucide-react';
import type { Avatar } from '@loom24/shared/types';
import type { VideoRatio } from '../../types/image';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useApp } from '../../providers/ContextProvider';
import MediaSelectorModal from '../mediaSelector/MediaSelectorModal';
import type { Job } from '@loom24/shared/types';
import { uploadBlobToBucket } from '../../services/storage';
import { convertBlobToWav } from '../../utils/audioConverter';

type VoiceMode = 'text' | 'record';
type ModalMode = 'gen-video' | 'mimic-motion';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    avatar?: Avatar;
    jobs: Job[];
    onGenerate: (prompt: string, ratio: VideoRatio, referenceImagePath: string | null, lengthSec: number, audioText: string | null, audioPath: string | null, objectPhotoPaths: string[]) => Promise<void>;
    onMimicMotion: (imagePath: string, videoPath: string, keepOriginalAudio: boolean) => Promise<void>;
};

function GenVideoModal({ isOpen, onClose, avatar, jobs, onGenerate, onMimicMotion }: Props) {
    const { user } = useApp();

    const [modalMode, setModalMode] = useState<ModalMode>('gen-video');

    // mimic motion state
    const [mimicVideoPath, setMimicVideoPath] = useState<string | null>(null);
    const [mimicVideoPreviewUrl, setMimicVideoPreviewUrl] = useState<string | null>(null);
    const [mimicVideoUploading, setMimicVideoUploading] = useState(false);
    const [mimicImagePath, setMimicImagePath] = useState<string | null>(null);
    const [mimicImageUrl, setMimicImageUrl] = useState<string | null>(null);
    const [keepOriginalAudio, setKeepOriginalAudio] = useState(false);
    const [mimicSelectorOpen, setMimicSelectorOpen] = useState(false);

    const [prompt, setPrompt] = useState('');
    const [ratio, setRatio] = useState<VideoRatio>('9:16');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<{ path: string; url: string } | null>(null);
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [lengthSec, setLengthSec] = useState(3);
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

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
    if (!isOpen) return null;

    const canGenerate = () => {
        if (loading) return false;
        if (modalMode === 'mimic-motion') {
            return !mimicVideoUploading && mimicVideoPath !== null && mimicImagePath !== null;
        }
        if (!prompt.trim() || prompt.trim().length < 5) return false;
        if (!selectedImage) return false;
        if (objectPhotosEnabled) {
            if (objectPhotoUploading.some(u => u)) return false;
            if (objectPhotoSlots.filter(p => p !== null).length < 2) return false;
        }
        if (generateVoice) {
            if (voiceMode === 'text') return audioText.trim().length >= 3;
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
                await onGenerate(prompt.trim(), ratio, selectedImage?.path ?? null, lengthSec, audioTextVal, audioPathVal, objPaths);
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
                if (timerRef.current) clearInterval(timerRef.current);
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

            timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
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
                <div className="relative bg-base-100 rounded-3xl shadow-2xl border border-base-content/5 flex flex-col gap-7 p-10 w-[680px] animate-modal-card">

                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 w-11 h-11 flex items-center justify-center rounded-full text-base-content/30 hover:text-base-content hover:bg-base-200 transition-all cursor-pointer"
                    >
                        <X size={25} />
                    </button>

                    {/* Mode switcher */}
                    <div className="flex w-full p-1.5 bg-base-content/5 rounded-2xl mt-8">
                        {(['gen-video', 'mimic-motion'] as ModalMode[]).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setModalMode(mode)}
                                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 cursor-pointer ${
                                    modalMode === mode ? 'bg-base-100 text-primary shadow-sm scale-[1.02]' : 'text-base-content/40 hover:text-base-content/60'
                                }`}
                            >
                                {mode === 'gen-video' ? 'Gen Video' : 'Mimic Motion'}
                            </button>
                        ))}
                    </div>

                    {modalMode === 'gen-video' && (<>
                    <div className="flex items-start gap-4 mt-3">
                        {/* Reference image */}
                        <div className="group relative w-44 h-44 shrink-0 rounded-xl overflow-hidden border border-base-content/10">
                            {selectedImage ? (
                                <>
                                    <img
                                        src={selectedImage.url}
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

                        <textarea
                            autoFocus
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                            placeholder={`Describe what ${avatar?.name ?? 'your avatar'} is doing...`}
                            className="flex-1 h-44 bg-base-200/50 border border-base-content/10 rounded-2xl px-6 py-5 text-base text-base-content placeholder:text-base-content/25 resize-none focus:outline-none focus:border-primary/40 transition-colors"
                        />
                    </div>

                    {/* Length slider */}
                    <div className="flex items-center gap-3">
                        <Clock size={18} className="text-base-content/30 shrink-0" />
                        <input
                            type="range"
                            min={3}
                            max={10}
                            step={1}
                            value={lengthSec}
                            onChange={e => setLengthSec(Number(e.target.value))}
                            className="range range-primary range-xs flex-1"
                        />
                        <span className="text-sm font-semibold text-primary w-12 text-right shrink-0">{lengthSec} sec</span>
                    </div>

                    {/* Object photos section */}
                    <div className={`rounded-2xl border transition-all duration-300 ${objectPhotosEnabled ? 'border-primary/30 bg-primary/[0.03]' : 'border-base-content/10'}`}>
                        <label className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-300 ${objectPhotosEnabled ? 'bg-primary/10 text-primary' : 'bg-base-200 text-base-content/30'}`}>
                                    <Images size={17} />
                                </div>
                                <div>
                                    <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${objectPhotosEnabled ? 'text-primary' : 'text-base-content/50'}`}>Add object images</p>
                                    <p className="text-[10px] text-base-content/30 mt-0.5">Reference object images from different angles</p>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={objectPhotosEnabled}
                                onChange={e => setObjectPhotosEnabled(e.target.checked)}
                                className="checkbox checkbox-primary checkbox-sm"
                            />
                        </label>

                        {objectPhotosEnabled && (
                            <div className="px-5 pb-5">
                                <div className="grid grid-cols-4 gap-3 mb-4">
                                    {[0, 1, 2, 3].map(idx => (
                                        <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden border border-base-content/10">
                                            {objectPhotoPreviews[idx] ? (
                                                <>
                                                    <img src={objectPhotoPreviews[idx]!} className="w-full h-full object-cover object-top" />
                                                    {objectPhotoUploading[idx] && (
                                                        <div className="absolute inset-0 bg-base-100/60 flex items-center justify-center">
                                                            <Loader2 size={20} className="animate-spin text-primary" />
                                                        </div>
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
                                    onClick={() => setPrompt(p => p + (p.length > 0 && !p.endsWith(' ') ? ' ' : '') + '@Element1')}
                                    className="text-[10px] font-semibold uppercase tracking-[0.2em] text-base-content/40 hover:text-primary transition-colors cursor-pointer"
                                >
                                    + Add reference to prompt
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Generate voice section */}
                    <div className={`-mt-4 rounded-2xl border transition-all duration-300 ${generateVoice ? 'border-primary/30 bg-primary/[0.03]' : 'border-base-content/10'}`}>
                        <label className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-300 ${generateVoice ? 'bg-primary/10 text-primary' : 'bg-base-200 text-base-content/30'}`}>
                                    <Mic size={17} />
                                </div>
                                <div>
                                    <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${generateVoice ? 'text-primary' : 'text-base-content/50'}`}>Add voice</p>
                                    <p className="text-[10px] text-base-content/30 mt-0.5">Add avatar speech to the video</p>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={generateVoice}
                                onChange={e => setGenerateVoice(e.target.checked)}
                                className="checkbox checkbox-primary checkbox-sm"
                            />
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
                                            className={`flex-1 py-2 px-4 rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 cursor-pointer ${
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
                                    <textarea
                                        autoFocus
                                        value={audioText}
                                        onChange={e => setAudioText(e.target.value)}
                                        placeholder={`Write what you want ${avatar?.name ?? 'your avatar'} to say in the video...`}
                                        rows={3}
                                        className="w-full bg-base-200/50 border border-base-content/10 rounded-2xl px-5 py-4 text-base text-base-content placeholder:text-base-content/25 resize-none focus:outline-none focus:border-primary/40 transition-colors"
                                    />
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
                                                    <span className="font-mono text-sm font-semibold text-base-content/70">{formatTime(recordingTime)}</span>
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
                                                                <Loader2 size={12} className="animate-spin text-base-content/40" />
                                                                <span className="text-base-content/40">Converting…</span>
                                                            </>
                                                        )}
                                                        {!isConverting && isUploading && (
                                                            <>
                                                                <Loader2 size={12} className="animate-spin text-base-content/40" />
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
                        <div className="flex flex-col gap-5 mt-3">
                            <div className="flex gap-4">
                                {/* Video reference */}
                                <div className="group relative flex-1 aspect-square rounded-xl overflow-hidden border border-base-content/10">
                                    {mimicVideoPreviewUrl ? (
                                        <>
                                            <video src={mimicVideoPreviewUrl} muted loop playsInline className="w-full h-full object-cover" />
                                            {mimicVideoUploading && (
                                                <div className="absolute inset-0 bg-base-100/60 flex items-center justify-center">
                                                    <Loader2 size={24} className="animate-spin text-primary" />
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

                                {/* Image reference */}
                                <div className="group relative flex-1 aspect-square rounded-xl overflow-hidden border border-base-content/10">
                                    {mimicImageUrl ? (
                                        <>
                                            <img src={mimicImageUrl} className="w-full h-full object-cover object-top" />
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

                            <div className={`rounded-2xl border transition-all duration-300 ${keepOriginalAudio ? 'border-primary/30 bg-primary/[0.03]' : 'border-base-content/10'}`}>
                                <label className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-300 ${keepOriginalAudio ? 'bg-primary/10 text-primary' : 'bg-base-200 text-base-content/30'}`}>
                                            <Volume2 size={17} />
                                        </div>
                                        <div>
                                            <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${keepOriginalAudio ? 'text-primary' : 'text-base-content/50'}`}>Keep original audio</p>
                                            <p className="text-[10px] text-base-content/30 mt-0.5">Preserve the audio from the reference video</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={keepOriginalAudio}
                                        onChange={e => setKeepOriginalAudio(e.target.checked)}
                                        className="checkbox checkbox-primary checkbox-sm"
                                    />
                                </label>
                            </div>
                        </div>
                    )}

                    {error && (
                        <p className="text-xs text-error text-right">{error}</p>
                    )}

                    <div className="flex justify-end">
                        <button
                            onClick={handleGenerate}
                            disabled={!canGenerate()}
                            className="group flex items-center gap-3 px-7 py-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary hover:border-primary text-primary hover:text-primary-content transition-all duration-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <Sparkles size={16} className="group-hover:animate-pulse" />
                            <span className="text-sm font-semibold uppercase tracking-[0.2em]">Generate</span>
                            {loading && <span className="loading loading-spinner loading-xs" />}
                        </button>
                    </div>
                </div>
            </div>

            <MediaSelectorModal
                isOpen={selectorOpen}
                onClose={() => setSelectorOpen(false)}
                jobs={jobs}
                onSelect={(path, url, imageRatio) => {
                    setSelectedImage({ path, url });
                    setRatio(imageRatio);
                }}
            />
            <MediaSelectorModal
                isOpen={mimicSelectorOpen}
                onClose={() => setMimicSelectorOpen(false)}
                jobs={jobs}
                title="Select Avatar Image"
                onSelect={(path, url) => {
                    setMimicImagePath(path);
                    setMimicImageUrl(url);
                }}
            />
        </>
    );
}

export default GenVideoModal;
