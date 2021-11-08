import {ObjectManagers} from '../../ObjectManagers';
import * as path from 'path';
import * as fs from 'fs';
import {Config} from '../../../../common/config/private/Config';
import {Job} from './Job';
import {ConfigTemplateEntry, DefaultsJobs} from '../../../../common/entities/job/JobDTO';
import {JobProgressStates} from '../../../../common/entities/job/JobProgressDTO';
import {DatabaseType} from '../../../../common/config/private/PrivateConfig';
import {DiskMangerWorker} from '../../threading/DiskMangerWorker';
import {ProjectPath} from '../../../ProjectPath';
import {backendTexts} from '../../../../common/BackendTexts';
import {ParentDirectoryDTO} from '../../../../common/entities/DirectoryDTO';
import {ISQLGalleryManager} from '../../database/sql/IGalleryManager';
import {Logger} from '../../../Logger';
import {FileDTO} from '../../../../common/entities/FileDTO';


export class IndexingJob<S extends { indexChangesOnly: boolean } = { indexChangesOnly: boolean }> extends Job<S> {
  public readonly Name = DefaultsJobs[DefaultsJobs.Indexing];
  directoriesToIndex: string[] = [];
  public readonly ConfigTemplate: ConfigTemplateEntry[] = [{
    id: 'indexChangesOnly',
    type: 'boolean',
    name: backendTexts.indexChangesOnly.name,
    description: backendTexts.indexChangesOnly.description,
    defaultValue: true
  }];

  public get Supported(): boolean {
    return Config.Server.Database.type !== DatabaseType.memory;
  }


  protected async init(): Promise<void> {
    this.directoriesToIndex.push('/');
  }

  protected async step(): Promise<boolean> {
    if (this.directoriesToIndex.length === 0) {
      if (ObjectManagers.getInstance().IndexingManager.IsSavingInProgress) {
        await ObjectManagers.getInstance().IndexingManager.SavingReady;
      }
      this.Progress.Left = 0;
      return false;
    }
    const directory = this.directoriesToIndex.shift();
    this.Progress.Left = this.directoriesToIndex.length;

    let scanned: ParentDirectoryDTO<FileDTO>;
    let dirChanged = true;

    // check if the folder got modified if only changes need to be indexed
    if (this.config.indexChangesOnly) {
      const stat = fs.statSync(path.join(ProjectPath.ImageFolder, directory));
      const lastModified = DiskMangerWorker.calcLastModified(stat);
      scanned = await (ObjectManagers.getInstance().GalleryManager as ISQLGalleryManager).selectDirStructure(directory);
      // If not modified and it was scanned before, dir is up-to-date
      if (scanned && scanned.lastModified === lastModified && scanned.lastScanned != null) {
        dirChanged = false;
      }
    }

    // reindex
    if (dirChanged || !this.config.indexChangesOnly) {
      this.Progress.log('Indexing: ' + directory);
      this.Progress.Processed++;
      scanned = await ObjectManagers.getInstance().IndexingManager.indexDirectory(directory);
    } else {
      this.Progress.log('Skipped: ' + directory);
      this.Progress.Skipped++;
      Logger.silly('Skipping reindexing, no change for: ' + directory);
    }
    if (this.Progress.State !== JobProgressStates.running) {
      return false;
    }
    for (const item of scanned.directories) {
      this.directoriesToIndex.push(path.join(item.path, item.name));
    }
    return true;
  }


}
