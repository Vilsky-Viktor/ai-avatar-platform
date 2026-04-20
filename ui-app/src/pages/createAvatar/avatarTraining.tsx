import { useState, useEffect } from 'react';
import CreateAvatarStepper from "../../components/createAvatar/CreateAvatarStepper";
import { useNavigate } from 'react-router-dom';
import { 
    getAvatarData,
    initialAvatarData
} from '../../utils/avatarCreation';
import { getMediaByAvatarId, createTrainingMedia, getUserAvatarById } from '../../services/apiGateway';
import BottomDock from '../../components/createAvatar/BottomDock';
import { scrollToTop } from '../../utils/scroller';
import type { Media } from '../../types/media';

function AvatarTrainingPage() {
    const navigate = useNavigate();

    const [newAvatarData, _] = useState(() => getAvatarData());
    const [avatar, setAvatar] = useState(initialAvatarData);
    const [pageLoading, setPageLoading] = useState(true);
    const [media, setMedia] = useState([] as Media[])

    useEffect(() => {
        scrollToTop();
        initPage();
    }, []);

    const initPage = async () => {
        const existingAvatar = await getUserAvatarById(newAvatarData.avatarId);
        setAvatar(existingAvatar);

        const existingMedia = await getMediaByAvatarId(newAvatarData.avatarId);

        if (existingMedia.length) {
            setMedia(existingMedia);
        } else {
            const newMedia = await createTrainingMedia(newAvatarData.groupId);
            setMedia(newMedia);
        }

        setPageLoading(false);
    }

    const stepLocked = () => {
        return false;
    }

    const canProceed = () => {
        return false
    };

    const nextStep = async () => {
        if (!canProceed) return

        navigate('/');
    }

    const previousStep = () => {
        navigate('/avatar/create/assign-voice');
    }

    return ( 
        <>
            <CreateAvatarStepper step={4}/>

            {pageLoading ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <span className="loading loading-spinner loading-xl text-primary scale-150"></span>
                </div>
            ) : (
                <div className="mx-auto px-4 pt-12 mb-50">
                    Avatar training
                </div>
            )}

            <BottomDock
                avatarId={newAvatarData.avatarId}
                canProceed={canProceed}
                nextStep={nextStep}
                previousStep={previousStep}
                finish={false}
            />
        </>
    );
}

export default AvatarTrainingPage;