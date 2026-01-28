import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from '../../firebase';

function LoginPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('');

    const handlePlainLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/');
        } catch (error) {
            console.error("Registration failed", error);
        }
    };

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            navigate('/');
        } catch (error) {
            console.error("Google login failed", error);
        }
    };
    
    return (
        <div className="hero bg-base-200 min-h-screen">
            <div className="hero-content min-w-lg">
                <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-lg">
                    <div className="card-body">
                        <div className="text-center">Do not have an account? <Link className="link link-hover font-bold" to="/auth/registration">Register</Link></div>
                        <div className="divider"></div>
                        <fieldset className="fieldset">
                            <label className="label">Email</label>
                            <input type="email" className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                            <label className="label">Password</label>
                            <input type="password" className="input" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                            <button className="btn btn-neutral mt-4" onClick={handlePlainLogin}>Sign in</button>
                            <div className="divider">OR</div>
                            <button className="btn bg-white text-black border-[#e5e5e5]" onClick={handleGoogleLogin}>
                                <svg aria-label="Google logo" width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g><path d="m0 0H512V512H0" fill="#fff"></path><path fill="#34a853" d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341"></path><path fill="#4285f4" d="m386 400a140 175 0 0053-179H260v74h102q-7 37-38 57"></path><path fill="#fbbc02" d="m90 341a208 200 0 010-171l63 49q-12 37 0 73"></path><path fill="#ea4335" d="m153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55"></path></g></svg>
                                Sign in with Google
                            </button>
                        </fieldset>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;