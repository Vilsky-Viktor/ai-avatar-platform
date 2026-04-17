import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from '../../firebase';
import { syncUser } from '../../services/apiGateway';
import Loading from '../../components/Loading';
import { ScanFace, AlertCircle, Eye, EyeOff } from 'lucide-react';

function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [])

    const isFormValid = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && password.length >= 7;
    };

    const handlePlainLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!isFormValid()) return;

        setError('');
        try {
            setLoading(true);
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/');
        } catch (error: any) {
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                setError('Invalid email or password.');
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            const { user } = await signInWithPopup(auth, provider);
            await syncUser(user);
            navigate('/');
        } catch (error) {
            setError('Google sign-in failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {loading ? <Loading /> : (
                <div className="min-h-screen w-full flex flex-col items-center justify-center bg-base-100 selection:bg-primary/20 font-sans">
                    <div className="w-full max-w-[400px] px-8 py-10">
                        
                        <div className="flex items-center justify-center gap-3 mb-12 group cursor-default">
                            <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-all duration-500">
                                <ScanFace size={32} className="text-primary" strokeWidth={1.5} />
                            </div>
                            <span className="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-base-content to-base-content/60">
                                loom24.ai
                            </span>
                        </div>

                        <header className="flex flex-col items-start mb-8">
                            <h1 className="text-3xl font-bold tracking-tight mb-1 text-base-content">Sign in.</h1>
                            <p className="text-sm text-base-content/40 font-medium">Welcome back to loom24.</p>
                        </header>

                        {error && (
                            <div className="mb-6 p-3 bg-error/5 border-l-2 border-error flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                <AlertCircle size={14} className="text-error flex-shrink-0" />
                                <p className="text-xs font-semibold text-error/90 leading-tight">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handlePlainLogin} className="space-y-6">
                            <div className="space-y-1">
                                <input 
                                    type="email" 
                                    placeholder="Email Address"
                                    className="w-full py-3 bg-transparent border-b border-base-content/10 focus:border-primary transition-all duration-300 outline-none text-base placeholder:text-base-content/20" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                />
                                <div className="relative group">
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="Password"
                                        className="w-full py-3 bg-transparent border-b border-base-content/10 focus:border-primary transition-all duration-300 outline-none text-base placeholder:text-base-content/20" 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-base-content/30 hover:text-primary transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={!isFormValid()}
                                className="btn btn-primary w-full h-12 rounded-xl border-none text-base font-bold normal-case shadow-[0_8px_16px_-6px_rgba(var(--p),0.4)] hover:shadow-[0_12px_20px_-6px_rgba(var(--p),0.5)] hover:-translate-y-0.5 transition-all duration-300 mt-2 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed disabled:transform-none" 
                            >
                                Continue
                            </button>
                        </form>

                        <div className="flex flex-col gap-3">
                            <div className="relative flex py-4 items-center">
                                <div className="flex-grow border-t border-base-content/5"></div>
                                <span className="flex-shrink mx-3 text-[9px] font-bold tracking-[0.2em] text-base-content/20 uppercase">OR</span>
                                <div className="flex-grow border-t border-base-content/5"></div>
                            </div>

                            <button 
                                type="button"
                                className="btn btn-ghost w-full h-12 rounded-xl border border-base-content/10 bg-base-100 hover:bg-base-200 transition-all duration-300 gap-2" 
                                onClick={handleGoogleLogin}
                            >
                                <svg width="18" height="18" viewBox="0 0 48 48">
                                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
                                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                                </svg>
                                <span className="font-bold opacity-80 text-sm">Sign in with Google</span>
                            </button>
                        </div>

                        <footer className="mt-8">
                            <p className="text-xs text-base-content/30 font-medium">
                                No account? 
                                <Link to="/auth/registration" className="ml-2 text-base-content/60 font-bold border-b border-base-content/10 hover:border-primary hover:text-primary transition-all duration-300">
                                    Create one
                                </Link>
                            </p>
                        </footer>
                    </div>
                </div>
            )}
        </>
    );
}

export default LoginPage;