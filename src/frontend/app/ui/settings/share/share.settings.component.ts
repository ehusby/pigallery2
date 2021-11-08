import {Component, OnInit} from '@angular/core';
import {SettingsComponentDirective} from '../_abstract/abstract.settings.component';
import {AuthenticationService} from '../../../model/network/authentication.service';
import {NavigationService} from '../../../model/navigation.service';
import {NotificationService} from '../../../model/notification.service';
import {ShareSettingsService} from './share.settings.service';
import {ClientConfig, ClientSharingConfig} from '../../../../../common/config/public/ClientConfig';
import {SharingDTO} from '../../../../../common/entities/SharingDTO';

@Component({
  selector: 'app-settings-share',
  templateUrl: './share.settings.component.html',
  styleUrls: ['./share.settings.component.css',
    '../_abstract/abstract.settings.component.css'],
  providers: [ShareSettingsService],
})
export class ShareSettingsComponent extends SettingsComponentDirective<ClientSharingConfig, ShareSettingsService> implements OnInit {


  public shares: SharingDTO[] = [];

  constructor(authService: AuthenticationService,
              navigation: NavigationService,
              settingsService: ShareSettingsService,
              notification: NotificationService) {
    super($localize`Share`, authService, navigation, settingsService, notification, s => s.Client.Sharing);
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.getSharingList();
  }

  async deleteSharing(sharing: SharingDTO): Promise<void> {
    await this.settingsService.deleteSharing(sharing);
    await this.getSharingList();
  }

  private async getSharingList(): Promise<void> {
    try {
      this.shares = await this.settingsService.getSharingList();
    } catch (err) {
      this.shares = [];
      throw err;
    }
  }

}



