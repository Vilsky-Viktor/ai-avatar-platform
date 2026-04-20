import { useState, useEffect } from 'react';
import CreateAvatarStepper from "../../components/createAvatar/CreateAvatarStepper";
import { useNavigate } from 'react-router-dom';
import { 
    getAvatarData,
    initialAvatarData
} from '../../utils/avatarCreation';
import BottomDock from '../../components/createAvatar/BottomDock';
import { scrollToTop } from '../../utils/scroller';

function AvatarTrainingPage() {
    const navigate = useNavigate();

    const [newAvatarData, _] = useState(() => getAvatarData());
    const [avatar, setAvatar] = useState(initialAvatarData);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        scrollToTop();
    }, []);

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

            <div className="mx-auto px-4 pt-12 mb-50">
                Avatar training
            </div>

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