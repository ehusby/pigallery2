import {IPreviewManager} from '../interfaces/IPreviewManager';
import {DirectoryPathDTO} from '../../../../common/entities/DirectoryDTO';
import {MediaDTO} from '../../../../common/entities/MediaDTO';
import {SavedSearchDTO} from '../../../../common/entities/album/SavedSearchDTO';

export class PreviewManager implements IPreviewManager {
  getAlbumPreview(album: SavedSearchDTO): Promise<MediaDTO> {
    throw new Error('not implemented');
  }
  getPreviewForDirectory(dir: DirectoryPathDTO): Promise<MediaDTO> {
    throw new Error('not implemented');
  }
}
