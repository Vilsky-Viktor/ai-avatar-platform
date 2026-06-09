import { type ChangeEvent } from 'react';
import { useApp } from '../providers/ContextProvider';
import { signOut } from "firebase/auth";
import { auth } from '../firebase';
import { ThemeColor } from '../types/settings';
import { ScanFace, HeartPulse } from 'lucide-react';
import { Link } from 'react-router-dom';

function Header() {
    const { theme, setTheme, user } = useApp();

    const handleToggle = (e: ChangeEvent<HTMLInputElement>) => {
        setTheme(e.target.checked ? ThemeColor.Dark : ThemeColor.Light);
    };

    const logoutUser = () => {
        signOut(auth);
    }

    const isDark = theme === 'dark';

    return (
        <header className="fixed top-0 left-0 right-0 z-[100] flex items-start justify-between px-6 pt-4 pointer-events-none">
            <div className="pointer-events-auto">
                <Link to="/" className="flex items-center gap-2.5 cursor-pointer group">
                    <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors duration-300">
                        <ScanFace size={22} className="text-primary" strokeWidth={1.5} />
                    </div>
                    <span className="text-sm uppercase tracking-[0.25em] text-base-content/70 group-hover:text-base-content transition-colors duration-300">
                        loom24.ai
                    </span>
                </Link>
            </div>

            <div className="pointer-events-auto flex items-center gap-4">
                {/* Credits pill */}
                <Link to="/credits" className="group relative p-[1.5px] rounded-full cursor-pointer active:scale-[0.97] transition-transform duration-150">
                    <div
                        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-spin-border transition-opacity duration-300 pointer-events-none"
                        style={{ backgroundImage: 'conic-gradient(from var(--gen-angle), transparent 0%, transparent 60%, color-mix(in oklch, var(--color-primary) 85%, transparent) 80%, transparent 100%)' }}
                    />
                    <div className="relative flex items-center gap-2.5 px-4 py-2 rounded-full border border-base-content/10 group-hover:border-transparent bg-base-200/60 backdrop-blur-md transition-colors duration-300">
                        <HeartPulse size={15} strokeWidth={1.5} className="text-error group-hover:scale-110 transition-transform duration-200" />
                        <div className="h-3 w-px bg-base-content/10" />
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-sm tabular-nums text-base-content/80 group-hover:text-base-content transition-colors duration-200">
                                {(user?.credits || 0).toLocaleString('de-DE')}
                            </span>
                            <span className="text-[9px] uppercase tracking-[0.15em] text-base-content/35 group-hover:text-primary/60 transition-colors duration-200">
                                pulses
                            </span>
                        </div>
                    </div>
                </Link>

                {/* Avatar dropdown */}
                <div className="dropdown dropdown-end cursor-pointer">
                    <div tabIndex={0} role="button" className="group flex items-center">
                        <div className="w-9 h-9 rounded-xl overflow-hidden border border-base-content/10 group-hover:border-primary/40 transition-all duration-300">
                            <img
                                src={user?.img ?? "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"}
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                                alt="avatar"
                                className="object-cover w-full h-full"
                            />
                        </div>
                    </div>
                    <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-2xl z-[50] mt-3 w-64 p-2 border border-base-content/8 animate-in fade-in zoom-in duration-200">
                        <li>
                            <div className="flex flex-col items-start px-4 py-3 gap-0.5">
                                <div className="flex items-center gap-2">
                                    <span className="w-4 h-px bg-primary/50" />
                                    <span className="text-sm uppercase tracking-[0.15em] text-base-content/70">{user?.name}</span>
                                </div>
                                {user?.email && (
                                    <div className="text-[11px] text-base-content/35 pl-6">
                                        {user?.email}
                                    </div>
                                )}
                            </div>
                        </li>
                        <div className="divider my-0 opacity-30" />
                        <li>
                            <label className="flex justify-between items-center px-4 py-2.5 cursor-pointer hover:bg-base-content/5 rounded-xl">
                                <span className="text-xs uppercase tracking-[0.15em] text-base-content/50">Dark mode</span>
                                <div className={`relative w-9 h-5 rounded-full transition-colors duration-300 ${isDark ? 'bg-primary/30' : 'bg-base-content/10'}`}>
                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 ${isDark ? 'left-[18px] bg-primary' : 'left-0.5 bg-base-content/30'}`} />
                                </div>
                                <input type="checkbox" className="hidden" onChange={handleToggle} checked={isDark} />
                            </label>
                        </li>
                        <div className="divider my-0 opacity-30" />
                        <li><Link to="/settings" className="py-2 text-xs uppercase tracking-[0.15em] text-base-content/50 hover:text-base-content/80">Settings</Link></li>
                        <li><a onClick={logoutUser} className="py-2 text-xs uppercase tracking-[0.15em] text-error/60 hover:text-error cursor-pointer">Logout</a></li>
                    </ul>
                </div>
            </div>
        </header>
    );
}


export default Header;
