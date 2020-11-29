import {IGalleryManager, RandomQuery} from '../interfaces/IGalleryManager';
import {DirectoryDTO} from '../../../../common/entities/DirectoryDTO';
import * as path from 'path';
import * as fs from 'fs';
import {DirectoryEntity} from './enitites/DirectoryEntity';
import {SQLConnection} from './SQLConnection';
import {PhotoEntity} from './enitites/PhotoEntity';
import {ProjectPath} from '../../../ProjectPath';
import {Config} from '../../../../common/config/private/Config';
import {ISQLGalleryManager} from './IGalleryManager';
import {PhotoDTO} from '../../../../common/entities/PhotoDTO';
import {OrientationType} from '../../../../common/entities/RandomQueryDTO';
import {Brackets, Connection, SelectQueryBuilder} from 'typeorm';
import {MediaEntity} from './enitites/MediaEntity';
import {VideoEntity} from './enitites/VideoEntity';
import {DiskMangerWorker} from '../../threading/DiskMangerWorker';
import {Logger} from '../../../Logger';
import {FaceRegionEntry} from './enitites/FaceRegionEntry';
import {ObjectManagers} from '../../ObjectManagers';
import {DuplicatesDTO} from '../../../../common/entities/DuplicatesDTO';
import {ServerConfig} from '../../../../common/config/private/PrivateConfig';

const LOG_TAG = '[GalleryManager]';

export class GalleryManager implements IGalleryManager, ISQLGalleryManager {


  public async listDirectory(relativeDirectoryName: string,
                             knownLastModified?: number,
                             knownLastScanned?: number): Promise<DirectoryDTO> {

    relativeDirectoryName = DiskMangerWorker.normalizeDirPath(relativeDirectoryName);
    const directoryName = path.basename(relativeDirectoryName);
    const directoryParent = path.join(path.dirname(relativeDirectoryName), path.sep);
    const connection = await SQLConnection.getConnection();
    const stat = fs.statSync(path.join(ProjectPath.ImageFolder, relativeDirectoryName));
    const lastModified = DiskMangerWorker.calcLastModified(stat);


    const dir = await this.selectParentDir(connection, directoryName, directoryParent);
    if (dir && dir.lastScanned != null) {
      // If it seems that the content did not changed, do not work on it
      if (knownLastModified && knownLastScanned
        && lastModified === knownLastModified &&
        dir.lastScanned === knownLastScanned) {
        if (Config.Server.Indexing.reIndexingSensitivity === ServerConfig.ReIndexingSensitivity.low) {
          return null;
        }
        if (Date.now() - dir.lastScanned <= Config.Server.Indexing.cachedFolderTimeout &&
          Config.Server.Indexing.reIndexingSensitivity === ServerConfig.ReIndexingSensitivity.medium) {
          return null;
        }
      }


      if (dir.lastModified !== lastModified) {
        Logger.silly(LOG_TAG, 'Reindexing reason: lastModified mismatch: known: '
          + dir.lastModified + ', current:' + lastModified);
        return ObjectManagers.getInstance().IndexingManager.indexDirectory(relativeDirectoryName);
      }


      // not indexed since a while, index it in a lazy manner
      if ((Date.now() - dir.lastScanned > Config.Server.Indexing.cachedFolderTimeout &&
        Config.Server.Indexing.reIndexingSensitivity >= ServerConfig.ReIndexingSensitivity.medium) ||
        Config.Server.Indexing.reIndexingSensitivity >= ServerConfig.ReIndexingSensitivity.high) {
        // on the fly reindexing

        Logger.silly(LOG_TAG, 'lazy reindexing reason: cache timeout: lastScanned: '
          + (Date.now() - dir.lastScanned) + ' ms ago, cachedFolderTimeout:' + Config.Server.Indexing.cachedFolderTimeout);
        ObjectManagers.getInstance().IndexingManager.indexDirectory(relativeDirectoryName).catch((err) => {
          console.error(err);
        });
      }
      await this.fillParentDir(connection, dir);
      return dir;
    }

    // never scanned (deep indexed), do it and return with it
    Logger.silly(LOG_TAG, 'Reindexing reason: never scanned');
    return ObjectManagers.getInstance().IndexingManager.indexDirectory(relativeDirectoryName);


  }

  public async getRandomPhoto(queryFilter: RandomQuery): Promise<PhotoDTO> {
    const connection = await SQLConnection.getConnection();
    const photosRepository = connection.getRepository(PhotoEntity);
    const query: SelectQueryBuilder<PhotoEntity> = photosRepository.createQueryBuilder('photo');
    query.innerJoinAndSelect('photo.directory', 'directory');

    if (queryFilter.directory) {
      const directoryName = path.basename(queryFilter.directory);
      const directoryParent = path.join(path.dirname(queryFilter.directory), path.sep);

      query.where(new Brackets(qb => {
        qb.where('directory.name = :name AND directory.path = :path', {
          name: directoryName,
          path: directoryParent
        });

        if (queryFilter.recursive) {
          qb.orWhere('directory.path LIKE :text COLLATE utf8_general_ci', {text: queryFilter.directory + '%'});
        }
      }));
    }

    if (queryFilter.fromDate) {
      query.andWhere('photo.metadata.creationDate >= :fromDate', {
        fromDate: queryFilter.fromDate.getTime()
      });
    }
    if (queryFilter.toDate) {
      query.andWhere('photo.metadata.creationDate <= :toDate', {
        toDate: queryFilter.toDate.getTime()
      });
    }
    if (queryFilter.minResolution) {
      query.andWhere('photo.metadata.size.width * photo.metadata.size.height >= :minRes', {
        minRes: queryFilter.minResolution * 1000 * 1000
      });
    }

    if (queryFilter.maxResolution) {
      query.andWhere('photo.metadata.size.width * photo.metadata.size.height <= :maxRes', {
        maxRes: queryFilter.maxResolution * 1000 * 1000
      });
    }
    if (queryFilter.orientation === OrientationType.landscape) {
      query.andWhere('photo.metadata.size.width >= photo.metadata.size.height');
    }
    if (queryFilter.orientation === OrientationType.portrait) {
      query.andWhere('photo.metadata.size.width <= photo.metadata.size.height');
    }

    if (Config.Server.Database.type === ServerConfig.DatabaseType.mysql) {
      return await query.groupBy('RAND(), photo.id').limit(1).getOne();
    }
    return await query.groupBy('RANDOM()').limit(1).getOne();

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

  public async getPossibleDuplicates() {
    const connection = await SQLConnection.getConnection();
    const mediaRepository = connection.getRepository(MediaEntity);

    let duplicates = await mediaRepository.createQueryBuilder('media')
      .innerJoin(query => query.from(MediaEntity, 'innerMedia')
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
                               checkDuplicates: boolean = false) => {
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
          const foundDuplicates = duplicateParis.find(dp =>
            !!dp.media.find(m =>
              !!list.find(lm => lm.id === m.id)));
          if (foundDuplicates) {
            list.forEach(lm => {
              if (!!foundDuplicates.media.find(m => m.id === lm.id)) {
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
      (a, b) => a.name === b.name &&
        a.metadata.fileSize === b.metadata.fileSize);


    duplicates = await mediaRepository.createQueryBuilder('media')
      .innerJoin(query => query.from(MediaEntity, 'innerMedia')
          .select(['innerMedia.metadata.creationDate as creationDate', 'innerMedia.metadata.fileSize as fileSize', 'count(*)'])
          .groupBy('innerMedia.metadata.creationDate, innerMedia.metadata.fileSize')
          .having('count(*)>1'),
        'innerMedia',
        'media.metadata.creationDate=innerMedia.creationDate AND media.metadata.fileSize = innerMedia.fileSize')
      .innerJoinAndSelect('media.directory', 'directory')
      .orderBy('media.metadata.creationDate, media.metadata.fileSize')
      .limit(Config.Server.Duplicates.listingLimit).getMany();

    processDuplicates(duplicates,
      (a, b) => a.metadata.creationDate === b.metadata.creationDate &&
        a.metadata.fileSize === b.metadata.fileSize, true);

    return duplicateParis;

  }

  protected async selectParentDir(connection: Connection, directoryName: string, directoryParent: string): Promise<DirectoryEntity> {
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

  protected async fillParentDir(connection: Connection, dir: DirectoryEntity): Promise<void> {
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
      for (let i = 0; i < dir.media.length; i++) {
        dir.media[i].directory = dir;
        dir.media[i].readyThumbnails = [];
        dir.media[i].readyIcon = false;
        (<PhotoDTO>dir.media[i]).metadata.faces = indexedFaces
          .filter(fe => fe.media.id === dir.media[i].id)
          .map(f => ({box: f.box, name: f.person.name}));
      }

    }
    if (dir.directories) {
      for (let i = 0; i < dir.directories.length; i++) {
        dir.directories[i].media = await connection
          .getRepository(MediaEntity)
          .createQueryBuilder('media')
          .where('media.directory = :dir', {
            dir: dir.directories[i].id
          })
          .orderBy('media.metadata.creationDate', 'ASC')
          .limit(Config.Server.Indexing.folderPreviewSize)
          .getMany();
        dir.directories[i].isPartial = true;

        for (let j = 0; j < dir.directories[i].media.length; j++) {
          dir.directories[i].media[j].directory = dir.directories[i];
          dir.directories[i].media[j].readyThumbnails = [];
          dir.directories[i].media[j].readyIcon = false;
        }
      }
    }
  }

}
