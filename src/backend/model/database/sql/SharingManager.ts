import {ISharingManager} from '../interfaces/ISharingManager';
import {SharingDTO} from '../../../../common/entities/SharingDTO';
import {SQLConnection} from './SQLConnection';
import {SharingEntity} from './enitites/SharingEntity';
import {Config} from '../../../../common/config/private/Config';
import {PasswordHelper} from '../../PasswordHelper';
import {DeleteResult} from 'typeorm';

export class SharingManager implements ISharingManager {

  private static async removeExpiredLink(): Promise<DeleteResult> {
    const connection = await SQLConnection.getConnection();
    return await connection
      .getRepository(SharingEntity)
      .createQueryBuilder('share')
      .where('expires < :now', {now: Date.now()})
      .delete()
      .execute();
  }

  async deleteSharing(sharingKey: string): Promise<void> {
    const connection = await SQLConnection.getConnection();
    const sharing = await connection.getRepository(SharingEntity).findOne({sharingKey: sharingKey});
    await connection.getRepository(SharingEntity).remove(sharing);
  }

  async listAll(): Promise<SharingDTO[]> {
    await SharingManager.removeExpiredLink();
    const connection = await SQLConnection.getConnection();
    return await connection.getRepository(SharingEntity)
      .createQueryBuilder('share')
      .leftJoinAndSelect('share.creator', 'creator').getMany();
  }

  async findOne(filter: any): Promise<SharingDTO> {
    await SharingManager.removeExpiredLink();
    const connection = await SQLConnection.getConnection();
    return await connection.getRepository(SharingEntity).findOne(filter);
  }

  async createSharing(sharing: SharingDTO): Promise<SharingDTO> {
    await SharingManager.removeExpiredLink();
    const connection = await SQLConnection.getConnection();
    if (sharing.password) {
      sharing.password = PasswordHelper.cryptPassword(sharing.password);
    }
    return connection.getRepository(SharingEntity).save(sharing);
  }

  async updateSharing(inSharing: SharingDTO, forceUpdate: boolean): Promise<SharingDTO> {
    const connection = await SQLConnection.getConnection();

    const sharing = await connection.getRepository(SharingEntity).findOne({
      id: inSharing.id,
      creator: <any>inSharing.creator.id,
      path: inSharing.path
    });

    if (sharing.timeStamp < Date.now() - Config.Server.Sharing.updateTimeout && forceUpdate !== true) {
      throw new Error('Sharing is locked, can\'t update anymore');
    }
    if (inSharing.password == null) {
      sharing.password = null;
    } else {
      sharing.password = PasswordHelper.cryptPassword(inSharing.password);
    }
    sharing.includeSubfolders = inSharing.includeSubfolders;
    sharing.expires = inSharing.expires;

    return connection.getRepository(SharingEntity).save(sharing);
  }


}
