import {IGalleryManager} from '../interfaces/IGalleryManager';
import {ParentDirectoryDTO, SubDirectoryDTO} from '../../../../common/entities/DirectoryDTO';
import * as path from 'path';
import * as fs from 'fs';
import {DirectoryEntity} from './enitites/DirectoryEntity';
import {SQLConnection} from './SQLConnection';
import {PhotoEntity} from './enitites/PhotoEntity';
import {ProjectPath} from '../../../ProjectPath';
import {Config} from '../../../../common/config/private/Config';
import {ISQLGalleryManager} from './IGalleryManager';
import {PhotoDTO} from '../../../../common/entities/PhotoDTO';
import {Connection} from 'typeorm';
import {MediaEntity} from './enitites/MediaEntity';
import {VideoEntity} from './enitites/VideoEntity';
import {DiskMangerWorker} from '../../threading/DiskMangerWorker';
import {Logger} from '../../../Logger';
import {FaceRegionEntry} from './enitites/FaceRegionEntry';
import {ObjectManagers} from '../../ObjectManagers';
import {DuplicatesDTO} from '../../../../common/entities/DuplicatesDTO';
import {ReIndexingSensitivity} from '../../../../common/config/private/PrivateConfig';


const LOG_TAG = '[GalleryManager]';

export class GalleryManager implements IGalleryManager, ISQLGalleryManager {

  public static parseRelativeDirePath(relativeDirectoryName: string): { name: string, parent: string } {

    relativeDirectoryName = DiskMangerWorker.normalizeDirPath(relativeDirectoryName);
    return {
      name: path.basename(relativeDirectoryName),
      parent: path.join(path.dirname(relativeDirectoryName), path.sep),
    };
  }

  public async listDirectory(relativeDirectoryName: string,
                             knownLastModified?: number,
                             knownLastScanned?: number): Promise<ParentDirectoryDTO> {
    const directoryPath = GalleryManager.parseRelativeDirePath(relativeDirectoryName);
    const connection = await SQLConnection.getConnection();
    const stat = fs.statSync(path.join(ProjectPath.ImageFolder, relativeDirectoryName));
    const lastModified = DiskMangerWorker.calcLastModified(stat);

    const dir = await this.selectParentDir(connection, directoryPath.name, directoryPath.parent);
    if (dir && dir.lastScanned != null) {
      // If it seems that the content did not changed, do not work on it
      if (knownLastModified && knownLastScanned
        && lastModified === knownLastModified &&
        dir.lastScanned === knownLastScanned) {
        if (Config.Server.Indexing.reIndexingSensitivity === ReIndexingSensitivity.low) {
          return null;
        }
        if (Date.now() - dir.lastScanned <= Config.Server.Indexing.cachedFolderTimeout &&
          Config.Server.Indexing.reIndexingSensitivity === ReIndexingSensitivity.medium) {
          return null;
        }
      }


      if (dir.lastModified !== lastModified) {
        Logger.silly(LOG_TAG, 'Reindexing reason: lastModified mismatch: known: '
          + dir.lastModified + ', current:' + lastModified);
        const ret = await ObjectManagers.getInstance().IndexingManager.indexDirectory(relativeDirectoryName);
        for (const subDir of ret.directories) {
          if (!subDir.preview) { // if sub directories does not have photos, so cannot show a preview, try get one from DB
            await this.fillPreviewForSubDir(connection, subDir);
          }
        }
        return ret;
      }


      // not indexed since a while, index it in a lazy manner
      if ((Date.now() - dir.lastScanned > Config.Server.Indexing.cachedFolderTimeout &&
          Config.Server.Indexing.reIndexingSensitivity >= ReIndexingSensitivity.medium) ||
        Config.Server.Indexing.reIndexingSensitivity >= ReIndexingSensitivity.high) {
        // on the fly reindexing

        Logger.silly(LOG_TAG, 'lazy reindexing reason: cache timeout: lastScanned: '
          + (Date.now() - dir.lastScanned) + 'ms ago, cachedFolderTimeout:' + Config.Server.Indexing.cachedFolderTimeout);
        ObjectManagers.getInstance().IndexingManager.indexDirectory(relativeDirectoryName).catch(console.error);
      }
      await this.fillParentDir(connection, dir);
      return dir;
    }

    // never scanned (deep indexed), do it and return with it
    Logger.silly(LOG_TAG, 'Reindexing reason: never scanned');
    return ObjectManagers.getInstance().IndexingManager.indexDirectory(relativeDirectoryName);


  }

  async countDirectories(): Promise<number> {
    const connection = await SQLConnection.getConnection();
    return await connection.getRepository(DirectoryEntity)
      .createQueryBuilder('directory')
      .getCount();
  }

  async countMediaSize(): Promise<number> {
    const connection = await SQLConnection.getConnection();
    const {sum} = await connection.getRepository(MediaEntity)
      .createQueryBuilder('media')
      .select('SUM(media.metadata.fileSize)', 'sum')
      .getRawOne();
    return sum || 0;
  }

  async countPhotos(): Promise<number> {
    const connection = await SQLConnection.getConnection();
    return await connection.getRepository(PhotoEntity)
      .createQueryBuilder('directory')
      .getCount();
  }

  async countVideos(): Promise<number> {
    const connection = await SQLConnection.getConnection();
    return await connection.getRepository(VideoEntity)
      .createQueryBuilder('directory')
      .getCount();
  }

  public async getPossibleDuplicates(): Promise<DuplicatesDTO[]> {
    const connection = await SQLConnection.getConnection();
    const mediaRepository = connection.getRepository(MediaEntity);

    let duplicates = await mediaRepository.createQueryBuilder('media')
      .innerJoin((query): any => query.from(MediaEntity, 'innerMedia')
          .select(['innerMedia.name as name', 'innerMedia.metadata.fileSize as fileSize', 'count(*)'])
          .groupBy('innerMedia.name, innerMedia.metadata.fileSize')
          .having('count(*)>1'),
        'innerMedia',
        'media.name=innerMedia.name AND media.metadata.fileSize = innerMedia.fileSize')
      .innerJoinAndSelect('media.directory', 'directory')
      .orderBy('media.name, media.metadata.fileSize')
      .limit(Config.Server.Duplicates.listingLimit).getMany();


    const duplicateParis: DuplicatesDTO[] = [];
    const processDuplicates = (duplicateList: MediaEntity[],
                               equalFn: (a: MediaEntity, b: MediaEntity) => boolean,
                               checkDuplicates: boolean = false): void => {
      let i = duplicateList.length - 1;
      while (i >= 0) {
        const list = [duplicateList[i]];
        let j = i - 1;
        while (j >= 0 && equalFn(duplicateList[i], duplicateList[j])) {
          list.push(duplicateList[j]);
          j--;
        }
        i = j;
        // if we cut the select list with the SQL LIMIT, filter unpaired media
        if (list.length < 2) {
          continue;
        }
        if (checkDuplicates) {
          // ad to group if one already existed
          const foundDuplicates = duplicateParis.find((dp): boolean =>
            !!dp.media.find((m): boolean =>
              !!list.find((lm): boolean => lm.id === m.id)));
          if (foundDuplicates) {
            list.forEach((lm): void => {
              if (!!foundDuplicates.media.find((m): boolean => m.id === lm.id)) {
                return;
              }
              foundDuplicates.media.push(lm);
            });
            continue;
          }
        }

        duplicateParis.push({media: list});
      }
    };

    processDuplicates(duplicates,
      (a, b): boolean => a.name === b.name &&
        a.metadata.fileSize === b.metadata.fileSize);


    duplicates = await mediaRepository.createQueryBuilder('media')
      .innerJoin((query): any => query.from(MediaEntity, 'innerMedia')
          .select(['innerMedia.metadata.creationDate as creationDate', 'innerMedia.metadata.fileSize as fileSize', 'count(*)'])
          .groupBy('innerMedia.metadata.creationDate, innerMedia.metadata.fileSize')
          .having('count(*)>1'),
        'innerMedia',
        'media.metadata.creationDate=innerMedia.creationDate AND media.metadata.fileSize = innerMedia.fileSize')
      .innerJoinAndSelect('media.directory', 'directory')
      .orderBy('media.metadata.creationDate, media.metadata.fileSize')
      .limit(Config.Server.Duplicates.listingLimit).getMany();

    processDuplicates(duplicates,
      (a, b): boolean => a.metadata.creationDate === b.metadata.creationDate &&
        a.metadata.fileSize === b.metadata.fileSize, true);

    return duplicateParis;

  }

  /**
   * Returns with the directories only, does not include media or metafiles
   */
  public async selectDirStructure(relativeDirectoryName: string): Promise<DirectoryEntity> {
    const directoryPath = GalleryManager.parseRelativeDirePath(relativeDirectoryName);
    const connection = await SQLConnection.getConnection();
    const query = connection
      .getRepository(DirectoryEntity)
      .createQueryBuilder('directory')
      .where('directory.name = :name AND directory.path = :path', {
        name: directoryPath.name,
        path: directoryPath.parent
      })
      .leftJoinAndSelect('directory.directories', 'directories');

    return await query.getOne();
  }

  /**
   * Sets preview for the directory
   */
  public async fillPreviewForSubDir(connection: Connection, dir: SubDirectoryDTO): Promise<void> {

    dir.media = [];
    dir.preview = await ObjectManagers.getInstance().PreviewManager.getPreviewForDirectory(dir);
    dir.isPartial = true;

    if (dir.preview) {
      dir.preview.readyThumbnails = [];
      dir.preview.readyIcon = false;
    }
  }

  protected async selectParentDir(connection: Connection, directoryName: string, directoryParent: string): Promise<ParentDirectoryDTO> {
    const query = connection
      .getRepository(DirectoryEntity)
      .createQueryBuilder('directory')
      .where('directory.name = :name AND directory.path = :path', {
        name: directoryName,
        path: directoryParent
      })
      .leftJoinAndSelect('directory.directories', 'directories')
      .leftJoinAndSelect('directory.media', 'media');

    if (Config.Client.MetaFile.enabled === true) {
      query.leftJoinAndSelect('directory.metaFile', 'metaFile');
    }

    return await query.getOne();
  }


  protected async fillParentDir(connection: Connection, dir: ParentDirectoryDTO): Promise<void> {
    if (dir.media) {
      const indexedFaces = await connection.getRepository(FaceRegionEntry)
        .createQueryBuilder('face')
        .leftJoinAndSelect('face.media', 'media')
        .where('media.directory = :directory', {
          directory: dir.id
        })
        .leftJoinAndSelect('face.person', 'person')
        .select(['face.id', 'face.box.left',
          'face.box.top', 'face.box.width', 'face.box.height',
          'media.id', 'person.name', 'person.id'])
        .getMany();
      for (const item of dir.media) {
        item.directory = dir;
        item.readyThumbnails = [];
        item.readyIcon = false;
        (item as PhotoDTO).metadata.faces = indexedFaces
          .filter((fe): boolean => fe.media.id === item.id)
          .map((f): { name: any; box: any } => ({box: f.box, name: f.person.name}));
      }
    }
    if (dir.metaFile) {
      for (const item of dir.metaFile) {
        item.directory = dir;
      }
    }
    if (dir.directories) {
      for (const item of dir.directories) {
        await this.fillPreviewForSubDir(connection, item);
      }
    }
  }
}
