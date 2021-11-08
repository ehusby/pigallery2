import {ParentDirectoryDTO} from '../../../../common/entities/DirectoryDTO';
import {IObjectManager} from './IObjectManager';

export interface IGalleryManager extends IObjectManager {
  listDirectory(relativeDirectoryName: string,
                knownLastModified?: number,
                knownLastScanned?: number): Promise<ParentDirectoryDTO>;


}
