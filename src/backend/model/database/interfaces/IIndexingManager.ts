import {ParentDirectoryDTO} from '../../../../common/entities/DirectoryDTO';
import {IObjectManager} from './IObjectManager';

export interface IIndexingManager extends IObjectManager {
  SavingReady: Promise<void>;
  IsSavingInProgress: boolean;

  indexDirectory(relativeDirectoryName: string): Promise<ParentDirectoryDTO>;

  resetDB(): Promise<void>;

  saveToDB(scannedDirectory: ParentDirectoryDTO): Promise<void>;
}
