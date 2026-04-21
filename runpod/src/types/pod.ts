
export type Pod = {
    id: string;
    consumerUserId: string;
    containerDiskInGb: number;
    containerRegistryAuthId: string;
    costPerHr: number;
    createdAt: string;
    desiredStatus: string;
    env: object;
    gpuCount: number;
    imageName: string;
    lastStartedAt: string;
    lastStatusChange: string;
    machine: object;
    machineId: string;
    memoryInGb: number;
    name: string;
    networkVolumeId: string;
    ports: string[];
    publicIp: string;
    templateId: string;
    vcpuCount: number;
    volumeInGb: number;
    volumeMountPath: string;
}