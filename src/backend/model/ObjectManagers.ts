import {IUserManager} from './database/interfaces/IUserManager';
import {IGalleryManager} from './database/interfaces/IGalleryManager';
import {ISearchManager} from './database/interfaces/ISearchManager';
import {SQLConnection} from './database/sql/SQLConnection';
import {ISharingManager} from './database/interfaces/ISharingManager';
import {Logger} from '../Logger';
import {IIndexingManager} from './database/interfaces/IIndexingManager';
import {IPersonManager} from './database/interfaces/IPersonManager';
import {IVersionManager} from './database/interfaces/IVersionManager';
import {IJobManager} from './database/interfaces/IJobManager';
import {LocationManager} from './database/LocationManager';
import {IAlbumManager} from './database/interfaces/IAlbumManager';
import {JobManager} from './jobs/JobManager';
import {IPreviewManager} from './database/interfaces/IPreviewManager';
import {ParentDirectoryDTO} from '../../common/entities/DirectoryDTO';
import {IObjectManager} from './database/interfaces/IObjectManager';

const LOG_TAG = '[ObjectManagers]';

export class ObjectManagers {

  private static instance: ObjectManagers = null;

  private readonly managers: IObjectManager[];
  private galleryManager: IGalleryManager;
  private userManager: IUserManager;
  private searchManager: ISearchManager;
  private sharingManager: ISharingManager;
  private indexingManager: IIndexingManager;
  private personManager: IPersonManager;
  private previewManager: IPreviewManager;
  private versionManager: IVersionManager;
  private jobManager: IJobManager;
  private locationManager: LocationManager;
  private albumManager: IAlbumManager;


  constructor() {
    this.managers = [];
  }

  get VersionManager(): IVersionManager {
    return this.versionManager;
  }

  set VersionManager(value: IVersionManager) {
    if (this.versionManager) {
      this.managers.splice(this.managers.indexOf(this.versionManager), 1);
    }
    this.versionManager = value;
    this.managers.push(this.versionManager);
  }

  get LocationManager(): LocationManager {
    return this.locationManager;
  }

  set LocationManager(value: LocationManager) {
    if (this.locationManager) {
      this.managers.splice(this.managers.indexOf(this.locationManager), 1);
    }
    this.locationManager = value;
    this.managers.push(this.locationManager);
  }

  get AlbumManager(): IAlbumManager {
    return this.albumManager;
  }

  set AlbumManager(value: IAlbumManager) {
    if (this.albumManager) {
      this.managers.splice(this.managers.indexOf(this.albumManager), 1);
    }
    this.albumManager = value;
    this.managers.push(this.albumManager);
  }

  get PersonManager(): IPersonManager {
    return this.personManager;
  }

  set PersonManager(value: IPersonManager) {
    if (this.personManager) {
      this.managers.splice(this.managers.indexOf(this.personManager), 1);
    }
    this.personManager = value;
    this.managers.push(this.personManager);
  }

  get PreviewManager(): IPreviewManager {
    return this.previewManager;
  }

  set PreviewManager(value: IPreviewManager) {
    if (this.previewManager) {
      this.managers.splice(this.managers.indexOf(this.previewManager), 1);
    }
    this.previewManager = value;
    this.managers.push(this.previewManager);
  }

  get IndexingManager(): IIndexingManager {
    return this.indexingManager;
  }

  set IndexingManager(value: IIndexingManager) {
    if (this.indexingManager) {
      this.managers.splice(this.managers.indexOf(this.indexingManager), 1);
    }
    this.indexingManager = value;
    this.managers.push(this.indexingManager);
  }


  get GalleryManager(): IGalleryManager {
    return this.galleryManager;
  }

  set GalleryManager(value: IGalleryManager) {
    if (this.galleryManager) {
      this.managers.splice(this.managers.indexOf(this.galleryManager), 1);
    }
    this.galleryManager = value;
    this.managers.push(this.galleryManager);
  }

  get UserManager(): IUserManager {
    return this.userManager;
  }

  set UserManager(value: IUserManager) {
    if (this.userManager) {
      this.managers.splice(this.managers.indexOf(this.userManager), 1);
    }
    this.userManager = value;
    this.managers.push(this.userManager);
  }

  get SearchManager(): ISearchManager {
    return this.searchManager;
  }

  set SearchManager(value: ISearchManager) {
    if (this.searchManager) {
      this.managers.splice(this.managers.indexOf(this.searchManager), 1);
    }
    this.searchManager = value;
    this.managers.push(this.searchManager);
  }

  get SharingManager(): ISharingManager {
    return this.sharingManager;
  }

  set SharingManager(value: ISharingManager) {
    if (this.sharingManager) {
      this.managers.splice(this.managers.indexOf(this.sharingManager), 1);
    }
    this.sharingManager = value;
    this.managers.push(this.sharingManager);
  }

  get JobManager(): IJobManager {
    return this.jobManager;
  }

  set JobManager(value: IJobManager) {
    if (this.jobManager) {
      this.managers.splice(this.managers.indexOf(this.jobManager), 1);
    }
    this.jobManager = value;
    this.managers.push(this.jobManager);
  }

  public static getInstance(): ObjectManagers {
    if (this.instance === null) {
      this.instance = new ObjectManagers();
    }
    return this.instance;
  }

  public static async reset(): Promise<void> {
    Logger.silly(LOG_TAG, 'Object manager reset begin');
    if (ObjectManagers.getInstance().IndexingManager &&
      ObjectManagers.getInstance().IndexingManager.IsSavingInProgress) {
      await ObjectManagers.getInstance().IndexingManager.SavingReady;
    }
    if (ObjectManagers.getInstance().JobManager) {
      ObjectManagers.getInstance().JobManager.stopSchedules();
    }
    await SQLConnection.close();
    this.instance = null;
    Logger.debug(LOG_TAG, 'Object manager reset');
  }

  public static async InitMemoryManagers(): Promise<void> {
    await ObjectManagers.reset();
    this.initManagers('memory');
    Logger.debug(LOG_TAG, 'Memory DB inited');
  }

  public static async InitSQLManagers(): Promise<void> {
    await ObjectManagers.reset();
    await SQLConnection.init();
    this.initManagers('sql');
    Logger.debug(LOG_TAG, 'SQL DB inited');
  }

  private static initManagers(type: 'memory' | 'sql'): void {
    ObjectManagers.getInstance().AlbumManager = new (require(`./database/${type}/AlbumManager`).AlbumManager)();
    ObjectManagers.getInstance().GalleryManager = new (require(`./database/${type}/GalleryManager`).GalleryManager)();
    ObjectManagers.getInstance().IndexingManager = new (require(`./database/${type}/IndexingManager`).IndexingManager)();
    ObjectManagers.getInstance().PersonManager = new (require(`./database/${type}/PersonManager`).PersonManager)();
    ObjectManagers.getInstance().PreviewManager = new (require(`./database/${type}/PreviewManager`).PreviewManager)();
    ObjectManagers.getInstance().SearchManager = new (require(`./database/${type}/SearchManager`).SearchManager)();
    ObjectManagers.getInstance().SharingManager = new (require(`./database/${type}/SharingManager`).SharingManager)();
    ObjectManagers.getInstance().UserManager = new (require(`./database/${type}/UserManager`).UserManager)();
    ObjectManagers.getInstance().VersionManager = new (require(`./database/${type}/VersionManager`).VersionManager)();
    ObjectManagers.getInstance().JobManager = new JobManager();
    ObjectManagers.getInstance().LocationManager = new LocationManager();
  }

  public async onDataChange(changedDir: ParentDirectoryDTO = null): Promise<void> {
    await this.VersionManager.onNewDataVersion(changedDir);

    for (const manager of this.managers) {
      if (manager === this.versionManager) {
        continue;
      }
      if (manager.onNewDataVersion) {
        await manager.onNewDataVersion(changedDir);
      }
    }
  }

}
