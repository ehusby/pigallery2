import {Injectable} from '@angular/core';
import {NetworkService} from '../../../model/network/network.service';
import {SettingsService} from '../settings.service';
import {AbstractSettingsService} from '../_abstract/abstract.settings.service';
import {BehaviorSubject} from 'rxjs';
import {StatisticDTO} from '../../../../../common/entities/settings/StatisticDTO';
import {ScheduledJobsService} from '../scheduled-jobs.service';
import {DefaultsJobs} from '../../../../../common/entities/job/JobDTO';
import {first} from 'rxjs/operators';
import {DatabaseType, ServerConfig, ServerIndexingConfig} from '../../../../../common/config/private/PrivateConfig';

@Injectable()
export class IndexingSettingsService extends AbstractSettingsService<ServerIndexingConfig> {


  public statistic: BehaviorSubject<StatisticDTO>;

  constructor(private networkService: NetworkService,
              private jobsService: ScheduledJobsService,
              settingsService: SettingsService) {
    super(settingsService);
    this.statistic = new BehaviorSubject(null);
    settingsService.settings.pipe(first()).subscribe(() => {
      if (this.isSupported()) {
        this.loadStatistic();
      }
    });
    this.jobsService.onJobFinish.subscribe((jobName: string) => {
      if (jobName === DefaultsJobs[DefaultsJobs.Indexing] ||
        jobName === DefaultsJobs[DefaultsJobs['Database Reset']]) {
        if (this.isSupported()) {
          this.loadStatistic();
        }
      }
    });
  }

  public updateSettings(settings: ServerIndexingConfig): Promise<void> {
    return this.networkService.putJson('/settings/indexing', {settings});
  }


  public isSupported(): boolean {
    return this.settingsService.settings.value.Server.Database.type !== DatabaseType.memory;
  }


  async loadStatistic(): Promise<void> {
    this.statistic.next(await this.networkService.getJson<StatisticDTO>('/admin/statistic'));
  }
}
