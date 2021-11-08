import {Component, OnDestroy, OnInit} from '@angular/core';
import {IndexingSettingsService} from './indexing.settings.service';
import {AuthenticationService} from '../../../model/network/authentication.service';
import {NavigationService} from '../../../model/navigation.service';
import {NotificationService} from '../../../model/notification.service';
import {ErrorDTO} from '../../../../../common/entities/Error';
import {SettingsComponentDirective} from '../_abstract/abstract.settings.component';
import {Utils} from '../../../../../common/Utils';
import {ScheduledJobsService} from '../scheduled-jobs.service';
import {DefaultsJobs, JobDTOUtils} from '../../../../../common/entities/job/JobDTO';
import {JobProgressDTO, JobProgressStates} from '../../../../../common/entities/job/JobProgressDTO';
import {ReIndexingSensitivity, ServerIndexingConfig} from '../../../../../common/config/private/PrivateConfig';

@Component({
  selector: 'app-settings-indexing',
  templateUrl: './indexing.settings.component.html',
  styleUrls: ['./indexing.settings.component.css',
    '../_abstract/abstract.settings.component.css'],
  providers: [IndexingSettingsService],
})
export class IndexingSettingsComponent extends SettingsComponentDirective<ServerIndexingConfig, IndexingSettingsService>
  implements OnInit, OnDestroy {


  types: { key: number; value: string }[] = [];
  JobProgressStates = JobProgressStates;
  readonly indexingJobName = DefaultsJobs[DefaultsJobs.Indexing];
  readonly resetJobName = DefaultsJobs[DefaultsJobs['Database Reset']];

  constructor(authService: AuthenticationService,
              navigation: NavigationService,
              settingsService: IndexingSettingsService,
              public jobsService: ScheduledJobsService,
              notification: NotificationService) {

    super($localize`Folder indexing`,
      authService,
      navigation,
      settingsService,
      notification,
      s => s.Server.Indexing);

  }

  get Config(): any {
    return {indexChangesOnly: true};
  }

  get Progress(): JobProgressDTO {
    return this.jobsService.progress.value[JobDTOUtils.getHashName(DefaultsJobs[DefaultsJobs.Indexing], this.Config)];
  }


  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.jobsService.unsubscribeFromProgress();
  }

  async ngOnInit(): Promise<void> {
    super.ngOnInit();
    this.jobsService.subscribeToProgress();
    this.types = Utils
      .enumToArray(ReIndexingSensitivity);
    this.types.forEach(v => {
      switch (v.value) {
        case 'low':
          v.value = $localize`low`;
          break;
        case 'medium':
          v.value = $localize`medium`;
          break;
        case 'high':
          v.value = $localize`high`;
          break;
      }
    });
  }


  async index(): Promise<boolean> {
    this.inProgress = true;
    this.error = '';
    try {
      await this.jobsService.start(DefaultsJobs[DefaultsJobs.Indexing],  this.Config);
      this.notification.info($localize`Folder indexing started`);
      this.inProgress = false;
      return true;
    } catch (err) {
      console.log(err);
      if (err.message) {
        this.error = (err as ErrorDTO).message;
      }
    }

    this.inProgress = false;
    return false;
  }

  async cancelIndexing(): Promise<boolean> {
    this.inProgress = true;
    this.error = '';
    try {
      await this.jobsService.stop(DefaultsJobs[DefaultsJobs.Indexing]);
      this.notification.info($localize`Folder indexing interrupted`);
      this.inProgress = false;
      return true;
    } catch (err) {
      console.log(err);
      if (err.message) {
        this.error = (err as ErrorDTO).message;
      }
    }

    this.inProgress = false;
    return false;
  }

  async resetDatabase(): Promise<boolean> {
    this.inProgress = true;
    this.error = '';
    try {
      await this.jobsService.start(DefaultsJobs[DefaultsJobs['Database Reset']]);
      this.notification.info($localize`Resetting  database`);
      this.inProgress = false;
      return true;
    } catch (err) {
      console.log(err);
      if (err.message) {
        this.error = (err as ErrorDTO).message;
      }
    }

    this.inProgress = false;
    return false;
  }


}



