import {Component, ElementRef, Input, OnChanges, ViewChild, AfterViewInit} from '@angular/core';
import {PhotoDTO} from '../../../../../common/entities/PhotoDTO';
import {Dimension, IRenderable} from '../../../model/IRenderable';
import {GalleryMapLightboxComponent} from './lightbox/lightbox.map.gallery.component';
import {FileDTO} from '../../../../../common/entities/FileDTO';
import {MapService} from './map.service';
import {MapComponent} from '@yaga/leaflet-ng2';

@Component({
  selector: 'app-gallery-map',
  templateUrl: './map.gallery.component.html',
  styleUrls: ['./map.gallery.component.css']
})
export class GalleryMapComponent implements OnChanges, IRenderable, AfterViewInit {

  @Input() photos: PhotoDTO[];
  @Input() gpxFiles: FileDTO[];
  @ViewChild(GalleryMapLightboxComponent, {static: false}) mapLightbox: GalleryMapLightboxComponent;

  mapPhotos: Array<{ lat: number, lng: number }> = [];
  @ViewChild('map', {static: false}) mapElement: ElementRef;
  @ViewChild('yagaMap', {static: false}) yagaMap: MapComponent;
  height: number = null;


  constructor(public mapService: MapService) {
  }

  ngOnChanges() {
    this.mapPhotos = this.photos.filter(p => {
      return p.metadata && p.metadata.positionData && p.metadata.positionData.GPSData &&
        p.metadata.positionData.GPSData.latitude && p.metadata.positionData.GPSData.longitude;
    }).map(p => {
      return {
        lat: p.metadata.positionData.GPSData.latitude,
        lng: p.metadata.positionData.GPSData.longitude
      };
    });

    if (this.yagaMap) {
      this.yagaMap.setView(this.mapPhotos[0], 99);
      this.yagaMap.fitBounds(this.mapPhotos.map(mp => <[number, number]>[mp.lat, mp.lng]));
      this.yagaMap.zoom = 0;
    }

  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.height = this.mapElement.nativeElement.clientHeight;
      this.yagaMap.setView(this.mapPhotos[0], 99);
      this.yagaMap.fitBounds(this.mapPhotos.map(mp => <[number, number]>[mp.lat, mp.lng]));
      this.yagaMap.zoom = 0;
    }, 0);
  }


  click() {
    this.mapLightbox.show(this.getDimension());
  }

  public getDimension(): Dimension {
    return <Dimension>{
      top: this.mapElement.nativeElement.offsetTop,
      left: this.mapElement.nativeElement.offsetLeft,
      width: this.mapElement.nativeElement.offsetWidth,
      height: this.mapElement.nativeElement.offsetHeight
    };
  }
}

