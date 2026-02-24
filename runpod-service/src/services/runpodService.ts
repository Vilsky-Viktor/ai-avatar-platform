
import axios from 'axios';
import { getSecretValue } from './secrets';
import logger from '../logger';
import { Pod } from '../types/pod';

const RUNPOD_API_URL = `${process.env.RUNPOD_API_URL}/v1/pods`;

export const getPods = async (podName: string): Promise<Pod[]> => {
    const apiKey = await getSecretValue('RUNPOD_API_KEY');
    try {
        const response = await axios.get(RUNPOD_API_URL, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        return response.data.filter((pod: Pod) => pod.name = podName);
    } catch (error: any) {
        logger.error(`Failed to get Runpod pods: ${error.message}`)
        throw error;
    }
}

export const createPod = async (podName: string, region: string, networkVolumeId: string, templateId: string): Promise<Pod> => {
    const apiKey = await getSecretValue('RUNPOD_API_KEY');
    const podPayload = {
        "cloudType": "SECURE",
        "computeType": "GPU",
        "cpuFlavorIds": [
            "cpu3c"
        ],
        "cpuFlavorPriority": "availability",
        "dataCenterIds": [
            region
        ],
        "dataCenterPriority": "availability",
        "globalNetworking": false,
        "gpuCount": 1,
        "gpuTypeIds": [
            "NVIDIA RTX PRO 6000 Blackwell Workstation Edition",
            "NVIDIA H100 NVL",
            // "NVIDIA H200",
            // "NVIDIA H200 NVL"
        ],
        "gpuTypePriority": "availability",
        "interruptible": false,
        "locked": false,
        "name": podName,
        "networkVolumeId": networkVolumeId,
        "ports": ["8888/http"],
        "supportPublicIp": true,
        "templateId": templateId,
        "volumeMountPath": "/workspace"
    }

    try {
        const response = await axios.post(RUNPOD_API_URL, podPayload, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        return response.data;
    } catch (error: any) {
        logger.error(`Failed to get Runpod pods: ${error.message}`)
        throw error;
    }
}