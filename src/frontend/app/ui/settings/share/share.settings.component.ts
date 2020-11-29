import {Component, OnInit} from '@angular/core';
import {SettingsComponent} from '../_abstract/abstract.settings.component';
import {AuthenticationService} from '../../../model/network/authentication.service';
import {NavigationService} from '../../../model/navigation.service';
import {NotificationService} from '../../../model/notification.service';
import {ShareSettingsService} from './share.settings.service';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {ClientConfig} from '../../../../../common/config/public/ClientConfig';
import {SharingDTO} from '../../../../../common/entities/SharingDTO';

@Component({
  selector: 'app-settings-share',
  templateUrl: './share.settings.component.html',
  styleUrls: ['./share.settings.component.css',
    '../_abstract/abstract.settings.component.css'],
  providers: [ShareSettingsService],
})
export class ShareSettingsComponent extends SettingsComponent<ClientConfig.SharingConfig, ShareSettingsService> implements OnInit {


  public shares: SharingDTO[] = [];

  constructor(_authService: AuthenticationService,
              _navigation: NavigationService,
              _settingsService: ShareSettingsService,
              notification: NotificationService,
              i18n: I18n) {
    super(i18n('Share'), _authService, _navigation, _settingsService, notification, i18n, s => s.Client.Sharing);
  }


  ngOnInit() {
    super.ngOnInit();
    this.getSharingList();
  }

  async deleteSharing(sharing: SharingDTO) {
    await this._settingsService.deleteSharing(sharing);
    await this.getSharingList();
  }

  private async getSharingList() {
    try {
      this.shares = await this._settingsService.getSharingList();
    } catch (err) {
      this.shares = [];
      throw err;
    }
  }

}



