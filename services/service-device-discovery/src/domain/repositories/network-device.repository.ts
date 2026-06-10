import { NetworkDevice } from '../entities/network-device.entity';

export interface INetworkDeviceRepository {
  upsert(device: NetworkDevice): Promise<NetworkDevice>;
  findAllByUserId(userId: string): Promise<NetworkDevice[]>;
  findByScanId(scanId: string, userId: string): Promise<NetworkDevice[]>;
}

export const NETWORK_DEVICE_REPOSITORY = Symbol('NETWORK_DEVICE_REPOSITORY');
