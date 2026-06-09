import { useState } from 'react';
import { HeartPulse, Sparkles, Zap, Crown, Plus, Minus, Check, MoveRight } from 'lucide-react';
import { useApp } from '../providers/ContextProvider';

const PULSES_PER_DOLLAR = 127;

const CONIC_GRADIENT = 'conic-gradient(from var(--gen-angle), transparent 0%, transparent 60%, color-mix(in oklch, var(--color-primary) 85%, transparent) 80%, transparent 100%)';

const PLANS = [
    {
        key: 'base',
        label: 'Base',
        price: 29,
        pulses: 3683,
        icon: Zap,
        features: ['3,683 pulses / month', 'Image/video/voice generation', '~58 images', '~58 sec of video'],
    },
    {
        key: 'standard',
        label: 'Standard',
        price: 49,
        pulses: 6223,
        icon: Sparkles,
        features: ['6,223 pulses / month', 'Image/video/voice generation', '~98 images', '~98 sec of video'],
    },
    {
        key: 'pro',
        label: 'Pro',
        price: 99,
        pulses: 12573,
        icon: Crown,
        features: ['12,573 pulses / month', 'Image/video/voice generation', '~198 images', '~198 sec of video'],
    },
] as const;

function CreditsPage() {
    const { user } = useApp();
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [topUpDollars, setTopUpDollars] = useState(10);

    const adjustTopUp = (delta: number) => {
        setTopUpDollars(prev => Math.max(5, Math.min(5000, prev + delta)));
    };

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

                {/* Subscription plans */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <span className="w-5 h-px bg-primary/40" />
                        <span className="text-sm uppercase tracking-[0.2em] text-base-content/60">Subscriptions</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {PLANS.map((plan) => {
                            const isPopular = plan.key === 'standard';
                            const isSelected = selectedPlan === plan.key;
                            const Icon = plan.icon;

                            return (
                                <div
                                    key={plan.key}
                                    className={`group relative p-[1.5px] rounded-2xl overflow-hidden transition-all duration-500 ${isSelected ? 'bg-primary' : ''}`}
                                >
                                    {!isSelected && (
                                        <div
                                            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 group-hover:animate-spin-border transition-opacity duration-300 pointer-events-none"
                                            style={{ backgroundImage: CONIC_GRADIENT }}
                                        />
                                    )}

                                    <button
                                        onClick={() => setSelectedPlan(isSelected ? null : plan.key)}
                                        className={`relative w-full h-full flex flex-col gap-6 p-7 rounded-2xl text-left transition-all duration-500 cursor-pointer focus:outline-none
                                            ${isSelected
                                                ? 'bg-base-100 border border-transparent'
                                                : 'bg-base-100 border border-base-content/8 group-hover:border-transparent'
                                            }`}
                                    >
                                        <div
                                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                                            style={{ background: 'radial-gradient(circle at top right, color-mix(in oklch, var(--color-primary) 12%, transparent) 0%, transparent 65%)' }}
                                        />

                                        <div className={`absolute top-3 left-3 w-4 h-4 border-t border-l pointer-events-none transition-colors duration-500 ${isSelected ? 'border-primary/40' : 'border-base-content/8 group-hover:border-primary/30'}`} />
                                        <div className={`absolute bottom-3 left-3 w-4 h-4 border-b border-l pointer-events-none transition-colors duration-500 ${isSelected ? 'border-primary/40' : 'border-base-content/8 group-hover:border-primary/30'}`} />
                                        <div className={`absolute bottom-3 right-3 w-4 h-4 border-b border-r pointer-events-none transition-colors duration-500 ${isSelected ? 'border-primary/40' : 'border-base-content/8 group-hover:border-primary/30'}`} />

                                        <div className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-base-content/80 opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                                            <Check size={11} strokeWidth={2.5} className="text-base-100" />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Icon size={18} strokeWidth={1.2} className={`transition-colors duration-500 ${isSelected ? 'text-base-content/60' : 'text-base-content/25 group-hover:text-base-content/50'}`} />
                                                <span className={`text-sm uppercase tracking-[0.25em] transition-colors duration-500 ${isSelected ? 'text-base-content/80' : 'text-base-content/50 group-hover:text-base-content/70'}`}>
                                                    {plan.label}
                                                </span>
                                            </div>
                                            {isPopular && (
                                                <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-[0.2em] bg-base-content/5 text-base-content/30 border border-base-content/10">
                                                    Popular
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-baseline gap-1.5">
                                                <span className={`text-3xl tabular-nums transition-colors duration-500 ${isSelected ? 'text-base-content/90' : 'text-base-content/60 group-hover:text-base-content/80'}`}>
                                                    ${plan.price}
                                                </span>
                                                <span className="text-[10px] uppercase tracking-[0.15em] text-base-content/25">/ mo</span>
                                            </div>
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-sm tabular-nums text-base-content/40">
                                                    {plan.pulses.toLocaleString('de-DE')}
                                                </span>
                                                <span className="text-[9px] uppercase tracking-[0.15em] text-base-content/25">pulses</span>
                                            </div>
                                        </div>

                                        <ul className="flex flex-col gap-2">
                                            {plan.features.map((feature) => (
                                                <li key={feature} className="flex items-center gap-2.5">
                                                    <span className="w-3 h-px bg-base-content/20 shrink-0" />
                                                    <span className="text-[11px] uppercase tracking-[0.1em] text-base-content/35">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <div className={`mt-auto pt-2 flex items-center justify-center px-5 py-2.5 rounded-xl border text-xs uppercase tracking-[0.2em] transition-all duration-500
                                            ${isSelected
                                                ? 'bg-primary border-primary text-primary-content'
                                                : 'bg-transparent border-base-content/8 text-base-content/30 group-hover:border-primary/30 group-hover:text-primary/70'
                                            }`}
                                        >
                                            {isSelected ? 'Selected' : 'Select plan'}
                                        </div>
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {selectedPlan && (
                        <div className="flex justify-center">
                            <button className="flex items-center gap-3 px-7 py-3.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary hover:border-primary text-primary hover:text-primary-content transition-all duration-300 cursor-pointer">
                                <Sparkles size={16} />
                                <span className="text-sm uppercase tracking-[0.2em]">Subscribe to {PLANS.find(p => p.key === selectedPlan)?.label}</span>
                            </button>
                        </div>
                    )}
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
