import { type ChangeEvent } from 'react';
import { useApp } from '../providers/ContextProvider';
import { signOut } from "firebase/auth";
import { auth } from '../firebase';
import { ThemeColor } from '../types/settings';


function Header() {
    const { theme, setTheme, user } = useApp();

    const handleToggle = (e: ChangeEvent<HTMLInputElement>) => {
        setTheme(e.target.checked ? ThemeColor.Dark : ThemeColor.Light);
    };

    const logoutUser = () => {
        signOut(auth);
    }

    return (
        <header className="navbar bg-base-100 shadow-md px-4">
            <div className="flex-1">
            <a className="btn btn-ghost text-xl normal-case font-bold tracking-tight">
                loom24.ai
            </a>
            </div>

            <div className="flex-none gap-2">
            <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                <div className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                    <img
                    alt="User Avatar"
                    src={user?.img ?? "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"} 
                    />
                </div>
                </div>
                <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[50] mt-3 w-64 p-2 shadow-xl border border-base-300"
                >
                    <li className="form-control">
                        <label className="label cursor-pointer flex justify-between items-center px-4 py-2">
                        <span className="label-text font-medium">Dark Mode</span>
                        <input 
                            type="checkbox" 
                            className="toggle toggle-primary toggle-sm" 
                            onChange={handleToggle}
                            checked={theme === 'dark'}
                        />
                        </label>
                    </li>
                    <div className="divider my-1"></div>
                    <li><a>Settings</a></li>
                    <li><a 
                        onClick={logoutUser}
                        className="text-error font-medium"
                    >Logout</a></li>
                </ul>
            </div>
            </div>
        </header>
    );
}

export default Header;