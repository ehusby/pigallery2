import {Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Dimension, IRenderable} from '../../../../model/IRenderable';
import {GridMedia} from '../GridMedia';
import {SearchTypes} from '../../../../../../common/entities/AutoCompleteItem';
import {RouterLink} from '@angular/router';
import {Thumbnail, ThumbnailManagerService} from '../../thumbnailManager.service';
import {Config} from '../../../../../../common/config/public/Config';
import {PageHelper} from '../../../../model/page.helper';
import {PhotoDTO, PhotoMetadata} from '../../../../../../common/entities/PhotoDTO';

@Component({
  selector: 'app-gallery-grid-photo',
  templateUrl: './photo.grid.gallery.component.html',
  styleUrls: ['./photo.grid.gallery.component.css'],
  providers: [RouterLink]
})
export class GalleryPhotoComponent implements IRenderable, OnInit, OnDestroy {
  @Input() gridMedia: GridMedia;
  @ViewChild('img', {static: false}) imageRef: ElementRef;
  @ViewChild('photoContainer', {static: true}) container: ElementRef;

  thumbnail: Thumbnail;
  keywords: { value: string, type: SearchTypes }[] = null;
  infoBarVisible = false;
  animationTimer: number = null;

  readonly SearchTypes: typeof SearchTypes = SearchTypes;
  searchEnabled = true;

  wasInView: boolean = null;

  constructor(private thumbnailService: ThumbnailManagerService) {
    this.searchEnabled = Config.Client.Search.enabled;
  }

  get ScrollListener(): boolean {
    return !this.thumbnail.Available && !this.thumbnail.Error;
  }


  get Title(): string {
    if (Config.Client.Other.captionFirstNaming === false) {
      return this.gridMedia.media.name;
    }
    if ((<PhotoDTO>this.gridMedia.media).metadata.caption) {
      if ((<PhotoDTO>this.gridMedia.media).metadata.caption.length > 20) {
        return (<PhotoDTO>this.gridMedia.media).metadata.caption.substring(0, 17) + '...';
      }
      return (<PhotoDTO>this.gridMedia.media).metadata.caption;
    }
    return this.gridMedia.media.name;
  }

  ngOnInit() {
    this.thumbnail = this.thumbnailService.getThumbnail(this.gridMedia);
    const metadata = this.gridMedia.media.metadata as PhotoMetadata;
    if ((metadata.keywords && metadata.keywords.length > 0) ||
      (metadata.faces && metadata.faces.length > 0)) {
      this.keywords = [];
      if (Config.Client.Faces.enabled) {
        const names: string[] = (metadata.faces || []).map(f => f.name);
        this.keywords = names.filter((name, index) => names.indexOf(name) === index)
          .map(n => ({value: n, type: SearchTypes.person}));
      }
      this.keywords = this.keywords.concat((metadata.keywords || []).map(k => ({value: k, type: SearchTypes.keyword})));
    }

  }

  ngOnDestroy() {
    this.thumbnail.destroy();

    if (this.animationTimer != null) {
      clearTimeout(this.animationTimer);
    }
  }

  isInView(): boolean {
    return PageHelper.ScrollY < this.container.nativeElement.offsetTop + this.container.nativeElement.clientHeight
      && PageHelper.ScrollY + window.innerHeight > this.container.nativeElement.offsetTop;
  }

  onScroll() {
    if (this.thumbnail.Available === true || this.thumbnail.Error === true) {
      return;
    }
    const isInView = this.isInView();
    if (this.wasInView !== isInView) {
      this.wasInView = isInView;
      this.thumbnail.Visible = isInView;
    }
  }

  getPositionText(): string {
    if (!this.gridMedia || !this.gridMedia.isPhoto()) {
      return '';
    }
    return (<PhotoDTO>this.gridMedia.media).metadata.positionData.city ||
      (<PhotoDTO>this.gridMedia.media).metadata.positionData.state ||
      (<PhotoDTO>this.gridMedia.media).metadata.positionData.country;
  }

  mouseOver() {
    this.infoBarVisible = true;
    if (this.animationTimer != null) {
      clearTimeout(this.animationTimer);
      this.animationTimer = null;
    }
  }

  mouseOut() {
    if (this.animationTimer != null) {
      clearTimeout(this.animationTimer);
    }
    this.animationTimer = window.setTimeout(() => {
      this.animationTimer = null;
      this.infoBarVisible = false;
    }, 500);
  }

  public getDimension(): Dimension {
    if (!this.imageRef) {
      return <Dimension>{
        top: 0,
        left: 0,
        width: 0,
        height: 0
      };
    }

    return <Dimension>{
      top: this.imageRef.nativeElement.offsetTop,
      left: this.imageRef.nativeElement.offsetLeft,
      width: this.imageRef.nativeElement.width,
      height: this.imageRef.nativeElement.height
    };
  }

}

