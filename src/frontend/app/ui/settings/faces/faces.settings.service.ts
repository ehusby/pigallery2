import {Injectable} from '@angular/core';
import {NetworkService} from '../../../model/network/network.service';
import {SettingsService} from '../settings.service';
import {AbstractSettingsService} from '../_abstract/abstract.settings.service';
import {ClientConfig, ClientFacesConfig} from '../../../../../common/config/public/ClientConfig';
import {DatabaseType, ServerConfig} from '../../../../../common/config/private/PrivateConfig';

@Injectable()
export class FacesSettingsService extends AbstractSettingsService<ClientFacesConfig> {
  constructor(private networkService: NetworkService,
              settingsService: SettingsService) {
    super(settingsService);
  }

  public isSupported(): boolean {
    return this.settingsService.settings.value.Server.Database.type !== DatabaseType.memory &&
      this.settingsService.settings.value.Client.Search.enabled === true;
  }

  public updateSettings(settings: ClientFacesConfig): Promise<void> {
    return this.networkService.putJson('/settings/faces', {settings});
  }

}
