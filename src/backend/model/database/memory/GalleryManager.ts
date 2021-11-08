import {ParentDirectoryDTO} from '../../../../common/entities/DirectoryDTO';
import {IGalleryManager} from '../interfaces/IGalleryManager';
import * as path from 'path';
import * as fs from 'fs';
import {DiskManager} from '../../DiskManger';
import {ProjectPath} from '../../../ProjectPath';
import {Config} from '../../../../common/config/private/Config';
import {DiskMangerWorker} from '../../threading/DiskMangerWorker';
import {ReIndexingSensitivity} from '../../../../common/config/private/PrivateConfig';
import {ServerPG2ConfMap} from '../../../../common/PG2ConfMap';

export class GalleryManager implements IGalleryManager {

  public async listDirectory(relativeDirectoryName: string,
                             knownLastModified?: number,
                             knownLastScanned?: number): Promise<ParentDirectoryDTO> {
    // If it seems that the content did not changed, do not work on it
    if (knownLastModified && knownLastScanned) {
      const stat = fs.statSync(path.join(ProjectPath.ImageFolder, relativeDirectoryName));
      const lastModified = DiskMangerWorker.calcLastModified(stat);
      if (Date.now() - knownLastScanned <= Config.Server.Indexing.cachedFolderTimeout &&
        lastModified === knownLastModified &&
        Config.Server.Indexing.reIndexingSensitivity < ReIndexingSensitivity.high) {
        return Promise.resolve(null);
      }
    }
    const dir = await DiskManager.scanDirectory(relativeDirectoryName);
    dir.metaFile = dir.metaFile.filter(m => !ServerPG2ConfMap[m.name]);
    return dir;
  }

}
