import {Component} from '@angular/core';
import {SettingsComponentDirective} from '../_abstract/abstract.settings.component';
import {AuthenticationService} from '../../../model/network/authentication.service';
import {NavigationService} from '../../../model/navigation.service';
import {NotificationService} from '../../../model/notification.service';
import {FacesSettingsService} from './faces.settings.service';
import {Utils} from '../../../../../common/Utils';
import {UserRoles} from '../../../../../common/entities/UserDTO';
import {ClientConfig, ClientFacesConfig} from '../../../../../common/config/public/ClientConfig';

@Component({
  selector: 'app-settings-faces',
  templateUrl: './faces.settings.component.html',
  styleUrls: ['./faces.settings.component.css',
    '../_abstract/abstract.settings.component.css'],
  providers: [FacesSettingsService],
})
export class FacesSettingsComponent extends SettingsComponentDirective<ClientFacesConfig> {

  public readonly userRoles = Utils
    .enumToArray(UserRoles)
    .filter(r => r.key !== UserRoles.LimitedGuest)
    .filter(r => r.key <= this.authService.user.value.role)
    .sort((a, b) => a.key - b.key);

  constructor(authService: AuthenticationService,
              navigation: NavigationService,
              settingsService: FacesSettingsService,
              notification: NotificationService) {
    super($localize`Faces`, authService, navigation, settingsService, notification, s => s.Client.Faces);

  }


}



