import {Injectable} from '@angular/core';
import {NetworkService} from '../../../model/network/network.service';
import {SettingsService} from '../settings.service';
import {AbstractSettingsService} from '../_abstract/abstract.settings.service';
import {ClientVideoConfig} from '../../../../../common/config/public/ClientConfig';
import {ServerVideoConfig} from '../../../../../common/config/private/PrivateConfig';

@Injectable()
export class VideoSettingsService extends AbstractSettingsService<{ server: ServerVideoConfig, client: ClientVideoConfig }> {
  constructor(private networkService: NetworkService,
              settingsService: SettingsService) {
    super(settingsService);

  }

  public updateSettings(settings: { server: ServerVideoConfig, client: ClientVideoConfig }): Promise<void> {
    return this.networkService.putJson('/settings/video', {settings});
  }

}
