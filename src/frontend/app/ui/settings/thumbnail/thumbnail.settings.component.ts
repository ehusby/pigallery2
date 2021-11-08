import {Component, OnInit} from '@angular/core';
import {SettingsComponentDirective} from '../_abstract/abstract.settings.component';
import {AuthenticationService} from '../../../model/network/authentication.service';
import {NavigationService} from '../../../model/navigation.service';
import {NotificationService} from '../../../model/notification.service';
import {ThumbnailSettingsService} from './thumbnail.settings.service';
import {DefaultsJobs, JobDTO, JobDTOUtils} from '../../../../../common/entities/job/JobDTO';
import {ScheduledJobsService} from '../scheduled-jobs.service';
import {JobProgressDTO, JobProgressStates} from '../../../../../common/entities/job/JobProgressDTO';
import {ServerConfig, ServerThumbnailConfig} from '../../../../../common/config/private/PrivateConfig';
import {ClientConfig, ClientThumbnailConfig} from '../../../../../common/config/public/ClientConfig';

@Component({
  selector: 'app-settings-thumbnail',
  templateUrl: './thumbnail.settings.component.html',
  styleUrls: ['./thumbnail.settings.component.css',
    '../_abstract/abstract.settings.component.css'],
  providers: [ThumbnailSettingsService],
})
export class ThumbnailSettingsComponent
  extends SettingsComponentDirective<{ server: ServerThumbnailConfig, client: ClientThumbnailConfig }>
  implements OnInit {
  JobProgressStates = JobProgressStates;
  readonly jobName = DefaultsJobs[DefaultsJobs['Thumbnail Generation']];

  constructor(authService: AuthenticationService,
              navigation: NavigationService,
              settingsService: ThumbnailSettingsService,
              notification: NotificationService,
              public jobsService: ScheduledJobsService) {
    super($localize`Thumbnail`, authService, navigation, settingsService, notification, s => ({
      client: s.Client.Media.Thumbnail,
      server: s.Server.Media.Thumbnail
    }));
  }

  get Config(): any {
    return {sizes: this.states.client.thumbnailSizes.original[0]};
  }


  get Progress(): JobProgressDTO {
    return this.jobsService.progress.value[JobDTOUtils.getHashName(this.jobName, this.Config)];
  }

  ngOnInit(): void {
    super.ngOnInit();
  }
}



