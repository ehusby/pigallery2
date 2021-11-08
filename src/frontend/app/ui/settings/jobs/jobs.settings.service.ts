import {Injectable} from '@angular/core';
import {NetworkService} from '../../../model/network/network.service';
import {SettingsService} from '../settings.service';
import {AbstractSettingsService} from '../_abstract/abstract.settings.service';
import {BehaviorSubject} from 'rxjs';
import {JobDTO} from '../../../../../common/entities/job/JobDTO';
import {ServerConfig, ServerJobConfig} from '../../../../../common/config/private/PrivateConfig';

@Injectable()
export class JobsSettingsService extends AbstractSettingsService<ServerJobConfig> {


  public availableJobs: BehaviorSubject<JobDTO[]>;

  constructor(private networkService: NetworkService,
              settingsService: SettingsService) {
    super(settingsService);
    this.availableJobs = new BehaviorSubject([]);
  }

  public updateSettings(settings: ServerJobConfig): Promise<void> {
    return this.networkService.putJson('/settings/jobs', {settings});
  }


  showInSimplifiedMode(): boolean {
    return false;
  }

  public isSupported(): boolean {
    return true;
  }


  public async getAvailableJobs(): Promise<void> {
    this.availableJobs.next(await this.networkService.getJson<JobDTO[]>('/admin/jobs/available'));
  }

}
