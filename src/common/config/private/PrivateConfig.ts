/* tslint:disable:no-inferrable-types */
import 'reflect-metadata';
import {JobScheduleDTO, JobTrigger, JobTriggerType} from '../../entities/job/JobScheduleDTO';
import {ClientConfig} from '../public/ClientConfig';
import {SubConfigClass} from 'typeconfig/src/decorators/class/SubConfigClass';
import {ConfigProperty} from 'typeconfig/src/decorators/property/ConfigPropoerty';
import {DefaultsJobs} from '../../entities/job/JobDTO';
import {SearchQueryDTO} from '../../entities/SearchQueryDTO';
import {SortingMethods} from '../../entities/SortingMethods';

export enum DatabaseType {
  memory = 1, mysql = 2, sqlite = 3
}

export enum LogLevel {
  error = 1, warn = 2, info = 3, verbose = 4, debug = 5, silly = 6
}

export enum SQLLogLevel {
  none = 1, error = 2, all = 3
}


export enum ReIndexingSensitivity {
  low = 1, medium = 2, high = 3
}

export enum FFmpegPresets {
  ultrafast = 1, superfast = 2, veryfast = 3, faster = 4, fast = 5, medium = 6,
  slow = 7, slower = 8, veryslow = 9, placebo = 10
}


export type videoCodecType = 'libvpx-vp9' | 'libx264' | 'libvpx' | 'libx265';
export type videoResolutionType = 240 | 360 | 480 | 720 | 1080 | 1440 | 2160 | 4320;
export type videoFormatType = 'mp4' | 'webm';

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
export class SQLiteConfig {
  @ConfigProperty()
  DBFileName: string = 'sqlite.db';
}


@SubConfigClass()
export class ServerDataBaseConfig {
  @ConfigProperty<DatabaseType, IPrivateConfig>({
    type: DatabaseType,
    onNewValue: (value, config) => {
      if (value === DatabaseType.memory) {
        config.Client.Search.enabled = false;
        config.Client.Sharing.enabled = false;
      }
    }
  })
  type: DatabaseType = DatabaseType.sqlite;

  @ConfigProperty()
  dbFolder: string = 'db';

  @ConfigProperty()
  sqlite?: SQLiteConfig = new SQLiteConfig();

  @ConfigProperty()
  mysql?: MySQLConfig = new MySQLConfig();
}

@SubConfigClass()
export class ServerThumbnailConfig {
  @ConfigProperty({description: 'if true, photos will have better quality.'})
  qualityPriority: boolean = true;
  @ConfigProperty({type: 'ratio'})
  personFaceMargin: number = 0.6; // in ration [0-1]
}

@SubConfigClass()
export class ServerSharingConfig {
  @ConfigProperty()
  updateTimeout: number = 1000 * 60 * 5;
}


@SubConfigClass()
export class ServerIndexingConfig {
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
export class ServerThreadingConfig {
  @ConfigProperty({description: 'App can run on multiple thread'})
  enabled: boolean = true;
  @ConfigProperty({description: 'Number of threads that are used to generate thumbnails. If 0, number of \'CPU cores -1\' threads will be used.'})
  thumbnailThreads: number = 0; // if zero-> CPU count -1
}

@SubConfigClass()
export class ServerDuplicatesConfig {
  @ConfigProperty()
  listingLimit: number = 1000; // maximum number of duplicates to list
}

@SubConfigClass()
export class ServerLogConfig {
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

  @ConfigProperty({type: 'unsignedInt'})
  time: number;  // data time
}

@SubConfigClass()
export class PeriodicJobTrigger implements JobTrigger {
  @ConfigProperty({type: JobTriggerType})
  readonly type = JobTriggerType.periodic;
  @ConfigProperty({type: 'unsignedInt', max: 7})
  periodicity: number;  // 0-6: week days 7 every day
  @ConfigProperty({type: 'unsignedInt', max: 23 * 60 + 59})
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
export class ServerJobConfig {
  @ConfigProperty({type: 'integer', description: 'Job history size'})
  maxSavedProgress: number = 10;
  @ConfigProperty({arrayType: JobScheduleConfig})
  scheduled: JobScheduleConfig[] = [
    new JobScheduleConfig(DefaultsJobs[DefaultsJobs.Indexing],
      DefaultsJobs[DefaultsJobs.Indexing],
      false,
      new NeverJobTrigger(), {indexChangesOnly: true}
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
  resolution: videoResolutionType = 720;
  @ConfigProperty({type: 'positiveFloat'})
  fps: number = 25;
  @ConfigProperty()
  codec: videoCodecType = 'libx264';
  @ConfigProperty()
  format: videoFormatType = 'mp4';
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
export class ServerVideoConfig {
  @ConfigProperty()
  transcoding: VideoTranscodingConfig = new VideoTranscodingConfig();
}

@SubConfigClass()
export class PhotoConvertingConfig {
  @ConfigProperty({description: 'Converts photos on the fly, when they are requested.'})
  onTheFly: boolean = true;
  @ConfigProperty({type: 'unsignedInt'})
  resolution: videoResolutionType = 1080;
}

@SubConfigClass()
export class ServerPhotoConfig {
  @ConfigProperty()
  Converting: PhotoConvertingConfig = new PhotoConvertingConfig();
}

@SubConfigClass()
export class ServerPreviewConfig {
  @ConfigProperty({type: 'object'})
  SearchQuery: SearchQueryDTO = null;
  @ConfigProperty({arrayType: SortingMethods})
  Sorting: SortingMethods[] = [
    SortingMethods.descRating,
    SortingMethods.descDate
  ];
}

@SubConfigClass()
export class ServerMediaConfig {
  @ConfigProperty({description: 'Images are loaded from this folder (read permission required)'})
  folder: string = 'demo/images';
  @ConfigProperty({description: 'Thumbnails, converted photos, videos will be stored here (write permission required)'})
  tempFolder: string = 'demo/tmp';
  @ConfigProperty()
  Video: ServerVideoConfig = new ServerVideoConfig();
  @ConfigProperty()
  Photo: ServerPhotoConfig = new ServerPhotoConfig();
  @ConfigProperty()
  Thumbnail: ServerThumbnailConfig = new ServerThumbnailConfig();
}


@SubConfigClass()
export class ServerEnvironmentConfig {
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
export class ServerConfig {
  @ConfigProperty({volatile: true})
  Environment: ServerEnvironmentConfig = new ServerEnvironmentConfig();
  @ConfigProperty({arrayType: 'string'})
  sessionSecret: string[] = [];
  @ConfigProperty({type: 'unsignedInt', envAlias: 'PORT', min: 0, max: 65535})
  port: number = 80;
  @ConfigProperty()
  host: string = '0.0.0.0';
  @ConfigProperty()
  Media: ServerMediaConfig = new ServerMediaConfig();
  @ConfigProperty()
  Preview: ServerPreviewConfig = new ServerPreviewConfig();
  @ConfigProperty()
  Threading: ServerThreadingConfig = new ServerThreadingConfig();
  @ConfigProperty()
  Database: ServerDataBaseConfig = new ServerDataBaseConfig();
  @ConfigProperty()
  Sharing: ServerSharingConfig = new ServerSharingConfig();
  @ConfigProperty({type: 'unsignedInt', description: 'unit: ms'})
  sessionTimeout: number = 1000 * 60 * 60 * 24 * 7; // in ms
  @ConfigProperty()
  Indexing: ServerIndexingConfig = new ServerIndexingConfig();
  @ConfigProperty({type: 'unsignedInt', description: 'only this many bites will be loaded when scanning photo for metadata'})
  photoMetadataSize: number = 512 * 1024; // only this many bites will be loaded when scanning photo for metadata
  @ConfigProperty()
  Duplicates: ServerDuplicatesConfig = new ServerDuplicatesConfig();
  @ConfigProperty()
  Log: ServerLogConfig = new ServerLogConfig();
  @ConfigProperty()
  Jobs: ServerJobConfig = new ServerJobConfig();
}


export interface IPrivateConfig {
  Server: ServerConfig;
  Client: ClientConfig;

}
