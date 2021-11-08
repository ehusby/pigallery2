import {PreviewPhotoDTO} from '../../../../common/entities/PhotoDTO';
import {IObjectManager} from './IObjectManager';
import {SearchQueryDTO} from '../../../../common/entities/SearchQueryDTO';

export interface IPreviewManager extends IObjectManager {
  getPreviewForDirectory(dir: { id: number, name: string, path: string }): Promise<PreviewPhotoDTOWithID>;

  getAlbumPreview(album: { searchQuery: SearchQueryDTO }): Promise<PreviewPhotoDTOWithID>;
}

// ID is need within the backend so it can be saved to DB (ID is the external key)
export interface PreviewPhotoDTOWithID extends PreviewPhotoDTO {
  id: number;
}
