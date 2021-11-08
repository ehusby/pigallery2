import {Injectable} from '@angular/core';
import {NetworkService} from '../../../model/network/network.service';
import {SettingsService} from '../settings.service';
import {AbstractSettingsService} from '../_abstract/abstract.settings.service';
import {ClientAlbumConfig} from '../../../../../common/config/public/ClientConfig';

@Injectable()
export class AlbumsSettingsService extends AbstractSettingsService<ClientAlbumConfig> {
  constructor(private networkService: NetworkService,
              settingsService: SettingsService) {
    super(settingsService);

  }

  public isSupported(): boolean {
    return this.settingsService.settings.value.Client.Map.enabled === true;
  }


  showInSimplifiedMode(): boolean {
    return false;
  }

  public updateSettings(settings: ClientAlbumConfig): Promise<void> {
    return this.networkService.putJson('/settings/albums', {settings});
  }

}
