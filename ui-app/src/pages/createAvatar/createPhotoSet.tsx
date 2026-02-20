import CreateAvatarStepper from "../../components/createAvatar/CreateAvatarStepper";
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { useState } from "react";
import type { Job, PhotoSetJob } from "../../types/job";
import { createPhotoSetJobs } from "../../services/apiGateway";
import { ID_PHOTO_STORAGE_KEY, GENERAL_STORAGE_KEY, type IdPhotoStepData, type GeneralStepData, PHOTO_SET_STORAGE_KEY, initialPhotoSetData, type PhotoSetStepData } from '../../utils/avatarCreation';

function CreatePhotoSetPage() {
    const navigate = useNavigate();

    const generalData: GeneralStepData = JSON.parse(localStorage.getItem(GENERAL_STORAGE_KEY) || '{}');
    const idPhotoData: IdPhotoStepData = JSON.parse(localStorage.getItem(ID_PHOTO_STORAGE_KEY) || '{}');

    const [stepData, setStepData] = useState(() => {
        const dataStr = localStorage.getItem(PHOTO_SET_STORAGE_KEY);
        const data = dataStr ? JSON.parse(dataStr) : initialPhotoSetData;
        return data as PhotoSetStepData;
    })

    const setJobs = (jobs: Job[]) => {
        const neededJobData = jobs.map((job: Job) => ({id: job.id, result: job.result, input: { width: job.input.width, height: job.input.height }}))
        setStepData((prev: PhotoSetStepData) => ({...prev, jobs: neededJobData}));
    }

    const createJobs = async () => {
        const job: PhotoSetJob = {
            avatarId: generalData.avatarId,
            input: {
                gender: generalData.gender,
                idPhotoPath: idPhotoData.selectedImage,
                ...idPhotoData.parameters
            }
        }
        setJobs(await createPhotoSetJobs(job))
    }

    const photos = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        status: 'queued', // 'queued', 'generating', 'completed'
    }));

    const canProceed = false;

    return ( 
        <>
            <CreateAvatarStepper step={2}/>

            <div className="max-w-6xl mx-auto px-4 pt-12">

                <button className={`btn btn-lg uppercase tracking-[0.3em] px-16 transition-all duration-500 btn-primary shadow-primary/20 scale-100`} onClick={createJobs}>
                    Generate Photo Set
                </button>

                {/* 5-Column Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {photos.map((photo) => (
                    <div 
                        key={photo.id}
                        className="group relative aspect-[3/4] rounded-2xl border border-base-content/5 bg-base-100 flex flex-col items-center justify-center overflow-hidden transition-all duration-500 hover:border-primary/30"
                    >
                        {/* Background "Scan" Animation for Queued State */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent -translate-y-full animate-[scan_3s_infinite] pointer-events-none" />

                        <div className="flex flex-col items-center gap-3 z-10">
                        <div className="w-10 h-10 rounded-full bg-base-200 flex items-center justify-center text-base-content/20 group-hover:text-primary/40 transition-colors">
                            <Clock size={20} strokeWidth={1.5} />
                        </div>
                        <div className="text-center">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-base-content/20">
                            Queued
                            </span>
                            <p className="text-[9px] font-medium text-base-content/10 mt-0.5">
                            #{String(photo.id + 1).padStart(2, '0')}
                            </p>
                        </div>
                        </div>

                        {/* Corner Accents */}
                        <div className="absolute top-3 left-3 w-2 h-2 border-t border-l border-base-content/10" />
                        <div className="absolute bottom-3 right-3 w-2 h-2 border-b border-r border-base-content/10" />
                    </div>
                    ))}
                </div>
            </div>

            <div className="my-15 flex justify-center gap-6">
                <button className="btn btn-lg btn-ghost uppercase tracking-widest px-12 opacity-50 hover:opacity-100" onClick={() => navigate('/avatar/create/id-photo')}>
                    Back
                </button>
                <button className={`btn btn-lg uppercase tracking-[0.3em] px-16 transition-all duration-500 ${canProceed ? 'btn-primary shadow-primary/20 scale-100' : 'btn-disabled opacity-30 scale-95'}`} onClick={() => navigate('/avatar/create/assign-voice')}>
                    Next
                </button>
            </div>
        </>
    );
}

export default CreatePhotoSetPage;