import {Component} from '@angular/core';
import {MapSettingsService} from './map.settings.service';
import {SettingsComponentDirective} from '../_abstract/abstract.settings.component';
import {AuthenticationService} from '../../../model/network/authentication.service';
import {NavigationService} from '../../../model/navigation.service';
import {NotificationService} from '../../../model/notification.service';
import {Utils} from '../../../../../common/Utils';
import {ClientMapConfig, MapLayers, MapProviders} from '../../../../../common/config/public/ClientConfig';


@Component({
  selector: 'app-settings-map',
  templateUrl: './map.settings.component.html',
  styleUrls: ['./map.settings.component.css',
    '../_abstract/abstract.settings.component.css'],
  providers: [MapSettingsService],
})
export class MapSettingsComponent extends SettingsComponentDirective<ClientMapConfig> {

  public mapProviders: { key: number, value: string }[] = [];
  public MapProviders = MapProviders;

  constructor(authService: AuthenticationService,
              navigation: NavigationService,
              settingsService: MapSettingsService,
              notification: NotificationService) {
    super($localize`Map`, authService, navigation, settingsService, notification, s => s.Client.Map);

    this.mapProviders = Utils.enumToArray(MapProviders);
  }


  addNewLayer(): void {
    this.states.customLayers.value.push({
      name: 'Layer-' + this.states.customLayers.value.length,
      url: ''
    });
  }

  removeLayer(layer: MapLayers): void {
    this.states.customLayers.value.splice(this.states.customLayers.value.indexOf(layer), 1);
  }
}



