import {Injectable} from '@angular/core';
import {NetworkService} from '../../../model/network/network.service';
import {AbstractSettingsService} from '../_abstract/abstract.settings.service';
import {SettingsService} from '../settings.service';
import {ServerDataBaseConfig} from '../../../../../common/config/private/PrivateConfig';

@Injectable()
export class DatabaseSettingsService extends AbstractSettingsService<ServerDataBaseConfig> {
  constructor(private networkService: NetworkService,
              settingsService: SettingsService) {
    super(settingsService);
  }


  public updateSettings(settings: ServerDataBaseConfig): Promise<void> {
    return this.networkService.putJson('/settings/database', {settings});
  }

}
