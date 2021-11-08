import {Injectable} from '@angular/core';
import {NetworkService} from '../../../model/network/network.service';
import {SettingsService} from '../settings.service';
import {AbstractSettingsService} from '../_abstract/abstract.settings.service';
import {ServerConfig, ServerPhotoConfig} from '../../../../../common/config/private/PrivateConfig';
import {ClientConfig, ClientPhotoConfig} from '../../../../../common/config/public/ClientConfig';

@Injectable()
export class PhotoSettingsService extends AbstractSettingsService<{
  server: ServerPhotoConfig,
  client: ClientPhotoConfig
}> {
  constructor(private networkService: NetworkService,
              settingsService: SettingsService) {
    super(settingsService);
  }


  public updateSettings(settings: {
    server: ServerPhotoConfig,
    client: ClientPhotoConfig
  }): Promise<void> {
    return this.networkService.putJson('/settings/photo', {settings});
  }


}
