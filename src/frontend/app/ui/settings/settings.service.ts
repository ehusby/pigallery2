import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {NetworkService} from '../../model/network/network.service';

import {WebConfig} from '../../../../common/config/private/WebConfig';
import {WebConfigClassBuilder} from 'typeconfig/src/decorators/builders/WebConfigClassBuilder';

@Injectable()
export class SettingsService {
  public settings: BehaviorSubject<WebConfig>;
  private fetchingSettings = false;

  constructor(private networkService: NetworkService) {
    this.settings = new BehaviorSubject<WebConfig>(new WebConfig());
    this.getSettings().catch(console.error);
  }

  public async getSettings(): Promise<void> {
    if (this.fetchingSettings === true) {
      return;
    }
    this.fetchingSettings = true;
    try {
      const wcg = WebConfigClassBuilder.attachInterface(new WebConfig());
      wcg.load(await this.networkService.getJson<Promise<WebConfig>>('/settings'));
      this.settings.next(wcg);
    } catch (e) {
      console.error(e);
    }
    this.fetchingSettings = false;
  }
}
