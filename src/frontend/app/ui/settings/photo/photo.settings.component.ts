import {Component} from '@angular/core';
import {PhotoSettingsService} from './photo.settings.service';
import {SettingsComponentDirective} from '../_abstract/abstract.settings.component';
import {AuthenticationService} from '../../../model/network/authentication.service';
import {NavigationService} from '../../../model/navigation.service';
import {NotificationService} from '../../../model/notification.service';
import {ScheduledJobsService} from '../scheduled-jobs.service';
import {DefaultsJobs, JobDTO, JobDTOUtils} from '../../../../../common/entities/job/JobDTO';
import {JobProgressDTO, JobProgressStates} from '../../../../../common/entities/job/JobProgressDTO';
import {ServerConfig, ServerPhotoConfig} from '../../../../../common/config/private/PrivateConfig';
import {ClientConfig, ClientPhotoConfig} from '../../../../../common/config/public/ClientConfig';


@Component({
  selector: 'app-settings-photo',
  templateUrl: './photo.settings.component.html',
  styleUrls: ['./photo.settings.component.css',
    '../_abstract/abstract.settings.component.css'],
  providers: [PhotoSettingsService],
})
export class PhotoSettingsComponent extends SettingsComponentDirective<{
  server: ServerPhotoConfig,
  client: ClientPhotoConfig
}> {
  readonly resolutionTypes = [720, 1080, 1440, 2160, 4320];
  resolutions: { key: number, value: string }[] = [];
  JobProgressStates = JobProgressStates;

  readonly jobName = DefaultsJobs[DefaultsJobs['Photo Converting']];

  constructor(authService: AuthenticationService,
              navigation: NavigationService,
              settingsService: PhotoSettingsService,
              public jobsService: ScheduledJobsService,
              notification: NotificationService) {
    super($localize`Photo`, authService, navigation, settingsService, notification, s => ({
      client: s.Client.Media.Photo,
      server: s.Server.Media.Photo
    }));
    const currentRes = settingsService.Settings.value.Server.Media.Photo.Converting.resolution;
    if (this.resolutionTypes.indexOf(currentRes) === -1) {
      this.resolutionTypes.push(currentRes);
    }
    this.resolutions = this.resolutionTypes.map(e => ({key: e, value: e + 'px'}));
  }

  get Progress(): JobProgressDTO {
    return this.jobsService.progress.value[JobDTOUtils.getHashName(DefaultsJobs[DefaultsJobs['Photo Converting']])];
  }

  libTypesMap = (v: { key: number, value: string }) => {
    if (v.value.toLowerCase() === 'sharp') {
      v.value += ' ' + $localize`(recommended)`;
    } else {
      v.value += ' ' + $localize`(deprecated, will be removed)`;
    }
    return v;
  }
}



