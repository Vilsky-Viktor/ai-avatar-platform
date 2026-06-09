import { useState } from 'react';
import { HeartPulse, Repeat2, Plus, Minus, MoveRight, Image, Video, Mic } from 'lucide-react';
import { useApp } from '../providers/ContextProvider';

const PULSES_PER_DOLLAR = 127;
const PULSES_PER_IMAGE = 60;
const PULSES_PER_VIDEO_SEC = 65;
const PULSES_PER_AUDIO_SEC = 12;

const CONIC_GRADIENT = 'conic-gradient(from var(--gen-angle), transparent 0%, transparent 60%, color-mix(in oklch, var(--color-primary) 85%, transparent) 80%, transparent 100%)';

function CreditsPage() {
    const { user } = useApp();
    const [topUpDollars, setTopUpDollars] = useState(10);
    const [autoTopUpDollars, setAutoTopUpDollars] = useState(49);

    const adjustTopUp = (delta: number) => {
        setTopUpDollars(prev => Math.max(5, Math.min(5000, prev + delta)));
    };

    const adjustAutoTopUp = (delta: number) => {
        setAutoTopUpDollars(prev => Math.max(5, Math.min(5000, prev + delta)));
    };

    const autoTopUpPulses = autoTopUpDollars * PULSES_PER_DOLLAR;

    return (
        <div className="px-15 pt-12 pb-20 bg-base-200 relative">
            <div className="max-w-6xl mx-auto flex flex-col gap-12">

                <div className="flex items-center gap-3">
                    <span className="w-8 h-px bg-primary/50" />
                    <h1 className="text-xl uppercase tracking-[0.2em] text-base-content/70">Give it a pulse</h1>
                </div>

                {/* Balance + Top-up row */}
                <div className="flex items-center justify-between">

                    {/* Balance */}
                    <div className="group relative p-[1.5px] rounded-2xl">
                        <div
                            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 group-hover:animate-spin-border transition-opacity duration-300 pointer-events-none"
                            style={{ backgroundImage: CONIC_GRADIENT }}
                        />
                        <div className="relative flex items-center gap-8 px-12 py-10 rounded-2xl bg-base-100 border border-base-content/8 group-hover:border-transparent transition-colors duration-300">
                            <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-base-content/8 group-hover:border-primary/30 pointer-events-none transition-colors duration-300" />
                            <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-base-content/8 group-hover:border-primary/30 pointer-events-none transition-colors duration-300" />
                            <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-base-content/8 group-hover:border-primary/30 pointer-events-none transition-colors duration-300" />
                            <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-base-content/8 group-hover:border-primary/30 pointer-events-none transition-colors duration-300" />
                            <HeartPulse size={40} strokeWidth={0.8} className="text-error animate-heartbeat" />
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-[0.25em] text-base-content/35">Current balance</span>
                                <div className="flex items-baseline gap-2.5">
                                    <span className="text-5xl tabular-nums text-base-content/80">
                                        {(user?.credits || 0).toLocaleString('de-DE')}
                                    </span>
                                    <span className="text-sm uppercase tracking-[0.2em] text-base-content/35">pulses</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-0">
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-px bg-primary/60" />
                            <span className="text-xl uppercase tracking-[0.2em] text-base-content/80">Top it up</span>
                            <span className="w-8 h-px bg-primary/60" />
                        </div>
                        <MoveRight size={72} strokeWidth={0.6} className="text-primary/70 animate-nudge-right" />
                    </div>

                    {/* Top-up */}
                    <div className="group relative p-[1.5px] rounded-2xl w-96">
                        <div
                            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 group-hover:animate-spin-border transition-opacity duration-300 pointer-events-none"
                            style={{ backgroundImage: CONIC_GRADIENT }}
                        />
                        <div className="relative flex flex-col gap-5 p-7 rounded-2xl bg-base-100 border border-base-content/8 group-hover:border-transparent transition-colors duration-300">
                            <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-base-content/8 group-hover:border-primary/30 pointer-events-none transition-colors duration-300" />
                            <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-base-content/8 group-hover:border-primary/30 pointer-events-none transition-colors duration-300" />
                            <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-base-content/8 group-hover:border-primary/30 pointer-events-none transition-colors duration-300" />
                            <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-base-content/8 group-hover:border-primary/30 pointer-events-none transition-colors duration-300" />

                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-base-content/30">Amount · USD</span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => adjustTopUp(-5)}
                                        className="w-9 h-9 rounded-xl border border-base-content/10 flex items-center justify-center text-base-content/40 hover:border-primary/30 hover:text-primary transition-all cursor-pointer"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <input
                                        type="number"
                                        min={5}
                                        max={5000}
                                        step={5}
                                        value={topUpDollars}
                                        onChange={e => setTopUpDollars(Math.max(5, Math.min(5000, Number(e.target.value))))}
                                        className="flex-1 bg-base-200/50 border border-base-content/10 rounded-xl px-4 py-2.5 text-center text-sm tabular-nums text-base-content/80 focus:outline-none focus:border-primary/40 transition-colors"
                                    />
                                    <button
                                        onClick={() => adjustTopUp(5)}
                                        className="w-9 h-9 rounded-xl border border-base-content/10 flex items-center justify-center text-base-content/40 hover:border-primary/30 hover:text-primary transition-all cursor-pointer"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between px-1">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-base-content/30">You get</span>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-lg tabular-nums text-base-content/70">
                                        {(topUpDollars * PULSES_PER_DOLLAR).toLocaleString('de-DE')}
                                    </span>
                                    <span className="text-[9px] uppercase tracking-[0.1em] text-base-content/30">pulses</span>
                                </div>
                            </div>

                            <button className="group/btn flex items-center justify-center gap-3 px-7 py-3.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary hover:border-primary text-primary hover:text-primary-content transition-all duration-300 cursor-pointer">
                                <HeartPulse size={16} className="group-hover/btn:animate-pulse" />
                                <span className="text-sm uppercase tracking-[0.2em]">Top up</span>
                            </button>
                        </div>
                    </div>

                </div>

                {/* Automatic top up */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <span className="w-5 h-px bg-primary/40" />
                        <span className="text-sm uppercase tracking-[0.2em] text-base-content/60">Automatic top up</span>
                    </div>

                    <div className="group relative p-[1.5px] rounded-2xl">
                        <div
                            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 group-hover:animate-spin-border transition-opacity duration-300 pointer-events-none"
                            style={{ backgroundImage: CONIC_GRADIENT }}
                        />
                        <div className="relative flex items-center gap-10 px-10 py-8 rounded-2xl bg-base-100 border border-base-content/8 group-hover:border-transparent transition-colors duration-300">
                            <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-base-content/8 group-hover:border-primary/30 pointer-events-none transition-colors duration-300" />
                            <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-base-content/8 group-hover:border-primary/30 pointer-events-none transition-colors duration-300" />
                            <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-base-content/8 group-hover:border-primary/30 pointer-events-none transition-colors duration-300" />
                            <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-base-content/8 group-hover:border-primary/30 pointer-events-none transition-colors duration-300" />

                            {/* Amount picker */}
                            <div className="flex flex-col gap-2 shrink-0">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-base-content/30">Monthly · USD</span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => adjustAutoTopUp(-5)}
                                        className="w-9 h-9 rounded-xl border border-base-content/10 flex items-center justify-center text-base-content/40 hover:border-primary/30 hover:text-primary transition-all cursor-pointer"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <input
                                        type="number"
                                        min={5}
                                        max={5000}
                                        step={5}
                                        value={autoTopUpDollars}
                                        onChange={e => setAutoTopUpDollars(Math.max(5, Math.min(5000, Number(e.target.value))))}
                                        className="w-24 bg-base-200/50 border border-base-content/10 rounded-xl px-4 py-2.5 text-center text-sm tabular-nums text-base-content/80 focus:outline-none focus:border-primary/40 transition-colors"
                                    />
                                    <button
                                        onClick={() => adjustAutoTopUp(5)}
                                        className="w-9 h-9 rounded-xl border border-base-content/10 flex items-center justify-center text-base-content/40 hover:border-primary/30 hover:text-primary transition-all cursor-pointer"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="w-px h-14 bg-base-content/6 shrink-0" />

                            {/* Pulses per month */}
                            <div className="flex flex-col gap-1 shrink-0">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-base-content/30">You get / month</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl tabular-nums text-base-content/75">
                                        {autoTopUpPulses.toLocaleString('de-DE')}
                                    </span>
                                    <span className="text-xs uppercase tracking-[0.15em] text-base-content/30">pulses</span>
                                </div>
                            </div>

                            <div className="w-px h-14 bg-base-content/6 shrink-0" />

                            {/* Approximate breakdown */}
                            <div className="flex-1 flex items-center gap-8">
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2">
                                        <Image size={13} strokeWidth={1.2} className="text-base-content/25" />
                                        <span className="text-[10px] uppercase tracking-[0.2em] text-base-content/30">Images</span>
                                    </div>
                                    <span className="text-xl tabular-nums text-base-content/65">
                                        ~{Math.floor(autoTopUpPulses / PULSES_PER_IMAGE).toLocaleString('de-DE')}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2">
                                        <Video size={13} strokeWidth={1.2} className="text-base-content/25" />
                                        <span className="text-[10px] uppercase tracking-[0.2em] text-base-content/30">Video</span>
                                    </div>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-xl tabular-nums text-base-content/65">
                                            ~{Math.floor(autoTopUpPulses / PULSES_PER_VIDEO_SEC).toLocaleString('de-DE')}
                                        </span>
                                        <span className="text-[9px] uppercase tracking-[0.15em] text-base-content/30">sec</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2">
                                        <Mic size={13} strokeWidth={1.2} className="text-base-content/25" />
                                        <span className="text-[10px] uppercase tracking-[0.2em] text-base-content/30">Audio</span>
                                    </div>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-xl tabular-nums text-base-content/65">
                                            ~{Math.floor(autoTopUpPulses / PULSES_PER_AUDIO_SEC).toLocaleString('de-DE')}
                                        </span>
                                        <span className="text-[9px] uppercase tracking-[0.15em] text-base-content/30">sec</span>
                                    </div>
                                </div>
                            </div>

                            {/* Subscribe button */}
                            <button className="group/btn shrink-0 flex items-center gap-3 px-7 py-3.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary hover:border-primary text-primary hover:text-primary-content transition-all duration-300 cursor-pointer">
                                <Repeat2 size={16} />
                                <span className="text-sm uppercase tracking-[0.2em]">Subscribe</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Pricing table */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <span className="w-5 h-px bg-primary/40" />
                        <span className="text-sm uppercase tracking-[0.2em] text-base-content/60">Pricing</span>
                    </div>
                    <div className="rounded-2xl bg-base-100 border border-base-content/8 overflow-hidden">
                        {[
                            { action: 'Image generation', unit: 'per image', pulses: 15 },
                            { action: 'Video generation', unit: 'per second', pulses: 80 },
                            { action: 'Video with voice generation', unit: 'per second', pulses: 120 },
                            { action: 'Voice generation', unit: 'per second', pulses: 25 },
                            { action: 'Photoset generation', unit: 'per set', pulses: 60 },
                        ].map((row, index, arr) => (
                            <div
                                key={row.action}
                                className={`flex items-center justify-between px-8 py-5 transition-colors duration-200 hover:bg-base-content/[0.02] ${index < arr.length - 1 ? 'border-b border-base-content/5' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className="w-1 h-1 rounded-full bg-primary/40" />
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-sm uppercase tracking-[0.15em] text-base-content/60">{row.action}</span>
                                        <span className="text-[10px] uppercase tracking-[0.2em] text-base-content/25">{row.unit}</span>
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-xl tabular-nums text-base-content/70">{row.pulses}</span>
                                    <span className="text-[9px] uppercase tracking-[0.15em] text-base-content/30">pulses</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default CreditsPage;
