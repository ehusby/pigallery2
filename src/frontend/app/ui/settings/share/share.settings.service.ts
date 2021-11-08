import {Injectable} from '@angular/core';
import {NetworkService} from '../../../model/network/network.service';
import {SettingsService} from '../settings.service';
import {AbstractSettingsService} from '../_abstract/abstract.settings.service';
import {ClientSharingConfig} from '../../../../../common/config/public/ClientConfig';
import {SharingDTO} from '../../../../../common/entities/SharingDTO';
import {DatabaseType} from '../../../../../common/config/private/PrivateConfig';

@Injectable()
export class ShareSettingsService extends AbstractSettingsService<ClientSharingConfig> {
  constructor(private networkService: NetworkService,
              settingsService: SettingsService) {
    super(settingsService);

  }


  public isSupported(): boolean {
    return this.settingsService.settings.value.Server.Database.type !== DatabaseType.memory &&
      this.settingsService.settings.value.Client.authenticationRequired === true;
  }

  public updateSettings(settings: ClientSharingConfig): Promise<void> {
    return this.networkService.putJson('/settings/share', {settings});
  }


  public getSharingList(): Promise<SharingDTO[]> {
    if (!this.settingsService.settings.value.Client.Sharing.enabled) {
      return Promise.resolve([]);
    }
    return this.networkService.getJson('/share/list');
  }


  public deleteSharing(sharing: SharingDTO): Promise<void> {
    return this.networkService.deleteJson('/share/' + sharing.sharingKey);
  }

}
