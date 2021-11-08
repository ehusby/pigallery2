import {promises as fsp, Stats} from 'fs';
import * as path from 'path';
import {ParentDirectoryDTO, SubDirectoryDTO} from '../../../common/entities/DirectoryDTO';
import {PhotoDTO} from '../../../common/entities/PhotoDTO';
import {ProjectPath} from '../../ProjectPath';
import {Config} from '../../../common/config/private/Config';
import {VideoDTO} from '../../../common/entities/VideoDTO';
import {FileDTO} from '../../../common/entities/FileDTO';
import {MetadataLoader} from './MetadataLoader';
import {Logger} from '../../Logger';
import {SupportedFormats} from '../../../common/SupportedFormats';
import {VideoProcessing} from '../fileprocessing/VideoProcessing';
import {PhotoProcessing} from '../fileprocessing/PhotoProcessing';
import {Utils} from '../../../common/Utils';


export class DiskMangerWorker {


  public static calcLastModified(stat: Stats): number {
    return Math.max(stat.ctime.getTime(), stat.mtime.getTime());
  }

  public static normalizeDirPath(dirPath: string): string {
    return path.normalize(path.join('.' + path.sep, dirPath));
  }

  public static pathFromRelativeDirName(relativeDirectoryName: string): string {
    return path.join(path.dirname(this.normalizeDirPath(relativeDirectoryName)), path.sep);
  }


  public static pathFromParent(parent: { path: string, name: string }): string {
    return path.join(this.normalizeDirPath(path.join(parent.path, parent.name)), path.sep);
  }

  public static dirName(name: string): any {
    if (name.trim().length === 0) {
      return '.';
    }
    return path.basename(name);
  }

  public static async excludeDir(name: string, relativeDirectoryName: string, absoluteDirectoryName: string): Promise<boolean> {
    if (Config.Server.Indexing.excludeFolderList.length === 0 &&
      Config.Server.Indexing.excludeFileList.length === 0) {
      return false;
    }
    const absoluteName = path.normalize(path.join(absoluteDirectoryName, name));
    const relativeName = path.normalize(path.join(relativeDirectoryName, name));

    for (const exclude of Config.Server.Indexing.excludeFolderList) {
      if (exclude.startsWith('/')) {
        if (exclude === absoluteName) {
          return true;
        }
      } else if (exclude.includes('/')) {
        if (path.normalize(exclude) === relativeName) {
          return true;
        }
      } else {
        if (exclude === name) {
          return true;
        }
      }
    }
    // exclude dirs that have the given files (like .ignore)
    for (const exclude of Config.Server.Indexing.excludeFileList) {
      try {
        await fsp.access(path.join(absoluteName, exclude));
        return true;
      } catch (e) {
      }
    }

    return false;
  }

  public static async scanDirectoryNoMetadata(relativeDirectoryName: string,
                                              settings: DirectoryScanSettings = {}): Promise<ParentDirectoryDTO<FileDTO>> {
    settings.noMetadata = true;
    return (await this.scanDirectory(relativeDirectoryName, settings)) as ParentDirectoryDTO<FileDTO>;
  }

  public static async scanDirectory(relativeDirectoryName: string,
                                    settings: DirectoryScanSettings = {}): Promise<ParentDirectoryDTO> {

    relativeDirectoryName = this.normalizeDirPath(relativeDirectoryName);
    const directoryName = DiskMangerWorker.dirName(relativeDirectoryName);
    const directoryParent = this.pathFromRelativeDirName(relativeDirectoryName);
    const absoluteDirectoryName = path.join(ProjectPath.ImageFolder, relativeDirectoryName);

    const stat = await fsp.stat(path.join(ProjectPath.ImageFolder, relativeDirectoryName));
    const directory: ParentDirectoryDTO = {
      id: null,
      parent: null,
      name: directoryName,
      path: directoryParent,
      lastModified: this.calcLastModified(stat),
      lastScanned: Date.now(),
      directories: [],
      isPartial: false,
      mediaCount: 0,
      preview: null,
      media: [],
      metaFile: []
    };

    // nothing to scan, we are here for the empty dir
    if (settings.noPhoto === true && settings.noMetadata === true && settings.noVideo === true) {
      return directory;
    }
    const list = await fsp.readdir(absoluteDirectoryName);
    for (const file of list) {
      const fullFilePath = path.normalize(path.join(absoluteDirectoryName, file));
      if ((await fsp.stat(fullFilePath)).isDirectory()) {
        if (settings.noDirectory === true || settings.previewOnly === true ||
          await DiskMangerWorker.excludeDir(file, relativeDirectoryName, absoluteDirectoryName)) {
          continue;
        }

        // create preview directory
        const d = await DiskMangerWorker.scanDirectory(path.join(relativeDirectoryName, file),
          {
            previewOnly: true
          }
        ) as SubDirectoryDTO;

        d.lastScanned = 0; // it was not a fully scan
        d.isPartial = true;

        directory.directories.push(d);

      } else if (PhotoProcessing.isPhoto(fullFilePath)) {
        if (settings.noPhoto === true) {
          continue;
        }

        const photo = {
          name: file,
          directory: null,
          metadata: settings.noMetadata === true ? null : await MetadataLoader.loadPhotoMetadata(fullFilePath)
        } as PhotoDTO;

        if (!directory.preview) {
          directory.preview = Utils.clone(photo);

          directory.preview.directory = {
            path: directory.path,
            name: directory.name
          };
        }
        // add the preview photo to the list of media, so it will be saved to the DB
        // and can be queried to populate previews,
        // otherwise we do not return media list that is only partial
        directory.media.push(photo);

        if (settings.previewOnly === true) {
          break;
        }

      } else if (VideoProcessing.isVideo(fullFilePath)) {
        if (Config.Client.Media.Video.enabled === false || settings.noVideo === true || settings.previewOnly === true) {
          continue;
        }
        try {
          directory.media.push({
            name: file,
            directory: null,
            metadata: settings.noMetadata === true ? null : await MetadataLoader.loadVideoMetadata(fullFilePath)
          } as VideoDTO);
        } catch (e) {
          Logger.warn('Media loading error, skipping: ' + file + ', reason: ' + e.toString());
        }

      } else if (DiskMangerWorker.isMetaFile(fullFilePath)) {
        if (Config.Client.MetaFile.enabled === false || settings.noMetaFile === true || settings.previewOnly === true) {
          continue;
        }

        directory.metaFile.push({
          name: file,
          directory: null,
        } as FileDTO);

      }
    }

    directory.mediaCount = directory.media.length;

    return directory;
  }


  private static isMetaFile(fullPath: string): boolean {
    const extension = path.extname(fullPath).toLowerCase();
    return SupportedFormats.WithDots.MetaFiles.indexOf(extension) !== -1;
  }

}

export interface DirectoryScanSettings {
  previewOnly?: boolean;
  noMetaFile?: boolean;
  noVideo?: boolean;
  noPhoto?: boolean;
  noDirectory?: boolean;
  noMetadata?: boolean;
  noChildDirPhotos?: boolean;
}
