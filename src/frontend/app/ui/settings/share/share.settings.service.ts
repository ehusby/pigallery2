import {Injectable} from '@angular/core';
import {NetworkService} from '../../../model/network/network.service';
import {SettingsService} from '../settings.service';
import {AbstractSettingsService} from '../_abstract/abstract.settings.service';
import {ClientConfig} from '../../../../../common/config/public/ClientConfig';
import {ServerConfig} from '../../../../../common/config/private/PrivateConfig';
import {SharingDTO} from '../../../../../common/entities/SharingDTO';

@Injectable()
export class ShareSettingsService extends AbstractSettingsService<ClientConfig.SharingConfig> {
  constructor(private _networkService: NetworkService,
              _settingsService: SettingsService) {
    super(_settingsService);

  }


  public isSupported(): boolean {
    return this._settingsService.settings.value.Server.Database.type !== ServerConfig.DatabaseType.memory &&
      this._settingsService.settings.value.Client.authenticationRequired === true;
  }

  public updateSettings(settings: ClientConfig.SharingConfig): Promise<void> {
    return this._networkService.putJson('/settings/share', {settings: settings});
  }


  public getSharingList(): Promise<SharingDTO[]> {
    return this._networkService.getJson('/share/list');
  }


  public deleteSharing(sharing: SharingDTO): Promise<void> {
    return this._networkService.deleteJson('/share/' + sharing.sharingKey);
  }

}
