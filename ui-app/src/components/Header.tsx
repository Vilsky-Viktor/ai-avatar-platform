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

    return (
        <header className="navbar bg-base-100/80 backdrop-blur-md sticky top-0 z-[100] border-b border-base-200 px-6">
            <div className="flex-1">
                <Link to="/" className="flex items-center gap-2 cursor-pointer group">
                    <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors duration-500">
                        <ScanFace size={24} className="text-primary" strokeWidth={2} />
                    </div>
                    <span className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-base-content to-base-content/60">
                        loom24.ai
                    </span>
                </Link>
            </div>

            <div className="flex-none flex items-center gap-6">
                <div className="group relative flex items-center cursor-pointer gap-3 px-4 py-2 rounded-full border border-primary/10 bg-gradient-to-b from-base-200/50 to-base-200/80 backdrop-blur-md hover:border-primary/30 hover:shadow-[0_0_20px_-12px_rgba(var(--p),0.4)] transition-all duration-500 cursor-default">
                    <div className="absolute inset-0 rounded-full bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="flex items-center justify-center relative">
                        <HeartPulse 
                            size={18} 
                            className="text-error animate-pulse drop-shadow-[0_0_8px_rgba(245,158,11,0.4)] transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12" 
                        />
                    </div>

                    <div className="h-3 w-[1px] bg-base-content/10"></div>

                    <div className="flex items-baseline gap-1.5 relative">
                        <span className="text-sm font-black tabular-nums tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-base-content to-base-content/70">
                            100
                        </span>
                        <span className="text-[9px] font-bold opacity-40 uppercase tracking-[0.15em] transition-opacity group-hover:opacity-60 duration-500">
                            pulses
                        </span>
                    </div>
                </div>

                <div className="dropdown dropdown-end cursor-pointer">
                    <div tabIndex={0} role="button" className="group flex items-center">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-primary/20 scale-110 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-base-300 group-hover:ring-primary transition-all duration-300 relative z-10">
                                <img
                                    src={user?.img ?? "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"}
                                    referrerPolicy="no-referrer"
                                    crossOrigin="anonymous"
                                    alt="avatar"
                                    className="object-cover w-full h-full"
                                />
                            </div>
                        </div>
                    </div>
                    <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-2xl z-[50] mt-4 w-64 p-2 shadow-2xl border border-base-200 animate-in fade-in zoom-in duration-200">
                        <li>
                            <div className="flex flex-col items-start px-4 py-3">
                                <div className="font-bold text-sm tracking-tight">{user?.name}</div>
                                <div className="text-[11px] text-base-content/50 font-medium">
                                    {user?.email}
                                </div>
                            </div>
                        </li>
                        <div className="divider my-0 opacity-50"></div>
                        <li className="form-control">
                            <label className="label cursor-pointer flex justify-between items-center px-4 py-2">
                                <span className="label-text text-xs font-semibold opacity-70">Dark Mode</span>
                                <input 
                                    type="checkbox" 
                                    className="toggle toggle-primary toggle-xs" 
                                    onChange={handleToggle}
                                    checked={theme === 'dark'}
                                />
                            </label>
                        </li>
                        <div className="divider my-0 opacity-50"></div>
                        <li><a className="py-2 text-xs font-medium">Settings</a></li>
                        <li><a onClick={logoutUser} className="py-2 text-xs text-error font-bold">Logout</a></li>
                    </ul>
                </div>
            </div>
        </header>
    );
}

export default Header;