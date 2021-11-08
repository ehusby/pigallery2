import {Component} from '@angular/core';
import {SettingsComponentDirective} from '../_abstract/abstract.settings.component';
import {AuthenticationService} from '../../../model/network/authentication.service';
import {NavigationService} from '../../../model/navigation.service';
import {NotificationService} from '../../../model/notification.service';
import {SearchSettingsService} from './search.settings.service';
import {ClientConfig, ClientSearchConfig} from '../../../../../common/config/public/ClientConfig';

@Component({
  selector: 'app-settings-search',
  templateUrl: './search.settings.component.html',
  styleUrls: ['./search.settings.component.css',
    '../_abstract/abstract.settings.component.css'],
  providers: [SearchSettingsService],
})
export class SearchSettingsComponent extends SettingsComponentDirective<ClientSearchConfig> {

  constructor(authService: AuthenticationService,
              navigation: NavigationService,
              settingsService: SearchSettingsService,
              notification: NotificationService) {
    super($localize`Search`, authService, navigation, settingsService, notification, s => s.Client.Search);
  }


}



