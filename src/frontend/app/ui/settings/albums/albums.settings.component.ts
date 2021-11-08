import {Component} from '@angular/core';
import {AlbumsSettingsService} from './albums.settings.service';
import {SettingsComponentDirective} from '../_abstract/abstract.settings.component';
import {AuthenticationService} from '../../../model/network/authentication.service';
import {NavigationService} from '../../../model/navigation.service';
import {NotificationService} from '../../../model/notification.service';
import {ClientAlbumConfig} from '../../../../../common/config/public/ClientConfig';


@Component({
  selector: 'app-settings-albums',
  templateUrl: './albums.settings.component.html',
  styleUrls: ['./albums.settings.component.css',
    '../_abstract/abstract.settings.component.css'],
  providers: [AlbumsSettingsService],
})
export class AlbumsSettingsComponent extends SettingsComponentDirective<ClientAlbumConfig> {

  constructor(authService: AuthenticationService,
              navigation: NavigationService,
              settingsService: AlbumsSettingsService,
              notification: NotificationService) {
    super($localize`Albums`, authService, navigation, settingsService, notification, s => s.Client.Album);
  }


}



