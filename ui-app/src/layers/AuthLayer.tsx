import { Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/auth/Login';
import RegistrationPage from '../pages/auth/Registration';

function AuthLayer() {
    return (
        <div className="min-h-screen flex flex-col bg-base-200 w-full transition-colors duration-300">
            <main className="flex-grow">
                <div className="max-w-5xl mx-auto w-full">
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/registration" element={<RegistrationPage />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}

export default AuthLayer;