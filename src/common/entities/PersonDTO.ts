import {FaceRegionEntry} from '../../backend/model/database/sql/enitites/FaceRegionEntry';

export interface PersonWithSampleRegion extends PersonDTO {
  sampleRegion: FaceRegionEntry;
}

export interface PersonDTO {
  id: number;
  name: string;
  count: number;
  readyThumbnail?: boolean;
  isFavourite: boolean;
}


