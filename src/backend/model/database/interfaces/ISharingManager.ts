import {SharingDTO} from '../../../../common/entities/SharingDTO';
import {IObjectManager} from './IObjectManager';

export interface ISharingManager extends IObjectManager {
  findOne(filter: any): Promise<SharingDTO>;

  createSharing(sharing: SharingDTO): Promise<SharingDTO>;

  updateSharing(sharing: SharingDTO, forceUpdate: boolean): Promise<SharingDTO>;

  listAll(): Promise<SharingDTO[]>;

  deleteSharing(sharingKey: string): Promise<void>;
}
