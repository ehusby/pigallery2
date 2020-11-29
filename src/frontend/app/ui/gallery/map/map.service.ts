import {Injectable} from '@angular/core';
import {NetworkService} from '../../../model/network/network.service';
import {FileDTO} from '../../../../../common/entities/FileDTO';
import {Utils} from '../../../../../common/Utils';
import {Config} from '../../../../../common/config/public/Config';
import {ClientConfig} from '../../../../../common/config/public/ClientConfig';
import MapLayers = ClientConfig.MapLayers;

@Injectable()
export class MapService {
  private static readonly OSMLAYERS = [{name: 'street', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}];
  private static MAPBOXLAYERS: MapLayers[] = [];

  constructor(private networkService: NetworkService) {
    MapService.MAPBOXLAYERS = [{
      name: 'street', url: 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/{z}/{x}/{y}?access_token='
        + Config.Client.Map.mapboxAccessToken
    }, {
      name: 'satellite', url: 'https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?access_token='
        + Config.Client.Map.mapboxAccessToken
    }, {
      name: 'hybrid', url: 'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/256/{z}/{x}/{y}?access_token='
        + Config.Client.Map.mapboxAccessToken
    }
    ];
  }

  public get ShortAttributions(): string[] {
    const yaga = '<a href="https://yagajs.org" title="YAGA">YAGA</a>';
    const lf = '<a href="https://leaflet-ng2.yagajs.org" title="Leaflet in Angular2">leaflet-ng2</a>';
    const OSM = '<a href="https://www.openstreetmap.org/copyright">OSM</a>';
    const MB = '<a href="https://www.mapbox.com/">Mapbox</a>';


    if (Config.Client.Map.mapProvider === ClientConfig.MapProviders.OpenStreetMap) {
      return [yaga + ' | &copy; ' + OSM];
    }

    if (Config.Client.Map.mapProvider === ClientConfig.MapProviders.Mapbox) {
      return [yaga + ' | ' + OSM + ' | ' + MB];
    }
    return [yaga + ' | ' + lf];
  }

  public get Attributions(): string[] {
    const yagalf = '<a href="https://yagajs.org" title="YAGA">YAGA</a> | ' +
      '<a href="https://leaflet-ng2.yagajs.org" title="Leaflet in Angular2">leaflet-ng2</a>';
    const OSM = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
    const MB = '&copy; <a href="https://www.mapbox.com/">Mapbox</a>';

    if (Config.Client.Map.mapProvider === ClientConfig.MapProviders.OpenStreetMap) {
      return [yagalf + ' | ' + OSM];
    }

    if (Config.Client.Map.mapProvider === ClientConfig.MapProviders.Mapbox) {
      return [yagalf + ' | ' + OSM + ' | ' + MB];
    }
    return [yagalf];
  }

  public get MapLayer(): string {
    return this.Layers[0].url;
  }

  public get Layers(): { name: string, url: string }[] {
    switch (Config.Client.Map.mapProvider) {
      case ClientConfig.MapProviders.Custom:
        return Config.Client.Map.customLayers;
      case ClientConfig.MapProviders.Mapbox:
        return MapService.MAPBOXLAYERS;
      case ClientConfig.MapProviders.OpenStreetMap:
        return MapService.OSMLAYERS;
    }
  }


  public async getMapPath(file: FileDTO): Promise<MapPath[]> {
    const filePath = Utils.concatUrls(file.directory.path, file.directory.name, file.name);
    const gpx = await this.networkService.getXML('/gallery/content/' + filePath);
    const elements = gpx.getElementsByTagName('trkpt');
    const points: MapPath[] = [];
    for (let i = 0; i < elements.length; i++) {
      points.push({
        lat: parseFloat(elements[i].getAttribute('lat')),
        lng: parseFloat(elements[i].getAttribute('lon'))
      });
    }
    return points;
  }

}


export interface MapPath {
  lat: number;
  lng: number;
}
