import {Component} from '@angular/core';
import {MetaFileSettingsService} from './metafile.settings.service';
import {SettingsComponentDirective} from '../_abstract/abstract.settings.component';
import {AuthenticationService} from '../../../model/network/authentication.service';
import {NavigationService} from '../../../model/navigation.service';
import {NotificationService} from '../../../model/notification.service';
import {ClientConfig, ClientMetaFileConfig} from '../../../../../common/config/public/ClientConfig';


@Component({
  selector: 'app-settings-meta-file',
  templateUrl: './metafile.settings.component.html',
  styleUrls: ['./metafile.settings.component.css',
    '../_abstract/abstract.settings.component.css'],
  providers: [MetaFileSettingsService],
})
export class MetaFileSettingsComponent extends SettingsComponentDirective<ClientMetaFileConfig> {

  constructor(authService: AuthenticationService,
              navigation: NavigationService,
              settingsService: MetaFileSettingsService,
              notification: NotificationService) {
    super($localize`Meta file`, authService, navigation, settingsService, notification, s => s.Client.MetaFile);
  }


}



