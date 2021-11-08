import {Component, ElementRef, HostListener, Input, OnChanges, ViewChild} from '@angular/core';
import {PhotoDTO} from '../../../../../../common/entities/PhotoDTO';
import {Dimension} from '../../../../model/IRenderable';
import {FullScreenService} from '../../fullscreen.service';
import {IconThumbnail, Thumbnail, ThumbnailBase, ThumbnailManagerService} from '../../thumbnailManager.service';
import {MediaIcon} from '../../MediaIcon';
import {Media} from '../../Media';
import {PageHelper} from '../../../../model/page.helper';
import {FileDTO} from '../../../../../../common/entities/FileDTO';
import {Utils} from '../../../../../../common/Utils';
import {Config} from '../../../../../../common/config/public/Config';
import {MapService} from '../map.service';
import {
  control,
  Control,
  divIcon,
  icon,
  LatLng,
  latLng,
  latLngBounds,
  layerGroup,
  LayerGroup,
  Map,
  MapOptions,
  Marker,
  marker,
  markerClusterGroup,
  MarkerClusterGroup,
  Point,
  polyline,
  tileLayer
} from 'leaflet';
import {LeafletControlLayersConfig} from '@asymmetrik/ngx-leaflet';

@Component({
  selector: 'app-gallery-map-lightbox',
  styleUrls: ['./lightbox.map.gallery.component.css'],
  templateUrl: './lightbox.map.gallery.component.html',
})
export class GalleryMapLightboxComponent implements OnChanges {


  @Input() photos: PhotoDTO[];
  @Input() gpxFiles: FileDTO[];
  public lightboxDimension: Dimension = {top: 0, left: 0, width: 0, height: 0} as Dimension;
  public mapDimension: Dimension = {top: 0, left: 0, width: 0, height: 0} as Dimension;
  public visible = false;
  public controllersVisible = false;
  public opacity = 1.0;
  @ViewChild('root', {static: true}) elementRef: ElementRef;
  public mapOptions: MapOptions = {
    zoom: 2,
    // setting max zoom is needed to MarkerCluster https://github.com/Leaflet/Leaflet.markercluster/issues/611
    maxZoom: 2,
    center: latLng(0, 0)
  };
  private smallIconSize = new Point(Config.Client.Media.Thumbnail.iconSize * 0.75, Config.Client.Media.Thumbnail.iconSize * 0.75);
  private iconSize = new Point(Config.Client.Media.Thumbnail.iconSize, Config.Client.Media.Thumbnail.iconSize);
  private usedIconSize = this.iconSize;
  private mapLayersControlOption: LeafletControlLayersConfig & { overlays: { Photos: MarkerClusterGroup, Paths: LayerGroup } } =
    {
      baseLayers: {}, overlays: {
        Photos: markerClusterGroup({
          maxClusterRadius: 20,
          iconCreateFunction: (cluster) => {
            const childCount = cluster.getChildCount();
            let size: number;
            let c = ' marker-cluster-';
            if (childCount < 10) {
              c += 'small';
              size = 30;
            } else if (childCount < 100) {
              c += 'medium';
              size = 40;
            } else {
              c += 'large';
              size = 50;
            }

            return divIcon({
              html: '<div><span>' + childCount + '</span></div>',
              className: 'marker-cluster' + c,
              iconSize: new Point(size, size)
            });
          }
        }), Paths: layerGroup([])
      }
    };
  private mapLayerControl: Control.Layers;
  private thumbnailsOnLoad: ThumbnailBase[] = [];
  private startPosition: Dimension = null;
  private leafletMap: Map;

  constructor(public fullScreenService: FullScreenService,
              private thumbnailService: ThumbnailManagerService,
              public mapService: MapService) {
    this.mapOptions.layers = [this.mapLayersControlOption.overlays.Photos,
      this.mapLayersControlOption.overlays.Paths];
    for (let i = 0; i < mapService.Layers.length; ++i) {
      const l = mapService.Layers[i];
      const tl = tileLayer(l.url, {attribution: mapService.Attributions});
      if (i === 0) {
        this.mapOptions.layers.push(tl);
      }
      this.mapLayersControlOption.baseLayers[l.name] = tl;
    }

    this.mapLayerControl = control.layers(this.mapLayersControlOption.baseLayers,
      this.mapLayersControlOption.overlays, {position: 'bottomright'});
  }

  private static getScreenWidth(): number {
    return window.innerWidth;
  }

  private static getScreenHeight(): number {
    return window.innerHeight;
  }

  ngOnChanges(): void {
    if (this.visible === false) {
      return;
    }
    this.showImages();

  }

  @HostListener('window:resize', ['$event'])
  async onResize(): Promise<void> {
    this.lightboxDimension = ({
      top: 0,
      left: 0,
      width: GalleryMapLightboxComponent.getScreenWidth(),
      height: GalleryMapLightboxComponent.getScreenHeight()
    } as Dimension);
    this.mapDimension = ({
      top: 0,
      left: 0,
      width: GalleryMapLightboxComponent.getScreenWidth(),
      height: GalleryMapLightboxComponent.getScreenHeight()
    } as Dimension);
    await Utils.wait(0);
    this.leafletMap.invalidateSize();
  }

  public async show(position: Dimension): Promise<void> {
    this.hideImages();
    this.visible = true;
    this.opacity = 1.0;
    this.startPosition = position;
    this.lightboxDimension = position;
    this.lightboxDimension.top -= PageHelper.ScrollY;
    this.mapDimension = ({
      top: 0,
      left: 0,
      width: GalleryMapLightboxComponent.getScreenWidth(),
      height: GalleryMapLightboxComponent.getScreenHeight()
    } as Dimension);
    this.showImages();
    //  this.centerMap();
    PageHelper.hideScrollY();
    await Utils.wait(0);
    this.lightboxDimension = ({
      top: 0,
      left: 0,
      width: GalleryMapLightboxComponent.getScreenWidth(),
      height: GalleryMapLightboxComponent.getScreenHeight()
    } as Dimension);
    await Utils.wait(350);
    this.leafletMap.invalidateSize();
    this.centerMap();
    this.controllersVisible = true;
  }

  public hide(): void {
    this.fullScreenService.exitFullScreen();
    this.controllersVisible = false;
    const to = this.startPosition;

    // iff target image out of screen -> scroll to there
    if (PageHelper.ScrollY > to.top || PageHelper.ScrollY + GalleryMapLightboxComponent.getScreenHeight() < to.top) {
      PageHelper.ScrollY = to.top;
    }

    this.lightboxDimension = this.startPosition;
    this.lightboxDimension.top -= PageHelper.ScrollY;
    PageHelper.showScrollY();
    this.opacity = 0.0;
    setTimeout((): void => {
      this.visible = false;
      this.hideImages();
      this.leafletMap.setZoom(2);
    }, 500);
  }

  showImages(): void {
    this.hideImages();


    // make sure to enable photos layers when opening map
    if (this.leafletMap && !this.leafletMap.hasLayer(this.mapLayersControlOption.overlays.Photos)) {
      this.leafletMap.addLayer(this.mapLayersControlOption.overlays.Photos);
    }
    this.thumbnailsOnLoad = [];
    this.photos.filter((p): number => {
      return p.metadata && p.metadata.positionData && p.metadata.positionData.GPSData
        && p.metadata.positionData.GPSData.latitude
        && p.metadata.positionData.GPSData.longitude;
    }).forEach((p): void => {
      const mkr = marker({
        lat: p.metadata.positionData.GPSData.latitude,
        lng: p.metadata.positionData.GPSData.longitude
      });
      this.mapLayersControlOption.overlays.Photos.addLayer(mkr);
      let width = 500;
      let height = 500;
      const size = p.metadata.size;
      if (size.width > size.height) {
        height = width * (size.height / size.width);
      } else {
        width = height * (size.width / size.height);
      }
      const photoTh = this.thumbnailService.getLazyThumbnail(new Media(p, width, height));
      this.thumbnailsOnLoad.push(photoTh);

      // Setting popup photo
      const setPopUpPhoto = () => {
        const photoPopup = `<img style="width: ${width}px; height: ${height}px" ` +
          `src="${photoTh.Src}" alt="preview">`;
        if (!mkr.getPopup()) {
          mkr.bindPopup(photoPopup, {minWidth: width});
        } else {
          mkr.setPopupContent(photoPopup);
        }
      };

      if (photoTh.Available) {
        setPopUpPhoto();
      } else {
        const noPhotoPopup = `<div class="lightbox-map-gallery-component-preview-loading"
                                 style="width: ${width}px; height: ${height}px">
                  <span class="oi ${photoTh.Error ? 'oi-warning' : 'oi-image'}"
                        aria-hidden="true">
                  </span>
                  </div>`;

        mkr.bindPopup(noPhotoPopup, {minWidth: width});
        mkr.on('popupopen', () => {
          photoTh.load();
          photoTh.CurrentlyWaiting = true;
        });
        photoTh.OnLoad = setPopUpPhoto;
      }

      // Setting photo icon
      if (Config.Client.Map.useImageMarkers === true) {
        mkr.on('add', () => {
          mkr.off('add');
          const iconTh = this.thumbnailService.getIcon(new MediaIcon(p));
          this.thumbnailsOnLoad.push(iconTh);
          iconTh.Visible = true;
          const setIcon = () => {
            mkr.setIcon(icon({
              iconUrl: iconTh.Src,
              iconSize: this.usedIconSize, // size of the icon
              className: 'photo-icon'
            }));
            mkr.options.alt = p.name;
            mkr.on('mouseover', () => {
              mkr.getIcon().options.iconSize = [this.usedIconSize.x * 1.5, this.usedIconSize.y * 1.5];
              mkr.setIcon(mkr.getIcon());
            });
            mkr.on('mouseout', () => {
              mkr.getIcon().options.iconSize = this.usedIconSize;
              mkr.setIcon(mkr.getIcon());
            });
          };
          if (iconTh.Available === true) {
            setIcon();
          } else {
            iconTh.OnLoad = setIcon;
          }
        });

      }
    });
    if (this.gpxFiles) {
      this.loadGPXFiles().catch(console.error);
    }

  }

  public loadPreview(mp: MapPhoto): void {
    mp.preview.thumbnail.load();
    mp.preview.thumbnail.CurrentlyWaiting = true;
  }

  hideImages(): void {
    this.thumbnailsOnLoad.forEach((th): void => {
      th.destroy();
    });
    this.thumbnailsOnLoad = [];

    this.mapLayersControlOption.overlays.Photos.clearLayers();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyPress(event: KeyboardEvent): void {
    if (this.visible !== true) {
      return;
    }
    switch (event.key) {
      case 'f':
      case 'F':
        if (this.fullScreenService.isFullScreenEnabled()) {
          this.fullScreenService.exitFullScreen();
        } else {
          this.fullScreenService.showFullScreen(this.elementRef.nativeElement);
        }
        break;
      case 'Escape':
        this.hide();
        break;
    }
  }

  onMapReady(map: Map): void {
    this.leafletMap = map;
    this.leafletMap.setMaxZoom(undefined);
    this.leafletMap.zoomControl.setPosition('bottomright');
    this.mapLayerControl.addTo(this.leafletMap);
  }

  onLeafletZoom(): void {

    if (Config.Client.Map.useImageMarkers === false) {
      return;
    }
    if ((this.leafletMap.getZoom() < 15 && this.usedIconSize === this.smallIconSize) ||
      (this.leafletMap.getZoom() >= 15 && this.usedIconSize === this.iconSize)) {

      // all set no change needed
      return;
    }
    this.usedIconSize = this.leafletMap.getZoom() < 15 ? this.smallIconSize : this.iconSize;
    (this.mapLayersControlOption.overlays.Photos.getLayers() as Marker[]).forEach(mkr => {
      // if alt is not present icon is not yet set, so do not change the size
      if (!mkr.options.alt) {
        return;
      }
      mkr.getIcon().options.iconSize = this.usedIconSize;
      mkr.setIcon(mkr.getIcon());
    });
  }

  private centerMap(): void {
    this.leafletMap.fitBounds(
      latLngBounds((this.mapLayersControlOption.overlays.Photos.getLayers() as Marker[])
        .map(m => m.getLatLng())
      )
    );
  }

  private async loadGPXFiles(): Promise<void> {

    this.mapLayersControlOption.overlays.Paths.clearLayers();
    if (this.gpxFiles.length === 0) {
      // remove from controls
      this.mapLayerControl.removeLayer(this.mapLayersControlOption.overlays.Paths);
      // remove from map
      if (this.leafletMap) {
        this.leafletMap.removeLayer(this.mapLayersControlOption.overlays.Paths);
      }
    } else {
      // make sure it does not appear twice
      this.mapLayerControl.removeLayer(this.mapLayersControlOption.overlays.Paths);
      this.mapLayerControl.addOverlay(this.mapLayersControlOption.overlays.Paths, 'Paths');
      if (this.leafletMap && !this.leafletMap.hasLayer(this.mapLayersControlOption.overlays.Paths)) {
        this.leafletMap.addLayer(this.mapLayersControlOption.overlays.Paths);
      }
    }

    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < this.gpxFiles.length; i++) {
      const file = this.gpxFiles[i];
      const path = await this.mapService.getMapPath(file);
      if (file !== this.gpxFiles[i]) { // check race condition
        return;
      }
      if (path.length === 0) {
        continue;
      }
      this.mapLayersControlOption.overlays.Paths.addLayer(marker(path[0] as LatLng));
      this.mapLayersControlOption.overlays.Paths.addLayer(polyline(path as LatLng[]));
    }
  }
}

export interface MapPhoto {
  name: string;
  lat: number;
  lng: number;
  iconUrl?: string;
  iconThumbnail: IconThumbnail;
  preview: {
    width: number;
    height: number;
    thumbnail: Thumbnail;
  };
}

