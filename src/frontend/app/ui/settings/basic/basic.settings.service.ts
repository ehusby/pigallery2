import {Injectable} from '@angular/core';
import {NetworkService} from '../../../model/network/network.service';
import {AbstractSettingsService} from '../_abstract/abstract.settings.service';
import {SettingsService} from '../settings.service';
import {BasicConfigDTO} from '../../../../../common/entities/settings/BasicConfigDTO';

@Injectable()
export class BasicSettingsService extends AbstractSettingsService<BasicConfigDTO> {
  constructor(private networkService: NetworkService,
              settingsService: SettingsService) {
    super(settingsService);
  }


  public updateSettings(settings: BasicConfigDTO): Promise<void> {
    return this.networkService.putJson('/settings/basic', {settings});
  }

}
