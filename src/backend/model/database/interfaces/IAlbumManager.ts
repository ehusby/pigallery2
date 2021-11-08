import {SearchQueryDTO} from '../../../../common/entities/SearchQueryDTO';
import {AlbumBaseDTO} from '../../../../common/entities/album/AlbumBaseDTO';
import {IObjectManager} from './IObjectManager';

export interface IAlbumManager extends IObjectManager{
  /**
   * Creates a saved search type of album
   */
  addSavedSearch(name: string, searchQuery: SearchQueryDTO, lockedAlbum?: boolean): Promise<void>;


  /**
   * Creates a saved search type of album if the album is not yet exists
   * lockAlbum: Album cannot be removed from the UI
   */
  addIfNotExistSavedSearch(name: string, searchQuery: SearchQueryDTO, lockedAlbum?: boolean): Promise<void>;

  /**
   * Deletes an album
   */
  deleteAlbum(id: number): Promise<void>;

  /**
   * Returns with all albums
   */
  getAlbums(): Promise<AlbumBaseDTO[]>;

  /**
   * Updates previews and album counts
   */
  onNewDataVersion(): Promise<void>;
}
