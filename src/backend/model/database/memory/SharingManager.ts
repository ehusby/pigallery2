import {ISharingManager} from '../interfaces/ISharingManager';
import {SharingDTO} from '../../../../common/entities/SharingDTO';

export class SharingManager implements ISharingManager {

  deleteSharing(sharingKey: string): Promise<void> {
    throw new Error('not implemented');
  }

  listAll(): Promise<SharingDTO[]> {
    throw new Error('not implemented');
  }

  findOne(filter: any): Promise<SharingDTO> {
    throw new Error('not implemented');
  }

  createSharing(sharing: SharingDTO): Promise<SharingDTO> {
    throw new Error('not implemented');
  }

  updateSharing(sharing: SharingDTO, forceUpdate: boolean): Promise<SharingDTO> {
    throw new Error('not implemented');
  }


}
