import {AlbumBaseDTO} from '../../../../common/entities/album/AlbumBaseDTO';
import {SearchQueryDTO} from '../../../../common/entities/SearchQueryDTO';
import {IAlbumManager} from '../interfaces/IAlbumManager';

export class AlbumManager implements IAlbumManager {
  onNewDataVersion(): Promise<void> {
    throw new Error('not supported by memory DB');
  }

  public async onGalleryIndexUpdate(): Promise<void> {
    throw new Error('not supported by memory DB');
  }

  public async addIfNotExistSavedSearch(name: string, searchQuery: SearchQueryDTO, lockedAlbum?: boolean): Promise<void> {
    throw new Error('not supported by memory DB');
  }

  public async addSavedSearch(name: string, searchQuery: SearchQueryDTO, lockedAlbum?: boolean): Promise<void> {
    throw new Error('not supported by memory DB');
  }

  public async deleteAlbum(id: number): Promise<void> {
    throw new Error('not supported by memory DB');
  }

  public async getAlbums(): Promise<AlbumBaseDTO[]> {
    throw new Error('not supported by memory DB');
  }
}
