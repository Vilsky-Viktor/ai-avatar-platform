import React, { useEffect, useState, useRef } from 'react';
import { JobStatuses, type Job, type JobRequest } from "../../../types/job";
import { User, Clock, Loader2, CircleAlert, Sparkles, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { AVATAR_PARAMETER_OPTIONS, initialIdPhotoVariantSet } from "../../../utils/avatarCreation";
import type { GeneralStepData, IdPhotoStepData } from "../../../types/avatarCreation";
import { createIdPhotoView0Job, createIdPhotoView45Job, createIdPhotoView90Job } from "../../../services/apiGateway";
import type { DocumentSnapshot } from 'firebase/firestore';
import { getMediaUrlFromPath } from '../../../services/storage';
import { listenToDocChanges } from '../../../services/db';


type Props = {
    stepData: IdPhotoStepData,
    setStepData: Function,
    generalData: GeneralStepData,
    generatingStarted: Function,
    generatingCompleted: Function,
    isFormValid: boolean,
    setParameters: Function,
}

function GeneratePhotos({ stepData, setStepData, generalData, generatingStarted, generatingCompleted, isFormValid,setParameters }: Props) {
    const [generationInitialized, setGenerationInitialized] = useState(false);
    const lastVariantSetIndexRef = useRef(stepData.variantSets.length - 1)

    useEffect(() => {

        console.log('jobs update triggered')

        if (!generatingStarted() || generatingCompleted()) {
            return;
        }

        const lastVariantSet = stepData.variantSets[lastVariantSetIndexRef.current];
        let unsubscribe: Function | null = null;

        console.log(lastVariantSet)

        if (lastVariantSet[0] !== null && !jobDone(lastVariantSet[0])) {
            console.log('create a listener on 0 job')
            unsubscribe = listenToDocChanges('jobs', lastVariantSet[0]?.id!, async (docSnap: DocumentSnapshot) => {
                await listener(lastVariantSetIndexRef.current, 0, docSnap);
            });
        } else if (lastVariantSet[1] !== null && !jobDone(lastVariantSet[1])) {
            console.log('create a listener on 1 job')
            unsubscribe = listenToDocChanges('jobs', lastVariantSet[1]?.id!, async (docSnap: DocumentSnapshot) => {
                await listener(lastVariantSetIndexRef.current, 1, docSnap);
            });
        } else if (lastVariantSet[2] !== null && !jobDone(lastVariantSet[2])) {
            console.log('create a listener on 2 job')
            unsubscribe = listenToDocChanges('jobs', lastVariantSet[2]?.id!, async (docSnap: DocumentSnapshot) => {
                await listener(lastVariantSetIndexRef.current, 2, docSnap);
            });
        } else if (lastVariantSet[0]?.status === JobStatuses.completed && !lastVariantSet[1]) {
            console.log('create 45 job')
            createView45Job(lastVariantSetIndexRef.current, lastVariantSet);
        } else if (lastVariantSet[1]?.status === JobStatuses.completed && !lastVariantSet[2]) {
            console.log('create 90 job')
            createView90Job(lastVariantSetIndexRef.current, lastVariantSet);
        }

        return () => unsubscribe && unsubscribe();

    }, [stepData.variantSets]);

    const listener = async (variantSetIndex: number, photoIndex: number, docSnap: DocumentSnapshot) => {
        console.log(`listener triggered on doc ${docSnap.id}`)

        if (docSnap.exists()) {
            const job = docSnap.data() as Job;

            if (job.status === JobStatuses.completed && job.result?.mediaPath) {
                const downloadUrl = await getMediaUrlFromPath(job.result.mediaPath)
                job.result.mediaUrl = downloadUrl;
            }

            const oldJob = stepData.variantSets[variantSetIndex][photoIndex];

            if (oldJob?.status !== job.status) {
                console.log(`job updated ${JSON.stringify(job)}`)
                setJob(variantSetIndex, photoIndex, job);
            }
        }
    }

    const setJob = (variantIndex: number, photoIndex: number, job: Partial<Job>) => {
        const filteredJob = {
            id: job.id, 
            status: job.status, 
            groupId: job.groupId,
            input: { height: job.input?.height, width: job.input?.width },
            result: { mediaPath: job.result?.mediaPath, mediaUrl: job.result?.mediaUrl }
        }

        setStepData((prev: IdPhotoStepData) => {
            const newVariantSets = prev.variantSets.map((variantSet: (Partial<Job> | null)[], i: number) => {
                return i === variantIndex ? 
                                variantSet.map((oldJob, j) => (j === photoIndex ? filteredJob : oldJob)) : 
                                variantSet
            });

            return {
                ...prev,
                variantSets: newVariantSets,
            };
        });
    };

    const setSelectedVariant = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStepData((prev: IdPhotoStepData) => ({...prev, selectedVariant: e.target.checked ? prev.carouselIndex : null}));
    }

    const setVariantSet = (variantSet: Partial<Job>[] | null[]) => {
        setStepData((prev: IdPhotoStepData) => ({...prev, variantSets: [...prev.variantSets, variantSet]}));
    }

    const incrementCarouselIndex = (increment: number) => {
        setStepData((prev: IdPhotoStepData) => ({...prev, carouselIndex: (prev.carouselIndex + increment + prev.variantSets.length) % prev.variantSets.length}))
    }

    const firstGenerationStarted = () => {
        return stepData.variantSets[0][0] !== null;
    }

    const jobDone = (job: Partial<Job> | null): boolean => {
        return [JobStatuses.completed, JobStatuses.error].includes(job?.status!)
    }


    const createView45Job = async (variantIndex: number, variantSet: (Partial<Job> | null)[]) => {

        const idPhotoJob: JobRequest = {
            groupId: variantSet[0]?.groupId,
            avatarId: generalData.avatarId,
            input: {
                gender: generalData.gender,
                parameters: stepData.parameters,
                idPhotoPaths: [variantSet[0]?.result?.mediaPath!]
            },
        }

        const job = await createIdPhotoView45Job(idPhotoJob);

        setJob(variantIndex, 1, job)
    }

    const createView90Job = async (variantIndex: number, variantSet: (Partial<Job> | null)[]) => {

        const idPhotoJob: JobRequest = {
            groupId: variantSet[0]?.groupId,
            avatarId: generalData.avatarId,
            input: {
                gender: generalData.gender,
                parameters: stepData.parameters,
                idPhotoPaths: [variantSet[1]?.result?.mediaPath!]
            },
        }

        const job = await createIdPhotoView90Job(idPhotoJob);

        setJob(variantIndex, 2, job)
    }

    const generateIdPhotos = async () => {
        console.log('generate photos')
        setGenerationInitialized(true);

        if (firstGenerationStarted() && generatingCompleted()) {
            console.log('create a new set')
            setVariantSet(initialIdPhotoVariantSet);
            incrementCarouselIndex(1);
            lastVariantSetIndexRef.current++;
        } 

        const idPhotoJob: JobRequest = {
            avatarId: generalData.avatarId,
            input: {
                gender: generalData.gender,
                parameters: stepData.parameters,
                idPhotoPaths: []
            },
        }

        try {
            const job = await createIdPhotoView0Job(idPhotoJob);

            setJob(lastVariantSetIndexRef.current, 0, job);
        } catch (error) {
            console.log('Failed to create job for ID photo');
        } finally {
            setGenerationInitialized(false);
        }
    };

    const renderPhotoArea = (job: Partial<Job> | null, idx: number) => {

        if (job === null) {
            return (
                <div className="flex relative rounded-[1rem] border border-dashed border-base-content/10 bg-transparent items-center justify-center min-h-[300px] py-8">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl border border-base-content/5 bg-base-content/[0.01] flex items-center justify-center">
                            <User size={32} strokeWidth={0.5} className="text-base-content/10" />
                        </div>

                        <div className="text-center">
                            <span className="text-[13px] font-bold uppercase tracking-[0.4em] text-base-content/30">
                                ID photo {idx + 1}
                            </span>

                            <p className="text-[10px] font-medium uppercase tracking-widest text-base-content/20 mt-1">
                                Click generate to visualize
                            </p>
                        </div>
                    </div>

                    <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-base-content/10 pointer-events-none" />
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-base-content/10 pointer-events-none" />
                </div>
            )
        }

        if (job.status === JobStatuses.pending) {
            return (
                <div className="flex relative rounded-[1rem] border border-primary/20 bg-primary/[0.02] flex flex-col items-center justify-center min-h-[300px] py-8">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border border-base-content/5 flex items-center justify-center animate-pulse">
                                <Clock size={32} strokeWidth={0.5} className="text-base-content/30" />
                            </div>
                        </div>

                        <div className="text-center">
                            <span className="text-[15px] font-bold uppercase tracking-[0.4em] text-primary">
                                Waiting
                            </span>
                            <p className="text-[11px] font-medium uppercase tracking-widest text-base-content/20 mt-1">
                                Queue processing
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        if (job.status === JobStatuses.generating) {
            return (
                <div className="flex relative rounded-[1rem] border border-primary/20 bg-primary/[0.02] flex flex-col items-center justify-center min-h-[300px] py-8">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <>
                                <Loader2 size={48} strokeWidth={1} className="text-primary animate-spin" />
                                <Sparkles size={20} className="absolute -top-2 -right-3 text-primary animate-pulse" />
                            </>
                        </div>

                        <div className="text-center">
                            <span className="text-[15px] font-bold uppercase tracking-[0.4em] text-primary">
                                Generating
                            </span>
                            <p className="text-[11px] font-medium uppercase tracking-widest text-base-content/20 mt-1">
                                Creating a new life
                            </p>
                        </div>
                    </div>
                </div>
            );

        }

        if (job.status === JobStatuses.error) {
            return (
                <div className="flex relative rounded-[1rem] border border-error/20 bg-error/[0.02] flex flex-col items-center justify-center min-h-[300px] py-8">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border border-base-content/5 flex items-center justify-center animate-pulse">
                                <CircleAlert size={32} strokeWidth={0.5} className="text-base-content/30" />
                            </div>
                        </div>

                        <div className="text-center">
                            <span className="text-[15px] font-bold uppercase tracking-[0.4em] text-error">
                                Error
                            </span>

                            <p className="text-[11px] font-medium uppercase tracking-widest text-base-content/20 mt-1">
                                Something went wrong
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        if (job.status === JobStatuses.completed) {
            return (
                <div className="flex relative rounded-[1rem] border border-base-content/10 bg-base-200/30 flex-col items-center justify-center min-h-[300px] overflow-hidden group py-8">
                    <img
                        key={job.result?.mediaUrl}
                        src={job.result?.mediaUrl}
                        className="absolute inset-0 w-full h-full object-cover transition-all duration-700 z-0 rounded-[1rem]"
                        alt="Generated"
                    />
                </div>
            );
        }
    }



    return (
        <div className="flex flex-col lg:flex-row gap-8 w-full items-start">
            <div className="relative rounded-[2.5rem] border border-base-content/5 bg-base-100 p-8 flex-9 flex-col justify-between shrink-0">
                <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                    {[
                        { label: "Ethnicity", key: "ethnicity", opts: AVATAR_PARAMETER_OPTIONS.ethnicity },
                        { label: "Skin Color", key: "skinColor", opts: AVATAR_PARAMETER_OPTIONS.skinColor },
                        { label: "Age", key: "age", opts: AVATAR_PARAMETER_OPTIONS.age },
                        { label: "Height", key: "height", opts: AVATAR_PARAMETER_OPTIONS.height },
                        { label: "Attractiveness", key: "attractiveness", opts: AVATAR_PARAMETER_OPTIONS[generalData.gender].attractiveness },
                        { label: "Body", key: "body", opts: AVATAR_PARAMETER_OPTIONS[generalData.gender].body },
                        { label: "Bust Size", key: "bustSize", opts: AVATAR_PARAMETER_OPTIONS.bustSize },
                        { label: "Face", key: "face", opts: AVATAR_PARAMETER_OPTIONS[generalData.gender].face },
                        { label: "Hair Style", key: "hairStyle", opts: AVATAR_PARAMETER_OPTIONS[generalData.gender].hairStyle },
                        { label: "Hair Color", key: "hairColor", opts: AVATAR_PARAMETER_OPTIONS[generalData.gender].hairColor },
                        { label: "Ears", key: "ears", opts: AVATAR_PARAMETER_OPTIONS.ears },
                        { label: "Nose", key: "nose", opts: AVATAR_PARAMETER_OPTIONS.nose },
                        { label: "Lips", key: "lips", opts: AVATAR_PARAMETER_OPTIONS.lips },
                        { label: "Eyes", key: "eyes", opts: AVATAR_PARAMETER_OPTIONS.eyes }, // Fixed the typo here
                        { label: "Eye Lashes", key: "eyeLashes", opts: AVATAR_PARAMETER_OPTIONS.eyeLashes },
                        { label: "Eye Brows", key: "eyeBrows", opts: AVATAR_PARAMETER_OPTIONS.eyeBrows },
                        { label: "Skin", key: "skin", opts: AVATAR_PARAMETER_OPTIONS[generalData.gender].skin },
                        { label: "Facial Hair", key: "facialHair", opts: AVATAR_PARAMETER_OPTIONS[generalData.gender].facialHair },
                        { label: "Body Hair", key: "bodyHair", opts: AVATAR_PARAMETER_OPTIONS.bodyHair },
                    ].map((field) => (
                        <div key={field.key} className={`group flex flex-col gap-0.5 ${stepData.finished ? 'opacity-50' : 'opacity-100'}`}>
                            <label className="text-[10px] font-medium uppercase tracking-[0.3em] text-base-content/20">
                                {field.label}
                            </label>

                            <div className="relative">
                                <select
                                    value={stepData.parameters[field.key as keyof typeof stepData.parameters]}
                                    disabled={stepData.finished}
                                    onChange={(e) => setParameters({...stepData.parameters, [field.key]: e.target.value})}
                                    className="w-full py-1.5 bg-transparent border-b border-base-content/10 focus:border-primary transition-all duration-500 outline-none text-base font-medium tracking-tight appearance-none cursor-pointer pr-8"
                                >
                                    <option value="" disabled>Select</option>
                                    {field.opts.map(o => <option key={o} value={o}>{o}</option>)}

                                </select>

                                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-base-content/20 group-hover:text-primary transition-colors">
                                    <ChevronDown size={16} strokeWidth={2.5} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={generateIdPhotos}
                    disabled={!isFormValid || (generatingStarted() && !generatingCompleted()) || stepData.finished || generationInitialized}
                    className={`btn btn-primary btn-dash group relative w-full h-14 mt-8 rounded-2xl transition-all duration-500 hover:scale-[1.01] ${stepData.finished ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                    {((generatingStarted() && !generatingCompleted()) || generationInitialized) && <span className="loading loading-spinner"></span>}
                    <span className="text-sm uppercase tracking-[0.4em]">Generate ID Photo</span>
                    <Sparkles size={20} className="ml-2 group-hover:rotate-12 transition-transform" />
                </button>
            </div>

            <div className="flex-4 relative flex flex-col items-center justify-top">
                <div className="flex items-center gap-6 px-4 py-2 bg-base-100/40 backdrop-blur-md border border-white/5 rounded-[1rem] shadow-sm hover:bg-base-100/60 transition-all duration-700 z-20">

                    <label className={`flex items-center gap-3 group/check ml-2 ${stepData.finished ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'}`}>
                        <div className="relative flex items-center justify-center">
                            <input
                                type="checkbox"
                                className={"peer sr-only"}
                                disabled={stepData.finished}
                                checked={stepData.carouselIndex === stepData.selectedVariant}
                                onChange={(e) => setSelectedVariant(e)}
                            />

                            <div className="w-5 h-5 border-2 border-base-content/10 rounded-md bg-white/5 transition-all duration-300 peer-checked:border-primary peer-checked:bg-primary/10 group-hover/check:border-base-content/30"></div>

                            <svg
                                className="absolute w-3.5 h-3.5 text-primary opacity-0 scale-50 transition-all duration-300 peer-checked:opacity-100 peer-checked:scale-100"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="4"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />

                            </svg>
                        </div>
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-base-content/40 group-hover/check:text-base-content/60 transition-colors">
                            Select
                        </span>
                    </label>

                    <div className="h-4 w-[1px] bg-white/10" />
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => incrementCarouselIndex(-1)}
                            className="p-1.5 rounded-full text-base-content/30 hover:text-primary transition-all active:scale-90 cursor-pointer"
                        >
                            <ChevronLeft size={22} strokeWidth={1.5} />
                        </button>

                        <div className="flex items-center justify-center min-w-[45px]">
                            <span className="text-[12px] font-medium tracking-[0.1em] text-base-content/40 tabular-nums">
                                {(stepData.carouselIndex + 1) || 1}
                                <span className="mx-1 opacity-20">/</span>
                                {stepData.variantSets?.length || 1}
                            </span>

                        </div>

                        <button
                            onClick={() => incrementCarouselIndex(1)}
                            className="p-1.5 rounded-full text-base-content/30 hover:text-primary transition-all active:scale-90 cursor-pointer"
                        >
                            <ChevronRight size={22} strokeWidth={1.5} />
                        </button>
                    </div>

                </div>

                {stepData.variantSets[stepData.carouselIndex].map((value, idx) => (
                    <div key={idx} className="w-full mt-5">
                        {renderPhotoArea(value, idx)}
                    </div>
                ))}
            </div>
        </div>
    );
}


export default GeneratePhotos;