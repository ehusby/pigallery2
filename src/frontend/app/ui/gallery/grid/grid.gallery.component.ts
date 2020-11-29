import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {PhotoDTO} from '../../../../../common/entities/PhotoDTO';
import {GridRowBuilder} from './GridRowBuilder';
import {GalleryLightboxComponent} from '../lightbox/lightbox.gallery.component';
import {GridMedia} from './GridMedia';
import {GalleryPhotoComponent} from './photo/photo.grid.gallery.component';
import {OverlayService} from '../overlay.service';
import {Config} from '../../../../../common/config/public/Config';
import {PageHelper} from '../../../model/page.helper';
import {Subscription} from 'rxjs';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {QueryService} from '../../../model/query.service';
import {GalleryService} from '../gallery.service';
import {SortingMethods} from '../../../../../common/entities/SortingMethods';
import {MediaDTO} from '../../../../../common/entities/MediaDTO';
import {QueryParams} from '../../../../../common/QueryParams';
import {SeededRandomService} from '../../../model/seededRandom.service';

@Component({
  selector: 'app-gallery-grid',
  templateUrl: './grid.gallery.component.html',
  styleUrls: ['./grid.gallery.component.css'],
})
export class GalleryGridComponent implements OnChanges, OnInit, AfterViewInit, OnDestroy {

  @ViewChild('gridContainer', {static: false}) gridContainer: ElementRef;
  @ViewChildren(GalleryPhotoComponent) gridPhotoQL: QueryList<GalleryPhotoComponent>;
  @Input() media: MediaDTO[];
  @Input() lightbox: GalleryLightboxComponent;
  photosToRender: Array<GridMedia> = [];
  containerWidth = 0;
  screenHeight = 0;
  public IMAGE_MARGIN = 2;
  isAfterViewInit = false;
  subscriptions: {
    route: Subscription,
    sorting: Subscription
  } = {
    route: null,
    sorting: null
  };
  delayedRenderUpToPhoto: string = null;
  private scrollListenerPhotos: GalleryPhotoComponent[] = [];
  private TARGET_COL_COUNT = 5;
  private MIN_ROW_COUNT = 2;
  private MAX_ROW_COUNT = 5;
  private onScrollFired = false;
  private helperTime: number = null;
  private renderedPhotoIndex = 0;

  constructor(private overlayService: OverlayService,
              private changeDetector: ChangeDetectorRef,
              public queryService: QueryService,
              private router: Router,
              public galleryService: GalleryService,
              private route: ActivatedRoute,
              private rndService: SeededRandomService) {
  }

  ngOnInit() {
    this.subscriptions.route = this.route.queryParams.subscribe((params: Params) => {
      if (params[QueryParams.gallery.photo] && params[QueryParams.gallery.photo] !== '') {
        this.delayedRenderUpToPhoto = params[QueryParams.gallery.photo];
        if (!this.media || this.media.length === 0) {
          return;
        }

        this.renderUpToMedia(params[QueryParams.gallery.photo]);
      }
    });
    this.subscriptions.sorting = this.galleryService.sorting.subscribe(() => {
      this.clearRenderedPhotos();
      this.sortPhotos();
      this.renderPhotos();
    });
  }

  ngOnChanges() {
    if (this.isAfterViewInit === false) {
      return;
    }
    this.updateContainerDimensions();
    this.sortPhotos();
    this.mergeNewPhotos();
    this.helperTime = window.setTimeout(() => {
      this.renderPhotos();
      if (this.delayedRenderUpToPhoto) {
        this.renderUpToMedia(this.delayedRenderUpToPhoto);
      }
    }, 0);
  }

  ngOnDestroy() {

    if (this.helperTime != null) {
      clearTimeout(this.helperTime);
    }
    if (this.subscriptions.route !== null) {
      this.subscriptions.route.unsubscribe();
      this.subscriptions.route = null;
    }
    if (this.subscriptions.sorting !== null) {
      this.subscriptions.sorting.unsubscribe();
      this.subscriptions.sorting = null;
    }
  }

  @HostListener('window:resize')
  onResize() {
    if (this.isAfterViewInit === false) {
      return;
    }
    // render the same amount of images on resize
    const renderedIndex = this.renderedPhotoIndex;
    // do not rerender if container is not changes
    if (this.updateContainerDimensions() === false) {
      return;
    }
    this.sortPhotos();
    this.renderPhotos(renderedIndex);
  }

  photoClicked(media: MediaDTO) {
    this.router.navigate([], {queryParams: this.queryService.getParams(media)});
  }


  ngAfterViewInit() {
    this.lightbox.setGridPhotoQL(this.gridPhotoQL);

    if (Config.Client.Other.enableOnScrollThumbnailPrioritising === true) {
      this.gridPhotoQL.changes.subscribe(() => {
        this.scrollListenerPhotos = this.gridPhotoQL.filter(pc => pc.ScrollListener);
      });
    }

    this.updateContainerDimensions();
    this.sortPhotos();
    this.clearRenderedPhotos();
    this.helperTime = window.setTimeout(() => {
      this.renderPhotos();
    }, 0);
    this.isAfterViewInit = true;
  }

  public renderARow(): number {
    if (this.renderedPhotoIndex >= this.media.length
      || this.containerWidth === 0) {
      return null;
    }

    let maxRowHeight = this.screenHeight / this.MIN_ROW_COUNT;
    const minRowHeight = this.screenHeight / this.MAX_ROW_COUNT;

    const photoRowBuilder = new GridRowBuilder(this.media,
      this.renderedPhotoIndex,
      this.IMAGE_MARGIN,
      this.containerWidth - this.overlayService.getPhantomScrollbarWidth()
    );

    photoRowBuilder.addPhotos(this.TARGET_COL_COUNT);
    photoRowBuilder.adjustRowHeightBetween(minRowHeight, maxRowHeight);

    // little trick: We don't want too big single images. But if a little extra height helps fit the row, its ok
    if (photoRowBuilder.getPhotoRow().length > 1) {
      maxRowHeight *= 1.2;
    }
    const rowHeight = Math.min(photoRowBuilder.calcRowHeight(), maxRowHeight);
    const imageHeight = rowHeight - (this.IMAGE_MARGIN * 2);

    photoRowBuilder.getPhotoRow().forEach((photo) => {
      const imageWidth = imageHeight * MediaDTO.calcAspectRatio(photo);
      this.photosToRender.push(new GridMedia(photo, imageWidth, imageHeight, this.renderedPhotoIndex));
    });

    this.renderedPhotoIndex += photoRowBuilder.getPhotoRow().length;
    return rowHeight;
  }

  @HostListener('window:scroll')
  onScroll() {
    if (!this.onScrollFired &&
      // should we trigger this at all?
      (this.renderedPhotoIndex < this.media.length || this.scrollListenerPhotos.length > 0)) {
      window.requestAnimationFrame(() => {
        this.renderPhotos();

        if (Config.Client.Other.enableOnScrollThumbnailPrioritising === true) {
          this.scrollListenerPhotos.forEach((pc: GalleryPhotoComponent) => {
            pc.onScroll();
          });
          this.scrollListenerPhotos = this.scrollListenerPhotos.filter(pc => pc.ScrollListener);
        }

        this.onScrollFired = false;
      });
      this.onScrollFired = true;
    }
  }

  private renderUpToMedia(mediaStringId: string) {
    const index = this.media.findIndex(p => this.queryService.getMediaStringId(p) === mediaStringId);
    if (index === -1) {
      this.router.navigate([], {queryParams: this.queryService.getParams()});
      return;
    }
    while (this.renderedPhotoIndex < index && this.renderARow()) {
    }
  }

  private clearRenderedPhotos() {
    this.photosToRender = [];
    this.renderedPhotoIndex = 0;
    this.changeDetector.detectChanges();
  }

  private sortPhotos() {
    switch (this.galleryService.sorting.value) {
      case SortingMethods.ascName:
        this.media.sort((a: PhotoDTO, b: PhotoDTO) => {
          if (a.name.toLowerCase() < b.name.toLowerCase()) {
            return -1;
          }
          if (a.name.toLowerCase() > b.name.toLowerCase()) {
            return 1;
          }
          return 0;
        });
        break;
      case SortingMethods.descName:
        this.media.sort((a: PhotoDTO, b: PhotoDTO) => {
          if (a.name.toLowerCase() < b.name.toLowerCase()) {
            return 1;
          }
          if (a.name.toLowerCase() > b.name.toLowerCase()) {
            return -1;
          }
          return 0;
        });
        break;
      case SortingMethods.ascDate:
        this.media.sort((a: PhotoDTO, b: PhotoDTO) => {
          return a.metadata.creationDate - b.metadata.creationDate;
        });
        break;
      case SortingMethods.descDate:
        this.media.sort((a: PhotoDTO, b: PhotoDTO) => {
          return b.metadata.creationDate - a.metadata.creationDate;
        });
        break;
      case SortingMethods.random:
        this.rndService.setSeed(this.media.length);
        this.media.sort((a: PhotoDTO, b: PhotoDTO) => {
          if (a.name.toLowerCase() < b.name.toLowerCase()) {
            return -1;
          }
          if (a.name.toLowerCase() > b.name.toLowerCase()) {
            return 1;
          }
          return 0;
        }).sort(() => {
          return this.rndService.get() - 0.5;
        });
        break;
    }


  }

  private mergeNewPhotos() {
    // merge new data with old one
    let lastSameIndex = 0;
    let lastRowId = null;
    let i = 0;
    for (; i < this.media.length && i < this.photosToRender.length; ++i) {

      // If a media changed the whole row has to be removed
      if (this.photosToRender[i].rowId !== lastRowId) {
        lastSameIndex = i;
        lastRowId = this.photosToRender[i].rowId;
      }
      if (this.photosToRender[i].equals(this.media[i]) === false) {
        break;
      }
    }
    // if all the same
    if (this.photosToRender.length > 0 &&
      i === this.photosToRender.length &&
      i === this.media.length &&
      this.photosToRender[i - 1].equals(this.media[i - 1])) {
      lastSameIndex = i;
    }
    if (lastSameIndex > 0) {
      this.photosToRender.splice(lastSameIndex, this.photosToRender.length - lastSameIndex);
      this.renderedPhotoIndex = lastSameIndex;
    } else {
      this.clearRenderedPhotos();
    }

  }

  /**
   * Returns true, if scroll is >= 70% to render more images.
   * Or of onscroll rendering is off: return always to render all the images at once
   * @param offset Add height to the client height (content is not yet added to the dom, but calculate with it)
   * @returns {boolean}
   */
  private shouldRenderMore(offset: number = 0): boolean {
    return Config.Client.Other.enableOnScrollRendering === false ||
      PageHelper.ScrollY >= (document.body.clientHeight + offset - window.innerHeight) * 0.7
      || (document.body.clientHeight + offset) * 0.85 < window.innerHeight;
  }

  private renderPhotos(numberOfPhotos: number = 0) {
    if (this.containerWidth === 0 ||
      this.renderedPhotoIndex >= this.media.length ||
      !this.shouldRenderMore()) {
      return;
    }


    let renderedContentHeight = 0;

    while (this.renderedPhotoIndex < this.media.length &&
    (this.shouldRenderMore(renderedContentHeight) === true ||
      this.renderedPhotoIndex < numberOfPhotos)) {
      const ret = this.renderARow();
      if (ret === null) {
        throw new Error('Grid media rendering failed');
      }
      renderedContentHeight += ret;
    }
  }

  private updateContainerDimensions(): boolean {
    if (!this.gridContainer) {
      return false;
    }

    const pre = PageHelper.isScrollYVisible();
    PageHelper.showScrollY();
    // if the width changed a bit or the height changed a lot
    if (this.containerWidth !== this.gridContainer.nativeElement.clientWidth
      || this.screenHeight < window.innerHeight * 0.75
      || this.screenHeight > window.innerHeight * 1.25) {
      this.screenHeight = window.innerHeight;
      this.containerWidth = this.gridContainer.nativeElement.clientWidth;
      this.clearRenderedPhotos();
      if (!pre) {
        PageHelper.hideScrollY();
      }
      return true;
    }

    if (!pre) {
      PageHelper.hideScrollY();
    }
    return false;
  }


}



