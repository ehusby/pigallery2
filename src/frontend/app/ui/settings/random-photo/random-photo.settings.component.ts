import {Component} from '@angular/core';
import {SettingsComponentDirective} from '../_abstract/abstract.settings.component';
import {AuthenticationService} from '../../../model/network/authentication.service';
import {NavigationService} from '../../../model/navigation.service';
import {NotificationService} from '../../../model/notification.service';
import {RandomPhotoSettingsService} from './random-photo.settings.service';
import {ClientRandomPhotoConfig} from '../../../../../common/config/public/ClientConfig';

@Component({
  selector: 'app-settings-random-photo',
  templateUrl: './random-photo.settings.component.html',
  styleUrls: ['./random-photo.settings.component.css',
    '../_abstract/abstract.settings.component.css'],
  providers: [RandomPhotoSettingsService],
})
export class RandomPhotoSettingsComponent extends SettingsComponentDirective<ClientRandomPhotoConfig> {

  constructor(authService: AuthenticationService,
              navigation: NavigationService,
              settingsService: RandomPhotoSettingsService,
              notification: NotificationService) {
    super($localize`Random Photo`, authService, navigation, settingsService, notification, s => s.Client.RandomPhoto);
  }


}



