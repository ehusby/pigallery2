import {DirectoryDTO} from './DirectoryDTO';
import {PhotoDTO} from './PhotoDTO';
import {FileDTO} from './FileDTO';
import {SupportedFormats} from '../SupportedFormats';

export interface MediaDTO extends FileDTO {
  id: number;
  name: string;
  directory: DirectoryDTO;
  metadata: MediaMetadata;
  readyThumbnails: Array<number>;
  readyIcon: boolean;

}


export interface MediaMetadata {
  size: MediaDimension;
  creationDate: number;
  fileSize: number;
}


export interface MediaDimension {
  width: number;
  height: number;
}

export module MediaDTO {
  export const hasPositionData = (media: MediaDTO): boolean => {
    return !!(<PhotoDTO>media).metadata.positionData &&
      !!((<PhotoDTO>media).metadata.positionData.city ||
        (<PhotoDTO>media).metadata.positionData.state ||
        (<PhotoDTO>media).metadata.positionData.country ||
        ((<PhotoDTO>media).metadata.positionData.GPSData &&
          (<PhotoDTO>media).metadata.positionData.GPSData.altitude &&
          (<PhotoDTO>media).metadata.positionData.GPSData.latitude &&
          (<PhotoDTO>media).metadata.positionData.GPSData.longitude));
  };

  export const isPhoto = (media: FileDTO): boolean => {
    return !MediaDTO.isVideo(media);
  };

  export const isVideo = (media: FileDTO): boolean => {
    const lower = media.name.toLowerCase();
    for (const ext of SupportedFormats.WithDots.Videos) {
      if (lower.endsWith(ext)) {
        return true;
      }
    }
    return false;
  };

  export const isVideoPath = (path: string): boolean => {
    const lower = path.toLowerCase();
    for (const ext of SupportedFormats.WithDots.Videos) {
      if (lower.endsWith(ext)) {
        return true;
      }
    }
    return false;
  };

  export const isVideoTranscodingNeeded = (media: FileDTO): boolean => {
    const lower = media.name.toLowerCase();
    for (const ext of SupportedFormats.WithDots.TranscodeNeed.Videos) {
      if (lower.endsWith(ext)) {
        return true;
      }
    }
    return false;
  };


  export const calcAspectRatio = (photo: MediaDTO): number => {
    return photo.metadata.size.width / photo.metadata.size.height;
  };
}
