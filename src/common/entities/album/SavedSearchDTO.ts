import {AlbumBaseDTO} from './AlbumBaseDTO';
import {PreviewPhotoDTO} from '../PhotoDTO';
import {SearchQueryDTO} from '../SearchQueryDTO';

export interface SavedSearchDTO extends AlbumBaseDTO {
  id: number;
  name: string;
  preview?: PreviewPhotoDTO;
  count: number;
  locked: boolean;

  searchQuery: SearchQueryDTO;
}
