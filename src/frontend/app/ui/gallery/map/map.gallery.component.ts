import {Component, ElementRef, Input, OnChanges, ViewChild} from '@angular/core';
import {PhotoDTO} from '../../../../../common/entities/PhotoDTO';
import {Dimension, IRenderable} from '../../../model/IRenderable';
import {GalleryMapLightboxComponent} from './lightbox/lightbox.map.gallery.component';
import {FileDTO} from '../../../../../common/entities/FileDTO';
import {MapService} from './map.service';
import {Config} from '../../../../../common/config/public/Config';
import {LatLngLiteral, Map, MapOptions, Marker, marker, tileLayer} from 'leaflet';

@Component({
  selector: 'app-gallery-map',
  templateUrl: './map.gallery.component.html',
  styleUrls: ['./map.gallery.component.css']
})
export class GalleryMapComponent implements OnChanges, IRenderable {

  @Input() photos: PhotoDTO[];
  @Input() gpxFiles: FileDTO[];
  @ViewChild(GalleryMapLightboxComponent, {static: false}) mapLightbox: GalleryMapLightboxComponent;
  @ViewChild('map', {static: false}) mapElement: ElementRef;

  leafletMap: Map;


  options: MapOptions = {
    zoomControl: false,
    dragging: false,
    keyboard: false,
    tap: false,
    doubleClickZoom: false,
    boxZoom: false,
    zoom: 0,
  };
  markerLayer: Marker[] = [];


  constructor(public mapService: MapService) {
    this.options.layers = [
      tileLayer(mapService.MapLayer, {attribution: mapService.ShortAttributions})
    ];
  }

  onMapReady(map: Map): void {
    this.leafletMap = map;
    this.leafletMap.setView(this.markerLayer[0].getLatLng(), 99);
    this.leafletMap.fitBounds(this.markerLayer.map((mp): [number, number] =>
      [mp.getLatLng().lat, mp.getLatLng().lng] as [number, number]));
    this.leafletMap.setZoom(0);
  }

  ngOnChanges(): void {
    this.markerLayer = this.photos.filter((p): number => {
      return p.metadata && p.metadata.positionData && p.metadata.positionData.GPSData &&
        p.metadata.positionData.GPSData.latitude && p.metadata.positionData.GPSData.longitude;
    }).slice(0, Config.Client.Map.maxPreviewMarkers).map((p): Marker => {
      return marker({
        lat: p.metadata.positionData.GPSData.latitude,
        lng: p.metadata.positionData.GPSData.longitude
      } as LatLngLiteral);
    });

    if (this.leafletMap && this.markerLayer.length > 0) {
      this.options.center = this.markerLayer[0].getLatLng();
      this.leafletMap.setView(this.markerLayer[0].getLatLng(), 99);
      this.leafletMap.fitBounds(this.markerLayer.map((mp): [number, number] =>
        [mp.getLatLng().lat, mp.getLatLng().lng] as [number, number]));
      this.leafletMap.setZoom(0);
    }

  }

  click(): void {
    this.mapLightbox.show(this.getDimension());
  }

  public getDimension(): Dimension {
    return {
      top: this.mapElement.nativeElement.offsetTop,
      left: this.mapElement.nativeElement.offsetLeft,
      width: this.mapElement.nativeElement.offsetWidth,
      height: this.mapElement.nativeElement.offsetHeight
    } as Dimension;
  }
}

