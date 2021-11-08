import {Injectable} from '@angular/core';
import {NetworkService} from '../../../model/network/network.service';
import {SettingsService} from '../settings.service';
import {AbstractSettingsService} from '../_abstract/abstract.settings.service';
import {ClientConfig, ClientMetaFileConfig} from '../../../../../common/config/public/ClientConfig';

@Injectable()
export class MetaFileSettingsService extends AbstractSettingsService<ClientMetaFileConfig> {
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

  public updateSettings(settings: ClientMetaFileConfig): Promise<void> {
    return this.networkService.putJson('/settings/metafile', {settings});
  }

}
