import { useEffect, useState, ChangeEvent } from 'react';

type Theme = 'light' | 'dark';

function App() {
  const [theme, setTheme] = useState<Theme>(
    (localStorage.getItem('theme') as Theme) || 'light'
  );

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleToggle = (e: ChangeEvent<HTMLInputElement>) => {
    setTheme(e.target.checked ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen flex flex-col bg-base-200 w-full transition-colors duration-300">
      {/* Header - Always full width */}
      <header className="navbar bg-base-100 shadow-md px-4">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl normal-case font-bold tracking-tight">
            identix.ai
          </a>
        </div>

        <div className="flex-none gap-2">
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                <img
                  alt="User Avatar"
                  src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" 
                />
              </div>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[50] mt-3 w-64 p-2 shadow-xl border border-base-300"
            >
              <li className="menu-title"><span>Account</span></li>
              <li><a>Profile</a></li>
              <li><a>Settings</a></li>
              <div className="divider my-1"></div>
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
              <li><a className="text-error font-medium">Logout</a></li>
            </ul>
          </div>
        </div>
      </header>

      {/* Main Container - Background stays full width */}
      <main className="flex-grow p-6">
        {/* Content Wrapper - Centered and constrained */}
        <div className="max-w-7xl mx-auto w-full">
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
              <h2 className="card-title text-2xl">Main Content Area</h2>
              <p className="text-base-content/70">
                This block is now centered using <code>mx-auto</code> and constrained by <code>max-w-5xl</code>.
              </p>
              
              <div className="py-10 text-center bg-base-200 rounded-xl mt-4">
                <p>Content is now focused in the middle of your screen.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;