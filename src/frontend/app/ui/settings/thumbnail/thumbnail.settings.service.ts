import {Injectable} from '@angular/core';
import {NetworkService} from '../../../model/network/network.service';
import {AbstractSettingsService} from '../_abstract/abstract.settings.service';
import {SettingsService} from '../settings.service';
import {ServerThumbnailConfig} from '../../../../../common/config/private/PrivateConfig';
import {ClientThumbnailConfig} from '../../../../../common/config/public/ClientConfig';

@Injectable()
export class ThumbnailSettingsService
  extends AbstractSettingsService<{ server: ServerThumbnailConfig, client: ClientThumbnailConfig }> {
  constructor(private networkService: NetworkService,
              settingsService: SettingsService) {
    super(settingsService);
  }


  showInSimplifiedMode(): boolean {
    return false;
  }

  public updateSettings(settings: { server: ServerThumbnailConfig, client: ClientThumbnailConfig }): Promise<void> {
    return this.networkService.putJson('/settings/thumbnail', {settings});
  }

}
