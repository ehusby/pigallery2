import {Component, OnInit} from '@angular/core';
import {AuthenticationService} from '../../../model/network/authentication.service';
import {Utils} from '../../../../../common/Utils';
import {NotificationService} from '../../../model/notification.service';
import {NavigationService} from '../../../model/navigation.service';
import {SettingsComponentDirective} from '../_abstract/abstract.settings.component';
import {DatabaseSettingsService} from './database.settings.service';
import {DatabaseType, ServerConfig, ServerDataBaseConfig} from '../../../../../common/config/private/PrivateConfig';

@Component({
  selector: 'app-settings-database',
  templateUrl: './database.settings.component.html',
  styleUrls: ['./database.settings.component.css',
    '../_abstract/abstract.settings.component.css'],
  providers: [DatabaseSettingsService],
})
export class DatabaseSettingsComponent extends SettingsComponentDirective<ServerDataBaseConfig> implements OnInit {

  public types = Utils.enumToArray(DatabaseType);
  public DatabaseType = DatabaseType;

  constructor(authService: AuthenticationService,
              navigation: NavigationService,
              settingsService: DatabaseSettingsService,
              notification: NotificationService) {
    super($localize`Database`, authService, navigation, settingsService, notification, s => s.Server.Database);
  }

  ngOnInit(): void {
    super.ngOnInit();
  }


}



