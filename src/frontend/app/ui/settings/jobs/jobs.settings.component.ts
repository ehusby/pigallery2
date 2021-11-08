import {Component, OnChanges, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {JobsSettingsService} from './jobs.settings.service';
import {AuthenticationService} from '../../../model/network/authentication.service';
import {NavigationService} from '../../../model/navigation.service';
import {NotificationService} from '../../../model/notification.service';
import {SettingsComponentDirective} from '../_abstract/abstract.settings.component';
import {ScheduledJobsService} from '../scheduled-jobs.service';
import {
  AfterJobTrigger,
  JobScheduleDTO,
  JobScheduleDTOUtils,
  JobTriggerType,
  NeverJobTrigger,
  PeriodicJobTrigger,
  ScheduledJobTrigger
} from '../../../../../common/entities/job/JobScheduleDTO';
import {ConfigTemplateEntry} from '../../../../../common/entities/job/JobDTO';
import {ModalDirective} from 'ngx-bootstrap/modal';
import {JobProgressDTO, JobProgressStates} from '../../../../../common/entities/job/JobProgressDTO';
import {BackendtextService} from '../../../model/backendtext.service';
import {ServerJobConfig} from '../../../../../common/config/private/PrivateConfig';

@Component({
  selector: 'app-settings-jobs',
  templateUrl: './jobs.settings.component.html',
  styleUrls: ['./jobs.settings.component.css',
    '../_abstract/abstract.settings.component.css'],
  providers: [JobsSettingsService]
})
export class JobsSettingsComponent extends SettingsComponentDirective<ServerJobConfig, JobsSettingsService>
  implements OnInit, OnDestroy, OnChanges {

  @ViewChild('jobModal', {static: false}) public jobModal: ModalDirective;
  disableButtons = false;
  JobTriggerTypeMap: { key: number, value: string }[];
  JobTriggerType = JobTriggerType;
  periods: string[] = [];
  showDetails: boolean[] = [];
  JobProgressStates = JobProgressStates;
  newSchedule: JobScheduleDTO = {
    name: '',
    config: null,
    jobName: '',
    trigger: {
      type: JobTriggerType.never
    },
    allowParallelRun: false
  };

  constructor(authService: AuthenticationService,
              navigation: NavigationService,
              settingsService: JobsSettingsService,
              public jobsService: ScheduledJobsService,
              public backendTextService: BackendtextService,
              notification: NotificationService) {

    super($localize`Jobs`,
      authService,
      navigation,
      settingsService,
      notification,
      s => s.Server.Jobs);

    this.hasAvailableSettings = !this.simplifiedMode;
    this.JobTriggerTypeMap = [
      {key: JobTriggerType.after, value: $localize`after`},
      {key: JobTriggerType.never, value: $localize`never`},
      {key: JobTriggerType.periodic, value: $localize`periodic`},
      {key: JobTriggerType.scheduled, value: $localize`scheduled`},
    ];
    this.periods = [
      $localize`Monday`, // 0
      $localize`Tuesday`, // 1
      $localize`Wednesday`, // 2
      $localize`Thursday`,
      $localize`Friday`,
      $localize`Saturday`,
      $localize`Sunday`,
      $localize`day`]; // 7
  }


  atTimeLocal(atTime: number): Date {
    const d = new Date();
    d.setUTCHours(Math.floor(atTime / 60));
    d.setUTCMinutes(Math.floor(atTime % 60));
    return d;
  }

  getConfigTemplate(JobName: string): ConfigTemplateEntry[] {
    const job = this.settingsService.availableJobs.value.find(t => t.Name === JobName);
    if (job && job.ConfigTemplate && job.ConfigTemplate.length > 0) {
      return job.ConfigTemplate;
    }
    return null;
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.jobsService.subscribeToProgress();
    this.settingsService.getAvailableJobs().catch(console.error);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.jobsService.unsubscribeFromProgress();
  }

  remove(schedule: JobScheduleDTO): void {
    this.states.scheduled.value.splice(this.states.scheduled.value.indexOf(schedule), 1);
  }

  jobTypeChanged(schedule: JobScheduleDTO): void {
    const job = this.settingsService.availableJobs.value.find(t => t.Name === schedule.jobName);
    schedule.config = schedule.config || {};
    if (job.ConfigTemplate) {
      job.ConfigTemplate.forEach(ct => schedule.config[ct.id] = ct.defaultValue);
    }
  }

  prepareNewJob(): void {
    const jobName = this.settingsService.availableJobs.value[0].Name;
    this.newSchedule = {
      name: 'new job',
      jobName,
      config: {},
      trigger: {
        type: JobTriggerType.never
      },
      allowParallelRun: false
    };

    const job = this.settingsService.availableJobs.value.find(t => t.Name === jobName);
    this.newSchedule.config = this.newSchedule.config || {};
    if (job.ConfigTemplate) {
      job.ConfigTemplate.forEach(ct => this.newSchedule.config[ct.id] = ct.defaultValue);
    }

    this.jobModal.show();
  }

  jobTriggerTypeChanged(triggerType: JobTriggerType, schedule: JobScheduleDTO): void {
    schedule.trigger = {type: triggerType} as NeverJobTrigger;
    switch (triggerType) {
      case JobTriggerType.scheduled:
        (schedule.trigger as unknown as ScheduledJobTrigger).time = (Date.now());
        break;

      case JobTriggerType.periodic:
        (schedule.trigger as unknown as PeriodicJobTrigger).periodicity = null;
        (schedule.trigger as unknown as PeriodicJobTrigger).atTime = null;
        break;
    }
  }

  setNumberArray(configElement: any, id: string, value: string): void {
    value = value.replace(new RegExp(',', 'g'), ';');
    value = value.replace(new RegExp(' ', 'g'), ';');
    configElement[id] = value.split(';')
      .map((s: string) => parseInt(s, 10))
      .filter((i: number) => !isNaN(i) && i > 0);
  }

  getNumberArray(configElement: any, id: string): string {
    return configElement[id].join('; ');
  }

  public shouldIdent(curr: JobScheduleDTO, prev: JobScheduleDTO): boolean {
    return curr && curr.trigger.type === JobTriggerType.after && prev && prev.name === curr.trigger.afterScheduleName;
  }

  public sortedSchedules(): JobScheduleDTO[] {
    return (this.states.scheduled.value as JobScheduleDTO[]).slice().sort((a: JobScheduleDTO, b: JobScheduleDTO) => {
      return this.getNextRunningDate(a, this.states.scheduled.value) - this.getNextRunningDate(b, this.states.scheduled.value);
    });
  }

  addNewJob(): void {
    const jobName = this.newSchedule.jobName;
    const count = this.states.scheduled.value.filter((s: JobScheduleDTO) => s.jobName === jobName).length;
    this.newSchedule.name = count === 0 ? jobName : this.backendTextService.getJobName(jobName) + ' ' + (count + 1);
    this.states.scheduled.value.push(this.newSchedule);
    this.jobModal.hide();
  }

  getProgress(schedule: JobScheduleDTO): JobProgressDTO {
    return this.jobsService.getProgress(schedule);
  }

  private getNextRunningDate(sch: JobScheduleDTO, list: JobScheduleDTO[], depth: number = 0): number {
    if (depth > list.length) {
      return 0;
    }
    if (sch.trigger.type === JobTriggerType.never) {
      return list.map(s => s.name).sort().indexOf(sch.name) * -1;
    }
    if (sch.trigger.type === JobTriggerType.after) {
      const parent = list.find(s => s.name === (sch.trigger as AfterJobTrigger).afterScheduleName);
      if (parent) {
        return this.getNextRunningDate(parent, list, depth + 1) + 0.001;
      }
    }
    const d = JobScheduleDTOUtils.getNextRunningDate(new Date(), sch);
    return d !== null ? d.getTime() : 0;
  }
}



