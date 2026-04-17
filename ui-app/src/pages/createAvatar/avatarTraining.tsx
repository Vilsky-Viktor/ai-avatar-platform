import { useState, useEffect, useRef, useCallback } from 'react';
import CreateAvatarStepper from "../../components/createAvatar/CreateAvatarStepper";
import { useNavigate } from 'react-router-dom';
import { 
    GENERAL_STORAGE_KEY,  
    ID_PHOTO_STORAGE_KEY, 
    getLocalStorageData,
    saveLocalStorageData,
    initialUploadedIdPhotoSet,
    PHOTO_SET_STORAGE_KEY
} from '../../utils/avatarCreation';
import { type IdPhotoStepData, type GeneralStepData, type PhotoSetStepData } from "../../types/avatarCreation";
import BottomDock from '../../components/createAvatar/BottomDock';

function AvatarTrainingPage() {
    const navigate = useNavigate();

    const generalStepData = getLocalStorageData<GeneralStepData>(GENERAL_STORAGE_KEY);
    const idPhotoStepData = getLocalStorageData<IdPhotoStepData>(ID_PHOTO_STORAGE_KEY)
    const photoSetStepData = getLocalStorageData<PhotoSetStepData>(PHOTO_SET_STORAGE_KEY)

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
                avatarId={generalStepData.avatarId}
                canProceed={canProceed}
                nextStep={nextStep}
                previousStep={previousStep}
                finish={false}
            />
        </>
    );
}

export default AvatarTrainingPage;