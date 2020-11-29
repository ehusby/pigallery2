import {SharingDTO} from '../../../../common/entities/SharingDTO';

export interface ISharingManager {
  findOne(filter: any): Promise<SharingDTO>;

  createSharing(sharing: SharingDTO): Promise<SharingDTO>;

  updateSharing(sharing: SharingDTO, forceUpdate: boolean): Promise<SharingDTO>;

  listAll(): Promise<SharingDTO[]>;

  deleteSharing(sharingKey: string): Promise<void>;
}
