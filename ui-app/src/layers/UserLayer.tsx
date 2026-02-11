import { Routes, Route } from 'react-router-dom';
import Header from '../components/Header'
import AvatarsPage from '../pages/Avatars';
import CreateIdPhotoPage from '../pages/createAvatar/createIdPhoto';
import CreatePhotoSetPage from '../pages/createAvatar/createPhotoSet';
import AssignVoicePage from '../pages/createAvatar/assignVoice';
import AvatarTrainingPage from '../pages/createAvatar/avatarTraining';
import GeneralPage from '../pages/createAvatar/general';

function UserLayer() {
    return (
        <div className="min-h-screen flex flex-col bg-base-200 w-full transition-colors duration-300">
            <Header/>
            <main className="flex-grow p-6">
                <div className="max-w-7xl mx-auto w-full">
                    <Routes>
                        <Route path="/" element={<AvatarsPage />} />
                        <Route path="/avatar/create/general" element={<GeneralPage />} />
                        <Route path="/avatar/create/id-photo" element={<CreateIdPhotoPage />} />
                        <Route path="/avatar/create/photo-set" element={<CreatePhotoSetPage />} />
                        <Route path="/avatar/create/assign-voice" element={<AssignVoicePage />} />
                        <Route path="/avatar/create/training" element={<AvatarTrainingPage />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}

export default UserLayer;