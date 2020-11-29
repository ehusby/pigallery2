import {Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild} from '@angular/core';
import {GridMedia} from '../../grid/GridMedia';
import {MediaDTO} from '../../../../../../common/entities/MediaDTO';
import {DomSanitizer, SafeStyle} from '@angular/platform-browser';
import {SupportedFormats} from '../../../../../../common/SupportedFormats';
import {Config} from '../../../../../../common/config/public/Config';

@Component({
  selector: 'app-gallery-lightbox-media',
  styleUrls: ['./media.lightbox.gallery.component.css'],
  templateUrl: './media.lightbox.gallery.component.html'
})
export class GalleryLightboxMediaComponent implements OnChanges {

  @Input() gridMedia: GridMedia;
  @Input() loadMedia = false;
  @Input() windowAspect = 1;
  @Input() zoom = 1;
  @Input() drag = {x: 0, y: 0};
  @Output() videoSourceError = new EventEmitter();

  @ViewChild('video', {static: false}) video: ElementRef<HTMLVideoElement>;

  prevGirdPhoto: GridMedia = null;

  public imageSize = {width: 'auto', height: '100'};
  public imageLoadFinished = false;
  thumbnailSrc: string = null;
  photo = {
    src: <string>null,
    isBestFit: <boolean>null
  };
  public transcodeNeedVideos = SupportedFormats.TranscodeNeed.Videos;
  private mediaLoaded = false;
  private videoProgress = 0;

  constructor(public elementRef: ElementRef,
              private _sanitizer: DomSanitizer) {
  }

  get ImageTransform(): SafeStyle {
    return this._sanitizer.bypassSecurityTrustStyle('scale(' + this.zoom +
      ') translate(calc(' + -50 / this.zoom + '% + ' + this.drag.x / this.zoom + 'px), calc(' +
      -50 / this.zoom + '% + ' + this.drag.y / this.zoom + 'px))');
  }

  public get VideoProgress(): number {
    return this.videoProgress;
  }

  public set VideoProgress(value: number) {
    if (!this.video && value === null && typeof value === 'undefined') {
      return;
    }
    this.video.nativeElement.currentTime = this.video.nativeElement.duration * (value / 100);
    if (this.video.nativeElement.paused) {
      this.video.nativeElement.play().catch(console.error);
    }
  }

  public get VideoVolume(): number {
    if (!this.video) {
      return 1;
    }
    return this.video.nativeElement.volume;
  }

  public set VideoVolume(value: number) {
    if (!this.video) {
      return;
    }
    this.video.nativeElement.muted = false;
    this.video.nativeElement.volume = value;
  }

  public get Muted(): boolean {
    if (!this.video) {
      return false;
    }
    return this.video.nativeElement.muted;
  }

  public get Paused(): boolean {
    if (!this.video) {
      return true;
    }
    return this.video.nativeElement.paused;
  }


  private get ThumbnailUrl(): string {
    if (this.gridMedia.isThumbnailAvailable() === true) {
      return this.gridMedia.getThumbnailPath();
    }

    if (this.gridMedia.isReplacementThumbnailAvailable() === true) {
      return this.gridMedia.getReplacementThumbnailPath();
    }
    return null;
  }

  ngOnChanges() {
    // media changed
    if (this.prevGirdPhoto !== this.gridMedia) {
      this.prevGirdPhoto = this.gridMedia;
      this.thumbnailSrc = null;
      this.photo.src = null;
      this.mediaLoaded = false;
      this.imageLoadFinished = false;
      this.setImageSize();
    }
    if (this.thumbnailSrc == null && this.gridMedia && this.ThumbnailUrl !== null) {
      this.thumbnailSrc = this.ThumbnailUrl;
    }

    this.loadPhoto();

  }

  public mute() {
    if (!this.video) {
      return;
    }

    this.video.nativeElement.muted = !this.video.nativeElement.muted;
  }

  public playPause() {
    if (!this.video) {
      return;
    }
    if (this.video.nativeElement.paused) {
      this.video.nativeElement.play().catch(console.error);
    } else {
      this.video.nativeElement.pause();
    }
  }

  onImageError() {
    // TODO:handle error
    this.imageLoadFinished = true;
    console.error('Error: cannot load media for lightbox url: ' + this.gridMedia.getBestFitMediaPath());
  }

  onImageLoad() {
    this.imageLoadFinished = true;
    this.mediaLoaded = true;
  }

  public showThumbnail(): boolean {
    return this.gridMedia &&
      !this.mediaLoaded &&
      this.thumbnailSrc !== null &&
      (this.gridMedia.isThumbnailAvailable() || this.gridMedia.isReplacementThumbnailAvailable());
  }

  onSourceError($event: any) {
    this.mediaLoaded = false;
    this.videoSourceError.emit();
  }

  private loadPhoto() {
    if (!this.gridMedia || !this.loadMedia || !this.gridMedia.isPhoto()) {
      return;
    }

    if (this.zoom === 1) {
      if (this.photo.src == null) {
        if (Config.Client.Media.Photo.Converting.enabled === true) {
          this.photo.src = this.gridMedia.getBestFitMediaPath();
          this.photo.isBestFit = true;
        } else {
          this.photo.src = this.gridMedia.getMediaPath();
          this.photo.isBestFit = false;
        }
      }
      // on zoom load high res photo
    } else if ((this.photo.isBestFit === true || this.photo.src == null)) {
      this.photo.src = this.gridMedia.getMediaPath();
      this.photo.isBestFit = false;
    }
  }

  /** Video **/
  private onVideoProgress() {
    this.videoProgress = (100 / this.video.nativeElement.duration) * this.video.nativeElement.currentTime;
  }

  private setImageSize() {
    if (!this.gridMedia) {
      return;
    }


    const photoAspect = MediaDTO.calcAspectRatio(this.gridMedia.media);

    if (photoAspect < this.windowAspect) {
      this.imageSize.height = '100';
      this.imageSize.width = null;
    } else {
      this.imageSize.height = null;
      this.imageSize.width = '100';
    }
  }
}

