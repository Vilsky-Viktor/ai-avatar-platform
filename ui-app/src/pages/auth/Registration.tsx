import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup, signInWithCustomToken, GoogleAuthProvider, updateProfile, linkWithCredential } from "firebase/auth";
import { auth } from '../../firebase';
import { syncUser, linkGoogleAccount } from '../../services/apiGateway';
import Loading from '../../components/Loading';
import { ScanFace, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { scrollToTop } from '../../utils/scroller';

function RegistrationPage() {
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        scrollToTop();
    }, [])

    const isFormValid = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const passRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{7,}$/;

        return (
            name.trim().length > 0 &&
            emailRegex.test(email) &&
            passRegex.test(password) &&
            password === passwordConfirmation
        );
    };

    const handlePlainRegistration = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!isFormValid()) return;

        setError('');
        try {
            setLoading(true);
            const { user } = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(user, { displayName: name });
            await user.reload();
            await syncUser(auth.currentUser!);
            navigate('/');
        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                setError('This email is already registered. Sign in instead, or use Google if you registered with Google.');
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleRegistration = async () => {
        setError('');
        setLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            const { user } = await signInWithPopup(auth, provider);
            await syncUser(user);
            navigate('/');
        } catch (error: any) {
            if (error.code === 'auth/account-exists-with-different-credential') {
                const cred = GoogleAuthProvider.credentialFromError(error);
                const googleIdToken = (cred as any)?.idToken;
                if (cred && googleIdToken) {
                    try {
                        const { customToken } = await linkGoogleAccount(googleIdToken);
                        const { user } = await signInWithCustomToken(auth, customToken);
                        await linkWithCredential(user, cred);
                        await syncUser(user);
                        navigate('/');
                    } catch {
                        setError('Failed to link Google account. Please try again.');
                    }
                } else {
                    setError('Google sign-in failed.');
                }
            } else {
                setError('Google registration failed.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {loading ? <Loading /> : (
                <div className="min-h-screen w-full flex flex-col items-center justify-center bg-base-100 selection:bg-primary/20">
                    <div className="w-full max-w-[400px] px-8 py-10 flex flex-col gap-10">

                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2.5 group self-center">
                            <div className="p-3 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-colors duration-300">
                                <ScanFace size={36} className="text-primary" strokeWidth={1.2} />
                            </div>
                            <span className="text-lg uppercase tracking-[0.25em] text-base-content/70 group-hover:text-base-content transition-colors duration-300">
                                loom24.ai
                            </span>
                        </Link>

                        {/* Heading */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-px bg-primary/50" />
                                <h1 className="text-xl uppercase tracking-[0.2em] text-base-content/70">Create account</h1>
                            </div>
                            <p className="text-sm text-base-content/35 pl-11">Start your AI journey today.</p>
                        </div>

                        <div className="flex flex-col gap-6">
                            {error && (
                                <div className="p-3 bg-error/5 border-l-2 border-error flex items-start gap-2">
                                    <AlertCircle size={14} className="text-error flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-error/80 leading-tight">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handlePlainRegistration} className="flex flex-col gap-6">
                                <div className="flex flex-col gap-4">
                                    <input
                                        type="text"
                                        placeholder="Full name"
                                        className="w-full py-3 bg-transparent border-b border-base-content/10 focus:border-primary transition-all duration-300 outline-none text-sm placeholder:text-base-content/20"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email address"
                                        className="w-full py-3 bg-transparent border-b border-base-content/10 focus:border-primary transition-all duration-300 outline-none text-sm placeholder:text-base-content/20"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Password"
                                            className="w-full py-3 bg-transparent border-b border-base-content/10 focus:border-primary transition-all duration-300 outline-none text-sm placeholder:text-base-content/20"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-base-content/25 hover:text-primary transition-colors cursor-pointer"
                                        >
                                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm password"
                                            className="w-full py-3 bg-transparent border-b border-base-content/10 focus:border-primary transition-all duration-300 outline-none text-sm placeholder:text-base-content/20"
                                            value={passwordConfirmation}
                                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-base-content/25 hover:text-primary transition-colors cursor-pointer"
                                        >
                                            {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!isFormValid()}
                                    className="group flex items-center justify-center w-full py-3.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary hover:border-primary text-primary hover:text-primary-content transition-all duration-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-sm uppercase tracking-[0.2em]"
                                >
                                    Create account
                                </button>
                            </form>

                            <div className="flex items-center gap-3">
                                <div className="flex-1 border-t border-base-content/5" />
                                <span className="text-[9px] uppercase tracking-[0.2em] text-base-content/20">or</span>
                                <div className="flex-1 border-t border-base-content/5" />
                            </div>

                            <button
                                type="button"
                                className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl border border-base-content/10 hover:border-base-content/20 hover:bg-base-200/50 transition-all duration-300 cursor-pointer"
                                onClick={handleGoogleRegistration}
                            >
                                <svg width="16" height="16" viewBox="0 0 48 48">
                                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
                                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                                </svg>
                                <span className="text-sm uppercase tracking-[0.2em] text-base-content/50">Sign up with Google</span>
                            </button>
                        </div>

                        <p className="text-xs text-base-content/30 text-center">
                            Already have an account?
                            <Link to="/auth/login" className="ml-2 text-base-content/50 hover:text-primary border-b border-base-content/10 hover:border-primary transition-all duration-300">
                                Sign in
                            </Link>
                        </p>

                    </div>
                </div>
            )}
        </>
    );
}

export default RegistrationPage;
