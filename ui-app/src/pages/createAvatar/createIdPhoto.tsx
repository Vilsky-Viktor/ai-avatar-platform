import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateAvatarStepper from "../../components/createAvatar/CreateAvatarStepper";
import { Upload, Sparkles } from 'lucide-react';
import { AvatarStatus, type Avatar } from '../../types/avatar';
import { updateAvatar } from '../../services/apiGateway';
import { JobStatuses, type Job } from '../../types/job';
import { useApp } from '../../providers/ContextProvider';
import { v4 as uuid4 } from 'uuid';
import { createMedia } from '../../services/apiGateway';
import { MediaTypes, MediaSections, type Media } from '../../types/media';
import { uploadMediaToBucket } from '../../services/storage';
import { type AvatarParameters } from "../../types/avatar";
import { 
    GENERAL_STORAGE_KEY,  
    ID_PHOTO_STORAGE_KEY, 
    getLocalStorageData,
    saveLocalStorageData,
    initialUploadedIdPhotoSet
} from '../../utils/avatarCreation';
import BottomDock from '../../components/createAvatar/BottomDock';
import { type IdPhotoStepData, type GeneralStepData, IdPhotoModes, type UploadedIdPhoto } from "../../types/avatarCreation";
import GeneratePhotos from '../../components/createAvatar/createIdPhotos/GeneratePhotos'
import UploadPhotos from '../../components/createAvatar/createIdPhotos/UploadPhotos';


function CreateIdPhotoPage() {
    const navigate = useNavigate();
    const { user } = useApp();

    const generalData = getLocalStorageData<GeneralStepData>(GENERAL_STORAGE_KEY);

    const [stepData, setStepData] = useState(() => getLocalStorageData<IdPhotoStepData>(ID_PHOTO_STORAGE_KEY))
    const [uploadedPhotos, setUploadedPhotos] = useState(initialUploadedIdPhotoSet as UploadedIdPhoto[]);

    const isFormValid = stepData.parameters && Object.values(stepData.parameters).every(value => value !== '');

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    useEffect(() => {
        saveLocalStorageData<IdPhotoStepData>(ID_PHOTO_STORAGE_KEY, stepData);
    }, [stepData]);

    const canProceed = () => {
        // if (stepData.finished) {
        //     return true;
        // }

        // if (stepData.mode === IdPhotoModes.generate && generatingCompleted() && stepData.selectedVariant !== null) {
        //     return true;
        // }

        // if (stepData.mode === IdPhotoModes.upload && uploadedPhotos.every((item) => item.photo)) {
        //     return true;
        // }

        // return false;
        return true;
    };


    const setMode = (mode: IdPhotoModes) => {
        setStepData((prev: IdPhotoStepData) => ({...prev, mode}));
    }

    const setIdPhotoPaths = (idPhotoPaths: string[]) => {
        setStepData((prev: IdPhotoStepData) => ({...prev, idPhotoPaths}));
    }

    const setFinished = () => {
        setStepData((prev: IdPhotoStepData) => ({...prev, finished: true}));
    }

    const setParameters = (parameters: AvatarParameters) => {
        setStepData((prev: IdPhotoStepData) => ({...prev, parameters}));
    }

    const generatingStarted = () => {
        const lastVariantSet = stepData.variantSets[stepData.variantSets.length - 1];
        return lastVariantSet[0] !== null;
    }

    const generatingCompleted = () => {
        const lastVariantSet = stepData.variantSets[stepData.variantSets.length - 1];
        return lastVariantSet[2]?.status === JobStatuses.completed || lastVariantSet.some((job: Partial<Job> | null) => job?.status === JobStatuses.error)
    }

    const nextStep = async () => {
        if (!canProceed) return

        try {
            if (!stepData.finished) {
                const media: Media = {
                    userId: user?.id!,
                    avatarId: generalData.avatarId,
                    jobId: '',
                    type: MediaTypes.image,
                    section: MediaSections.avatar,
                    isRemovable: false,
                    isIdPhoto: true,
                    isPhotoSet: false,
                    path: '',
                    dimensions: '1024x1024',
                    upscaled: false,
                    order: 0,
                }

                let allMedia: Media[] = [];

                if (stepData.mode === 'generate') {
                    const jobs = stepData.variantSets[stepData.selectedVariant!];

                    for (const [idx, job] of jobs.entries()) {
                        allMedia.push({
                            ...media, 
                            jobId: job?.id!, 
                            path: job?.result?.mediaPath!,
                            dimensions: `${job?.input?.height}x${job?.input?.width}`,
                            order: idx
                        })
                    }
                } else {
                    for (const [idx, item] of uploadedPhotos.entries()) {
                        if (idx === 0) {
                            const mediaPath = `media/${user?.id}-user/avatars/${generalData.avatarId}-avatar/images/000-uploaded-front-portrait-1024x1024.png`;
                            await uploadMediaToBucket(mediaPath, item.photo!);
                            allMedia.push({
                                ...media,
                                path: mediaPath,
                                dimensions: '1024x1024',
                                order: idx
                            })
                        } else if (idx === 1) {
                            const mediaPath = `media/${user?.id}-user/avatars/${generalData.avatarId}-avatar/images/000-uploaded-quarter-portrait-1024x1024.png`;
                            await uploadMediaToBucket(mediaPath, item.photo!);
                            allMedia.push({
                                ...media,
                                path: mediaPath,
                                dimensions: '1024x1024',
                                order: idx
                            })
                        } else if (idx === 2) {
                            const mediaPath = `media/${user?.id}-user/avatars/${generalData.avatarId}-avatar/images/000-uploaded-profile-portrait-1024x1024.png`;
                            await uploadMediaToBucket(mediaPath, item.photo!);
                            allMedia.push({
                                ...media,
                                path: mediaPath,
                                dimensions: '1024x1024',
                                order: idx
                            })
                        }
                    }
                }

                await Promise.all(allMedia.map((media: Media) => createMedia(media)))

                const idPhotoPaths = allMedia.map((media) => media.path);
                const payload: Partial<Avatar> = {
                    status: AvatarStatus.idCreated, 
                    parameters: {...stepData.parameters},
                    idPhotoPaths: idPhotoPaths
                };
                setIdPhotoPaths(idPhotoPaths);
                await updateAvatar(generalData.avatarId, payload);

                setFinished()
            }

            navigate('/avatar/create/photo-set');
        } catch (error) {
            console.log(`Did not manage to create a new media: ${error}`);
        }
    }
    
    const previousStep = () => {
        navigate('/avatar/create/general');
    }

    return (
        <div className="max-w-6xl mx-auto px-4 pb-30">
            <CreateAvatarStepper step={1} />

            <div className="flex justify-center mt-8">
                <div className="bg-base-200 p-1 rounded-2xl flex gap-1 border border-base-content/5">
                    <button onClick={() => setMode(IdPhotoModes.generate)} className={`px-6 py-2 cursor-pointer rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${stepData.mode === IdPhotoModes.generate ? 'bg-base-100 shadow-sm text-primary' : 'opacity-50 hover:opacity-100'}`}>
                        <Sparkles size={16} /> Generate
                    </button>
                    <button onClick={() => setMode(IdPhotoModes.upload)} className={`px-6 py-2 cursor-pointer rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${stepData.mode === IdPhotoModes.upload ? 'bg-base-100 shadow-sm text-primary' : 'opacity-50 hover:opacity-100'}`}>
                        <Upload size={16} /> Upload
                    </button>
                </div>
            </div>

            <div className="mt-12 w-full">
                {stepData.mode === IdPhotoModes.generate ? (
                    <GeneratePhotos
                        stepData={stepData}
                        setStepData={setStepData}
                        generalData={generalData}
                        generatingStarted={generatingStarted}
                        generatingCompleted={generatingCompleted}
                        isFormValid={isFormValid}
                        setParameters={setParameters}
                    />
                ) : (
                    <UploadPhotos
                        stepData={stepData}
                        generalData={generalData}
                        uploadedPhotos={uploadedPhotos}
                        setUploadedPhotos={setUploadedPhotos}
                        setParameters={setParameters}
                    />
                )}
            </div>

            <BottomDock
                avatarId={generalData.avatarId}
                canProceed={canProceed}
                nextStep={nextStep}
                previousStep={previousStep}
                finish={false}
            />
        </div>
    )
}

export default CreateIdPhotoPage;