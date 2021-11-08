import {Component} from '@angular/core';
import {VideoSettingsService} from './video.settings.service';
import {SettingsComponentDirective} from '../_abstract/abstract.settings.component';
import {AuthenticationService} from '../../../model/network/authentication.service';
import {NavigationService} from '../../../model/navigation.service';
import {NotificationService} from '../../../model/notification.service';
import {ScheduledJobsService} from '../scheduled-jobs.service';
import {DefaultsJobs, JobDTOUtils} from '../../../../../common/entities/job/JobDTO';
import {JobProgressDTO, JobProgressStates} from '../../../../../common/entities/job/JobProgressDTO';
import {ServerVideoConfig, videoCodecType, videoFormatType, videoResolutionType} from '../../../../../common/config/private/PrivateConfig';
import {ClientVideoConfig} from '../../../../../common/config/public/ClientConfig';


@Component({
  selector: 'app-settings-video',
  templateUrl: './video.settings.component.html',
  styleUrls: ['./video.settings.component.css',
    '../_abstract/abstract.settings.component.css'],
  providers: [VideoSettingsService],
})
export class VideoSettingsComponent
  extends SettingsComponentDirective<{ server: ServerVideoConfig, client: ClientVideoConfig }> {

  readonly resolutionTypes: videoResolutionType[] = [360, 480, 720, 1080, 1440, 2160, 4320];

  resolutions: { key: number, value: string }[] = [];
  codecs: { [key: string]: { key: videoCodecType, value: videoCodecType }[] } = {
    webm: ['libvpx', 'libvpx-vp9'].map((e: videoCodecType) => ({key: e, value: e})),
    mp4: ['libx264', 'libx265'].map((e: videoCodecType) => ({key: e, value: e}))
  };
  formats: { key: videoFormatType, value: videoFormatType }[] = ['mp4', 'webm']
    .map((e: videoFormatType) => ({key: e, value: e}));
  fps = [24, 25, 30, 48, 50, 60].map(e => ({key: e, value: e}));

  JobProgressStates = JobProgressStates;
  readonly jobName = DefaultsJobs[DefaultsJobs['Video Converting']];

  constructor(authService: AuthenticationService,
              navigation: NavigationService,
              settingsService: VideoSettingsService,
              public jobsService: ScheduledJobsService,
              notification: NotificationService) {
    super($localize`Video`, authService, navigation, settingsService, notification, s => ({
      client: s.Client.Media.Video,
      server: s.Server.Media.Video
    }));

    const currentRes = settingsService.Settings.value.Server.Media.Video.transcoding.resolution;
    if (this.resolutionTypes.indexOf(currentRes) === -1) {
      this.resolutionTypes.push(currentRes);
    }
    this.resolutions = this.resolutionTypes.map(e => ({key: e, value: e + 'px'}));
  }


  get Progress(): JobProgressDTO {
    return this.jobsService.progress.value[JobDTOUtils.getHashName(DefaultsJobs[DefaultsJobs['Video Converting']])];
  }

  get bitRate(): number {
    return this.states.server.transcoding.bitRate.value / 1024 / 1024;
  }

  set bitRate(value: number) {
    this.states.server.transcoding.bitRate.value = Math.round(value * 1024 * 1024);
  }

  getRecommendedBitRate(resolution: number, fps: number): number {
    let bitRate = 1024 * 1024;
    if (resolution <= 360) {
      bitRate = 1024 * 1024;
    } else if (resolution <= 480) {
      bitRate = 2.5 * 1024 * 1024;
    } else if (resolution <= 720) {
      bitRate = 5 * 1024 * 1024;
    } else if (resolution <= 1080) {
      bitRate = 8 * 1024 * 1024;
    } else if (resolution <= 1440) {
      bitRate = 16 * 1024 * 1024;
    } else {
      bitRate = 40 * 1024 * 1024;
    }

    if (fps > 30) {
      bitRate *= 1.5;
    }

    return bitRate;
  }

  updateBitRate(): void {
    this.states.server.transcoding.bitRate.value = this.getRecommendedBitRate(this.states.server.transcoding.resolution.value,
      this.states.server.transcoding.fps.value);
  }

  formatChanged(format: videoFormatType): void {
    this.states.server.transcoding.codec.value = this.codecs[format][0].key;
  }


}



