import {Media} from '../Media';
import {MediaDTO} from '../../../../../common/entities/MediaDTO';
import {PhotoDTO} from '../../../../../common/entities/PhotoDTO';
import {VideoDTO} from '../../../../../common/entities/VideoDTO';

export class GridMedia extends Media {


  constructor(media: MediaDTO, renderWidth: number, renderHeight: number, public rowId: number) {
    super(media, renderWidth, renderHeight);
  }

  get Video(): VideoDTO {
    return <VideoDTO>this.media;
  }

  get Photo(): PhotoDTO {
    return <PhotoDTO>this.media;
  }

  isPhoto(): boolean {
    return MediaDTO.isPhoto(this.media);
  }

  isVideo(): boolean {
    return MediaDTO.isVideo(this.media);
  }

  public isVideoTranscodingNeeded() {
    return MediaDTO.isVideoTranscodingNeeded(this.media);
  }
}
