/* tslint:disable:no-inferrable-types */
import 'reflect-metadata';
import {JobScheduleDTO, JobTrigger, JobTriggerType} from '../../entities/job/JobScheduleDTO';
import {ClientConfig} from '../public/ClientConfig';
import {SubConfigClass} from 'typeconfig/src/decorators/class/SubConfigClass';
import {ConfigProperty} from 'typeconfig/src/decorators/property/ConfigPropoerty';
import {DefaultsJobs} from '../../entities/job/JobDTO';

export module ServerConfig {
  export enum DatabaseType {
    memory = 1, mysql = 2, sqlite = 3
  }

  export enum LogLevel {
    error = 1, warn = 2, info = 3, verbose = 4, debug = 5, silly = 6
  }

  export enum SQLLogLevel {
    none = 1, error = 2, all = 3
  }

  export enum PhotoProcessingLib {
    sharp = 3,
    Jimp = 1
  }

  export enum ReIndexingSensitivity {
    low = 1, medium = 2, high = 3
  }

  export enum FFmpegPresets {
    ultrafast = 1, superfast = 2, veryfast = 3, faster = 4, fast = 5, medium = 6,
    slow = 7, slower = 8, veryslow = 9, placebo = 10
  }


  export type codecType = 'libvpx-vp9' | 'libx264' | 'libvpx' | 'libx265';
  export type resolutionType = 240 | 360 | 480 | 720 | 1080 | 1440 | 2160 | 4320;
  export type formatType = 'mp4' | 'webm';

  @SubConfigClass()
  export class MySQLConfig {
    @ConfigProperty({envAlias: 'MYSQL_HOST'})
    host: string = 'localhost';
    @ConfigProperty({envAlias: 'MYSQL_PORT', min: 0, max: 65535})
    port: number = 3306;
    @ConfigProperty({envAlias: 'MYSQL_DATABASE'})
    database: string = 'pigallery2';
    @ConfigProperty({envAlias: 'MYSQL_USERNAME'})
    username: string = '';
    @ConfigProperty({envAlias: 'MYSQL_PASSWORD', type: 'password'})
    password: string = '';
  }


  @SubConfigClass()
  export class DataBaseConfig {
    @ConfigProperty<DatabaseType, IPrivateConfig>({
      type: DatabaseType,
      onNewValue: (value, config) => {
        if (value === ServerConfig.DatabaseType.memory) {
          config.Client.Search.enabled = false;
          config.Client.Sharing.enabled = false;
        }
      }
    })
    type: DatabaseType = DatabaseType.sqlite;

    @ConfigProperty()
    dbFolder: string = 'db';

    @ConfigProperty()
    mysql?: MySQLConfig = new MySQLConfig();
  }

  @SubConfigClass()
  export class ThumbnailConfig {
    @ConfigProperty({description: 'if true, photos will have better quality.'})
    qualityPriority: boolean = true;
    @ConfigProperty({type: 'ratio'})
    personFaceMargin: number = 0.6; // in ration [0-1]
  }

  @SubConfigClass()
  export class SharingConfig {
    @ConfigProperty()
    updateTimeout: number = 1000 * 60 * 5;
  }


  @SubConfigClass()
  export class IndexingConfig {
    @ConfigProperty()
    folderPreviewSize: number = 2;
    @ConfigProperty()
    cachedFolderTimeout: number = 1000 * 60 * 60; // Do not rescans the folder if seems ok
    @ConfigProperty({type: ReIndexingSensitivity})
    reIndexingSensitivity: ReIndexingSensitivity = ReIndexingSensitivity.low;
    @ConfigProperty({
      arrayType: 'string',
      description: 'If an entry starts with \'/\' it is treated as an absolute path.' +
        ' If it doesn\'t start with \'/\' but contains a \'/\', the path is relative to the image directory.' +
        ' If it doesn\'t contain a \'/\', any folder with this name will be excluded.'
    })
    excludeFolderList: string[] = ['.Trash-1000', '.dtrash', '$RECYCLE.BIN'];
    @ConfigProperty({arrayType: 'string', description: 'Any folder that contains a file with this name will be excluded from indexing.'})
    excludeFileList: string[] = [];
  }

  @SubConfigClass()
  export class ThreadingConfig {
    @ConfigProperty({description: 'App can run on multiple thread'})
    enabled: boolean = true;
    @ConfigProperty({description: 'Number of threads that are used to generate thumbnails. If 0, number of \'CPU cores -1\' threads will be used.'})
    thumbnailThreads: number = 0; // if zero-> CPU count -1
  }

  @SubConfigClass()
  export class DuplicatesConfig {
    @ConfigProperty()
    listingLimit: number = 1000; // maximum number of duplicates to list
  }

  @SubConfigClass()
  export class LogConfig {
    @ConfigProperty({type: LogLevel})
    level: LogLevel = LogLevel.info;
    @ConfigProperty({type: SQLLogLevel})
    sqlLevel: SQLLogLevel = SQLLogLevel.error;
  }


  @SubConfigClass()
  export class NeverJobTrigger implements JobTrigger {
    @ConfigProperty({type: JobTriggerType})
    readonly type = JobTriggerType.never;
  }

  @SubConfigClass()
  export class ScheduledJobTrigger implements JobTrigger {
    @ConfigProperty({type: JobTriggerType})
    readonly type = JobTriggerType.scheduled;

    @ConfigProperty()
    time: number;  // data time
  }

  @SubConfigClass()
  export class PeriodicJobTrigger implements JobTrigger {
    @ConfigProperty({type: JobTriggerType})
    readonly type = JobTriggerType.periodic;
    @ConfigProperty()
    periodicity: number;  // 0-6: week days 7 every day
    @ConfigProperty()
    atTime: number; // day time
  }

  @SubConfigClass()
  export class AfterJobTrigger implements JobTrigger {

    @ConfigProperty({type: JobTriggerType})
    readonly type = JobTriggerType.after;
    @ConfigProperty()
    afterScheduleName: string; // runs after schedule

    constructor(afterScheduleName?: string) {
      this.afterScheduleName = afterScheduleName;
    }
  }


  @SubConfigClass()
  export class JobScheduleConfig implements JobScheduleDTO {

    @ConfigProperty()
    name: string;
    @ConfigProperty()
    jobName: string;
    @ConfigProperty()
    config: any = {};
    @ConfigProperty()
    allowParallelRun: boolean;
    @ConfigProperty({
      type: NeverJobTrigger,
      typeBuilder: (v: JobTrigger) => {
        const type = typeof v.type === 'number' ? v.type : JobTriggerType[v.type];
        switch (type) {
          case JobTriggerType.after:
            return AfterJobTrigger;
          case JobTriggerType.never:
            return NeverJobTrigger;
          case JobTriggerType.scheduled:
            return ScheduledJobTrigger;
          case JobTriggerType.periodic:
            return PeriodicJobTrigger;
        }
        return null;
      }
    })
    trigger: AfterJobTrigger | NeverJobTrigger | PeriodicJobTrigger | ScheduledJobTrigger;

    constructor(name: string, jobName: string, allowParallelRun: boolean,
                trigger: AfterJobTrigger | NeverJobTrigger | PeriodicJobTrigger | ScheduledJobTrigger, config: any) {
      this.name = name;
      this.jobName = jobName;
      this.config = config;
      this.allowParallelRun = allowParallelRun;
      this.trigger = trigger;
    }
  }

  @SubConfigClass()
  export class JobConfig {
    @ConfigProperty({type: 'integer', description: 'Job history size'})
    maxSavedProgress: number = 10;
    @ConfigProperty({arrayType: JobScheduleConfig})
    scheduled: JobScheduleConfig[] = [
      new JobScheduleConfig(DefaultsJobs[DefaultsJobs.Indexing],
        DefaultsJobs[DefaultsJobs.Indexing],
        false,
        new NeverJobTrigger(), {}
      ),
      new JobScheduleConfig(DefaultsJobs[DefaultsJobs['Thumbnail Generation']],
        DefaultsJobs[DefaultsJobs['Thumbnail Generation']],
        false,
        new AfterJobTrigger(DefaultsJobs[DefaultsJobs.Indexing]), {sizes: [240], indexedOnly: true}
      ),
      new JobScheduleConfig(DefaultsJobs[DefaultsJobs['Photo Converting']],
        DefaultsJobs[DefaultsJobs['Photo Converting']],
        false,
        new AfterJobTrigger(DefaultsJobs[DefaultsJobs['Thumbnail Generation']]), {indexedOnly: true}
      ),
      new JobScheduleConfig(DefaultsJobs[DefaultsJobs['Video Converting']],
        DefaultsJobs[DefaultsJobs['Video Converting']],
        false,
        new AfterJobTrigger(DefaultsJobs[DefaultsJobs['Photo Converting']]), {indexedOnly: true}
      ),
      new JobScheduleConfig(DefaultsJobs[DefaultsJobs['Temp Folder Cleaning']],
        DefaultsJobs[DefaultsJobs['Temp Folder Cleaning']],
        false,
        new AfterJobTrigger(DefaultsJobs[DefaultsJobs['Video Converting']]), {indexedOnly: true}
      ),
    ];
  }


  @SubConfigClass()
  export class VideoTranscodingConfig {
    @ConfigProperty({type: 'unsignedInt'})
    bitRate: number = 5 * 1024 * 1024;
    @ConfigProperty({type: 'unsignedInt'})
    resolution: resolutionType = 720;
    @ConfigProperty({type: 'positiveFloat'})
    fps: number = 25;
    @ConfigProperty()
    codec: codecType = 'libx264';
    @ConfigProperty()
    format: formatType = 'mp4';
    @ConfigProperty({
      type: 'unsignedInt',
      description: 'Constant Rate Factor. The range of the CRF scale is 0–51, where 0 is lossless, 23 is the default, and 51 is worst quality possible.',
      max: 51
    })
    crf: number = 23;
    @ConfigProperty({
      type: FFmpegPresets,
      description: 'A preset is a collection of options that will provide a certain encoding speed to compression ratio'
    })
    preset: FFmpegPresets = FFmpegPresets.medium;

    @ConfigProperty({arrayType: 'string', description: 'It will be sent to ffmpeg as it is, as custom options.'})
    customOptions: string[] = [];
  }

  @SubConfigClass()
  export class VideoConfig {
    @ConfigProperty()
    transcoding: VideoTranscodingConfig = new VideoTranscodingConfig();
  }

  @SubConfigClass()
  export class PhotoConvertingConfig {
    @ConfigProperty({description: 'Converts photos on the fly, when they are requested.'})
    onTheFly: boolean = true;
    @ConfigProperty({type: 'unsignedInt'})
    resolution: resolutionType = 1080;
  }

  @SubConfigClass()
  export class PhotoConfig {
    @ConfigProperty()
    Converting: PhotoConvertingConfig = new PhotoConvertingConfig();
  }

  @SubConfigClass()
  export class MediaConfig {
    @ConfigProperty({description: 'Images are loaded from this folder (read permission required)'})
    folder: string = 'demo/images';
    @ConfigProperty({description: 'Thumbnails, coverted photos, videos will be stored here (write permission required)'})
    tempFolder: string = 'demo/tmp';
    @ConfigProperty({type: ServerConfig.PhotoProcessingLib})
    photoProcessingLibrary: PhotoProcessingLib = ServerConfig.PhotoProcessingLib.sharp;
    @ConfigProperty()
    Video: VideoConfig = new VideoConfig();
    @ConfigProperty()
    Photo: PhotoConfig = new PhotoConfig();
    @ConfigProperty()
    Thumbnail: ThumbnailConfig = new ThumbnailConfig();
  }


  @SubConfigClass()
  export class EnvironmentConfig {
    @ConfigProperty({volatile: true})
    upTime: string;
    @ConfigProperty({volatile: true})
    appVersion: string;
    @ConfigProperty({volatile: true})
    buildTime: string;
    @ConfigProperty({volatile: true})
    buildCommitHash: string;
    @ConfigProperty({volatile: true})
    isDocker: boolean;
  }

  @SubConfigClass()
  export class Config {
    @ConfigProperty({volatile: true})
    Environment: EnvironmentConfig = new EnvironmentConfig();
    @ConfigProperty({arrayType: 'string'})
    sessionSecret: string[] = [];
    @ConfigProperty({type: 'unsignedInt', envAlias: 'PORT', min: 0, max: 65535})
    port: number = 80;
    @ConfigProperty()
    host: string = '0.0.0.0';
    @ConfigProperty()
    Media: MediaConfig = new MediaConfig();
    @ConfigProperty()
    Threading: ThreadingConfig = new ThreadingConfig();
    @ConfigProperty()
    Database: DataBaseConfig = new DataBaseConfig();
    @ConfigProperty()
    Sharing: SharingConfig = new SharingConfig();
    @ConfigProperty({type: 'unsignedInt', description: 'unit: ms'})
    sessionTimeout: number = 1000 * 60 * 60 * 24 * 7; // in ms
    @ConfigProperty()
    Indexing: IndexingConfig = new IndexingConfig();
    @ConfigProperty({type: 'unsignedInt', description: 'only this many bites will be loaded when scanning photo for metadata'})
    photoMetadataSize: number = 512 * 1024; // only this many bites will be loaded when scanning photo for metadata
    @ConfigProperty()
    Duplicates: DuplicatesConfig = new DuplicatesConfig();
    @ConfigProperty()
    Log: LogConfig = new LogConfig();
    @ConfigProperty()
    Jobs: JobConfig = new JobConfig();
  }
}

export interface IPrivateConfig {
  Server: ServerConfig.Config;
  Client: ClientConfig.Config;

}
