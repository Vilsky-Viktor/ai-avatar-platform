import CreateAvatarStepper from "../../components/createAvatar/CreateAvatarStepper";
import { useNavigate } from 'react-router-dom';

function CreatePhotoSetPage() {
    const navigate = useNavigate();

    return ( 
        <>
            <CreateAvatarStepper step={1}/>

            <div className="card bg-base-100 mt-4 p-10 shadow-md">
                Photo set
            </div>

            <div className="mt-10 w-full flex justify-center">
                <button className="btn btn-lg btn-error btn-outline uppercase px-12 mr-4 opacity-50" onClick={() => navigate('/avatar/create/id-photo')}>
                    Back
                </button>
                <button className="btn btn-lg btn-primary uppercase" onClick={() => navigate('/avatar/create/assign-voice')}>
                    Next
                </button>
            </div>
        </>
    );
}

export default CreatePhotoSetPage;