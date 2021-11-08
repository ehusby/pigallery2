import {Utils} from '../../../../common/Utils';
import {Config} from '../../../../common/config/public/Config';
import {MediaDTO} from '../../../../common/entities/MediaDTO';

export class MediaIcon {


  protected replacementSizeCache: number | boolean = false;

  constructor(public media: MediaDTO) {

  }

  getExtension(): string {
    return this.media.name.substr(this.media.name.lastIndexOf('.') + 1);
  }

  iconLoaded(): void {
    this.media.readyIcon = true;
  }

  isIconAvailable(): boolean {
    return this.media.readyIcon;
  }

  getRelativePath(): string {
    return encodeURI(Utils.concatUrls(this.media.directory.path,
      this.media.directory.name,
      this.media.name))
      // do not escape all urls with encodeURIComponent because that make the URL ugly and not needed
      // do not escape before concatUrls as that would make prevent optimizations
      // .replace(new RegExp('%', 'g'), '%25') // order important
      .replace(new RegExp('#', 'g'), '%23')
      .replace(new RegExp('\\$', 'g'), '%24');
  }

  getIconPath(): string {
    return Utils.concatUrls(Config.Client.urlBase,
      '/api/gallery/content/',
      this.getRelativePath(), 'icon');
  }

  getMediaPath(): string {
    return Utils.concatUrls(Config.Client.urlBase,
      '/api/gallery/content/', this.getRelativePath());
  }

  getBestFitMediaPath(): string {
    return Utils.concatUrls(this.getMediaPath(), '/bestFit');
  }


  equals(other: MediaDTO | MediaIcon): boolean {
    // is gridphoto
    if (other instanceof MediaIcon) {
      return this.media.directory.path === other.media.directory.path &&
        this.media.directory.name === other.media.directory.name && this.media.name === other.media.name;
    }

    // is media
    if (other.directory) {
      return this.media.directory.path === other.directory.path &&
        this.media.directory.name === other.directory.name && this.media.name === other.name;
    }

    return false;
  }
}
