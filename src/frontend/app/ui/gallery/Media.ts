import {Utils} from '../../../../common/Utils';
import {MediaIcon} from './MediaIcon';
import {Config} from '../../../../common/config/public/Config';
import {MediaDTO, MediaDTOUtils} from '../../../../common/entities/MediaDTO';

export class Media extends MediaIcon {

  static readonly sortedThumbnailSizes = Config.Client.Media.Thumbnail.thumbnailSizes
    .sort((a, b): number => a - b);

  constructor(media: MediaDTO, public renderWidth: number, public renderHeight: number) {
    super(media);
  }


  thumbnailLoaded(): void {
    if (!this.isThumbnailAvailable()) {
      this.media.readyThumbnails = this.media.readyThumbnails || [];
      this.media.readyThumbnails.push(this.getThumbnailSize());
    }
  }

  getThumbnailSize(): number {
    const longerEdge = Math.max(this.renderWidth, this.renderHeight);
    return Utils.findClosestinSorted(longerEdge, Media.sortedThumbnailSizes);
  }

  getReplacementThumbnailSize(): number {

    if (this.replacementSizeCache === false) {
      this.replacementSizeCache = null;

      const size = this.getThumbnailSize();
      if (!!this.media.readyThumbnails) {
        for (const item of this.media.readyThumbnails) {
          if (item < size) {
            this.replacementSizeCache = item;
            break;
          }
        }
      }
    }
    return this.replacementSizeCache as number;
  }

  isReplacementThumbnailAvailable(): boolean {
    return this.getReplacementThumbnailSize() !== null;
  }

  isThumbnailAvailable(): boolean {
    return this.media.readyThumbnails && this.media.readyThumbnails.indexOf(this.getThumbnailSize()) !== -1;
  }

  getReplacementThumbnailPath(): string {
    const size = this.getReplacementThumbnailSize();
    return Utils.concatUrls(Config.Client.urlBase,
      '/api/gallery/content/', this.getRelativePath(), 'thumbnail', size.toString());

  }

  hasPositionData(): boolean {
    return MediaDTOUtils.hasPositionData(this.media);
  }

  getThumbnailPath(): string {
    const size = this.getThumbnailSize();
    return Utils.concatUrls(Config.Client.urlBase,
      '/api/gallery/content/', this.getRelativePath(), 'thumbnail', size.toString());
  }


}
