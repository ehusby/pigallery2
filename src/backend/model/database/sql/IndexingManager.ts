import {ParentDirectoryDTO} from '../../../../common/entities/DirectoryDTO';
import {DirectoryEntity} from './enitites/DirectoryEntity';
import {SQLConnection} from './SQLConnection';
import {DiskManager} from '../../DiskManger';
import {PhotoEntity, PhotoMetadataEntity} from './enitites/PhotoEntity';
import {Utils} from '../../../../common/Utils';
import {FaceRegion, PhotoMetadata} from '../../../../common/entities/PhotoDTO';
import {Connection, Repository} from 'typeorm';
import {MediaEntity} from './enitites/MediaEntity';
import {MediaDTO, MediaDTOUtils} from '../../../../common/entities/MediaDTO';
import {VideoEntity} from './enitites/VideoEntity';
import {FileEntity} from './enitites/FileEntity';
import {FileDTO} from '../../../../common/entities/FileDTO';
import {NotificationManager} from '../../NotifocationManager';
import {FaceRegionEntry} from './enitites/FaceRegionEntry';
import {ObjectManagers} from '../../ObjectManagers';
import {IIndexingManager} from '../interfaces/IIndexingManager';
import {DiskMangerWorker} from '../../threading/DiskMangerWorker';
import {Logger} from '../../../Logger';
import {ServerPG2ConfMap, ServerSidePG2ConfAction} from '../../../../common/PG2ConfMap';
import {ProjectPath} from '../../../ProjectPath';
import * as path from 'path';
import * as fs from 'fs';
import {SearchQueryDTO} from '../../../../common/entities/SearchQueryDTO';
import {PersonEntry} from './enitites/PersonEntry';

const LOG_TAG = '[IndexingManager]';

export class IndexingManager implements IIndexingManager {

  SavingReady: Promise<void> = null;
  private SavingReadyPR: () => void = null;
  private savingQueue: ParentDirectoryDTO[] = [];
  private isSaving = false;

  get IsSavingInProgress(): boolean {
    return this.SavingReady !== null;
  }

  private static async processServerSidePG2Conf(files: FileDTO[]): Promise<void> {
    for (const f of files) {
      if (ServerPG2ConfMap[f.name] === ServerSidePG2ConfAction.SAVED_SEARCH) {
        const fullMediaPath = path.join(ProjectPath.ImageFolder, f.directory.path, f.directory.name, f.name);

        Logger.silly(LOG_TAG, 'Saving saved-searches to DB from:', fullMediaPath);
        const savedSearches: { name: string, searchQuery: SearchQueryDTO }[] =
          JSON.parse(await fs.promises.readFile(fullMediaPath, 'utf8'));
        for (const s of savedSearches) {
          await ObjectManagers.getInstance().AlbumManager.addIfNotExistSavedSearch(s.name, s.searchQuery, true);
        }
      }
    }
  }

  /**
   * Indexes a dir, but returns early with the scanned version,
   * does not wait for the DB to be saved
   */
  public indexDirectory(relativeDirectoryName: string): Promise<ParentDirectoryDTO> {
    return new Promise(async (resolve, reject): Promise<void> => {
      try {
        const scannedDirectory = await DiskManager.scanDirectory(relativeDirectoryName);

        // returning with the result
        if (scannedDirectory.preview) {
          scannedDirectory.preview.readyThumbnails = [];
        }
        scannedDirectory.media.forEach((p): any[] => p.readyThumbnails = []);


        const dirClone = Utils.shallowClone(scannedDirectory);
        // filter server side only config from returning
        dirClone.metaFile = dirClone.metaFile.filter(m => !ServerPG2ConfMap[m.name]);

        resolve(dirClone);

        // save directory to DB
        this.queueForSave(scannedDirectory).catch(console.error);

      } catch (error) {
        NotificationManager.warning('Unknown indexing error for: ' + relativeDirectoryName, error.toString());
        console.error(error);
        return reject(error);
      }

    });
  }

  async resetDB(): Promise<void> {
    Logger.info(LOG_TAG, 'Resetting DB');
    const connection = await SQLConnection.getConnection();
    await connection
      .getRepository(DirectoryEntity)
      .createQueryBuilder('directory')
      .delete()
      .execute();
  }

  public async saveToDB(scannedDirectory: ParentDirectoryDTO): Promise<void> {
    this.isSaving = true;
    try {
      const connection = await SQLConnection.getConnection();
      const serverSideConfigs = scannedDirectory.metaFile.filter(m => !!ServerPG2ConfMap[m.name]);
      scannedDirectory.metaFile = scannedDirectory.metaFile.filter(m => !ServerPG2ConfMap[m.name]);
      const currentDirId: number = await this.saveParentDir(connection, scannedDirectory);
      await this.saveChildDirs(connection, currentDirId, scannedDirectory);
      await this.saveMedia(connection, currentDirId, scannedDirectory.media);
      await this.saveMetaFiles(connection, currentDirId, scannedDirectory);
      await IndexingManager.processServerSidePG2Conf(serverSideConfigs);
      await ObjectManagers.getInstance().onDataChange(scannedDirectory);
    } finally {
      this.isSaving = false;
    }
  }

  // Todo fix it, once typeorm support connection pools for sqlite
  /**
   * Queues up a directory to save to the DB.
   */
  protected async queueForSave(scannedDirectory: ParentDirectoryDTO): Promise<void> {
    // Is this dir  already queued for saving?
    if (this.savingQueue.findIndex((dir): boolean => dir.name === scannedDirectory.name &&
      dir.path === scannedDirectory.path &&
      dir.lastModified === scannedDirectory.lastModified &&
      dir.lastScanned === scannedDirectory.lastScanned &&
      (dir.media || dir.media.length) === (scannedDirectory.media || scannedDirectory.media.length) &&
      (dir.metaFile || dir.metaFile.length) === (scannedDirectory.metaFile || scannedDirectory.metaFile.length)) !== -1) {
      return;
    }
    this.savingQueue.push(scannedDirectory);
    if (!this.SavingReady) {
      this.SavingReady = new Promise<void>((resolve): void => {
        this.SavingReadyPR = resolve;
      });
    }
    try {
      while (this.isSaving === false && this.savingQueue.length > 0) {
        await this.saveToDB(this.savingQueue[0]);
        this.savingQueue.shift();
      }
    } catch (e) {
      this.savingQueue = [];
      throw e;
    } finally {
      if (this.savingQueue.length === 0) {
        this.SavingReady = null;
        this.SavingReadyPR();
      }

    }

  }

  protected async saveParentDir(connection: Connection, scannedDirectory: ParentDirectoryDTO): Promise<number> {
    const directoryRepository = connection.getRepository(DirectoryEntity);

    const currentDir: DirectoryEntity = await directoryRepository.createQueryBuilder('directory')
      .where('directory.name = :name AND directory.path = :path', {
        name: scannedDirectory.name,
        path: scannedDirectory.path
      }).getOne();
    if (!!currentDir) {// Updated parent dir (if it was in the DB previously)
      currentDir.lastModified = scannedDirectory.lastModified;
      currentDir.lastScanned = scannedDirectory.lastScanned;
      currentDir.mediaCount = scannedDirectory.mediaCount;
      await directoryRepository.save(currentDir);
      return currentDir.id;

    } else {
      return (await directoryRepository.insert({
        mediaCount: scannedDirectory.mediaCount,
        lastModified: scannedDirectory.lastModified,
        lastScanned: scannedDirectory.lastScanned,
        name: scannedDirectory.name,
        path: scannedDirectory.path
      } as DirectoryEntity)).identifiers[0].id;
    }
  }

  protected async saveChildDirs(connection: Connection, currentDirId: number, scannedDirectory: ParentDirectoryDTO): Promise<void> {
    const directoryRepository = connection.getRepository(DirectoryEntity);

    // update subdirectories that does not have a parent
    await directoryRepository
      .createQueryBuilder()
      .update(DirectoryEntity)
      .set({parent: currentDirId as any})
      .where('path = :path',
        {path: DiskMangerWorker.pathFromParent(scannedDirectory)})
      .andWhere('name NOT LIKE :root', {root: DiskMangerWorker.dirName('.')})
      .andWhere('parent IS NULL')
      .execute();

    // save subdirectories
    const childDirectories = await directoryRepository.createQueryBuilder('directory')
      .leftJoinAndSelect('directory.parent', 'parent')
      .where('directory.parent = :dir', {
        dir: currentDirId
      }).getMany();

    for (const directory of scannedDirectory.directories) {
      // Was this child Dir already indexed before?
      const dirIndex = childDirectories.findIndex((d): boolean => d.name === directory.name);

      if (dirIndex !== -1) { // directory found
        childDirectories.splice(dirIndex, 1);
      } else { // dir does not exists yet
        directory.parent = ({id: currentDirId} as any);
        (directory as DirectoryEntity).lastScanned = null; // new child dir, not fully scanned yet
        const d = await directoryRepository.insert(directory as DirectoryEntity);

        await this.saveMedia(connection, d.identifiers[0].id, directory.media);
      }
    }

    // Remove child Dirs that are not anymore in the parent dir
    await directoryRepository.remove(childDirectories, {chunk: Math.max(Math.ceil(childDirectories.length / 500), 1)});

  }

  protected async saveMetaFiles(connection: Connection, currentDirID: number, scannedDirectory: ParentDirectoryDTO): Promise<void> {
    const fileRepository = connection.getRepository(FileEntity);
    // save files
    const indexedMetaFiles = await fileRepository.createQueryBuilder('file')
      .where('file.directory = :dir', {
        dir: currentDirID
      }).getMany();


    const metaFilesToSave = [];
    for (const item of scannedDirectory.metaFile) {
      let metaFile: FileDTO = null;
      for (let j = 0; j < indexedMetaFiles.length; j++) {
        if (indexedMetaFiles[j].name === item.name) {
          metaFile = indexedMetaFiles[j];
          indexedMetaFiles.splice(j, 1);
          break;
        }
      }
      if (metaFile == null) { // not in DB yet
        item.directory = null;
        metaFile = Utils.clone(item);
        item.directory = scannedDirectory;
        metaFile.directory = ({id: currentDirID} as any);
        metaFilesToSave.push(metaFile);
      }
    }
    await fileRepository.save(metaFilesToSave, {chunk: Math.max(Math.ceil(metaFilesToSave.length / 500), 1)});
    await fileRepository.remove(indexedMetaFiles, {chunk: Math.max(Math.ceil(indexedMetaFiles.length / 500), 1)});
  }

  protected async saveMedia(connection: Connection, parentDirId: number, media: MediaDTO[]): Promise<void> {
    const mediaRepository = connection.getRepository(MediaEntity);
    const photoRepository = connection.getRepository(PhotoEntity);
    const videoRepository = connection.getRepository(VideoEntity);
    // save media
    let indexedMedia = (await mediaRepository.createQueryBuilder('media')
      .where('media.directory = :dir', {
        dir: parentDirId
      })
      .getMany());

    const mediaChange: any = {
      saveP: [], // save/update photo
      saveV: [], // save/update video
      insertP: [], // insert photo
      insertV: [] // insert video
    };
    const facesPerPhoto: { faces: FaceRegionEntry[], mediaName: string }[] = [];
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < media.length; i++) {
      let mediaItem: MediaEntity = null;
      for (let j = 0; j < indexedMedia.length; j++) {
        if (indexedMedia[j].name === media[i].name) {
          mediaItem = indexedMedia[j];
          indexedMedia.splice(j, 1);
          break;
        }
      }

      const scannedFaces = (media[i].metadata as PhotoMetadata).faces || [];
      if ((media[i].metadata as PhotoMetadata).faces) { // if it has faces, cache them
        // make the list distinct (some photos may contain the same person multiple times)
        (media[i].metadata as PhotoMetadataEntity).persons = [...new Set((media[i].metadata as PhotoMetadata).faces.map(f => f.name))];
      }
      delete (media[i].metadata as PhotoMetadata).faces; // this is a separated DB, lets save separately

      if (mediaItem == null) { // not in DB yet
        media[i].directory = null;
        mediaItem = (Utils.clone(media[i]) as any);
        mediaItem.directory = ({id: parentDirId} as any);
        (MediaDTOUtils.isPhoto(mediaItem) ? mediaChange.insertP : mediaChange.insertV).push(mediaItem);
      } else { // already in the DB, only needs to be updated
        delete (mediaItem.metadata as PhotoMetadata).faces;
        if (!Utils.equalsFilter(mediaItem.metadata, media[i].metadata)) {
          mediaItem.metadata = (media[i].metadata as any);
          (MediaDTOUtils.isPhoto(mediaItem) ? mediaChange.saveP : mediaChange.saveV).push(mediaItem);

        }
      }

      facesPerPhoto.push({faces: scannedFaces as FaceRegionEntry[], mediaName: mediaItem.name});
    }

    await this.saveChunk(photoRepository, mediaChange.saveP, 100);
    await this.saveChunk(videoRepository, mediaChange.saveV, 100);
    await this.saveChunk(photoRepository, mediaChange.insertP, 100);
    await this.saveChunk(videoRepository, mediaChange.insertV, 100);

    indexedMedia = (await mediaRepository.createQueryBuilder('media')
      .where('media.directory = :dir', {
        dir: parentDirId
      })
      .select(['media.name', 'media.id'])
      .getMany());

    const faces: FaceRegionEntry[] = [];
    facesPerPhoto.forEach((group): void => {
      const mIndex = indexedMedia.findIndex((m): boolean => m.name === group.mediaName);
      group.faces.forEach((sf: FaceRegionEntry): any => sf.media = ({id: indexedMedia[mIndex].id} as any));

      faces.push(...group.faces);
      indexedMedia.splice(mIndex, 1);
    });

    await this.saveFaces(connection, parentDirId, faces);
    await mediaRepository.remove(indexedMedia);
  }

  protected async saveFaces(connection: Connection, parentDirId: number, scannedFaces: FaceRegion[]): Promise<void> {
    const faceRepository = connection.getRepository(FaceRegionEntry);
    const personRepository = connection.getRepository(PersonEntry);

    const persons: { name: string, faceRegion: FaceRegion }[] = [];

    for (const face of scannedFaces) {
      if (persons.findIndex(f => f.name === face.name) === -1) {
        persons.push({name: face.name, faceRegion: face});
      }
    }
    await ObjectManagers.getInstance().PersonManager.saveAll(persons);
    // get saved persons without triggering denormalized data update (i.e.: do not use PersonManager.get).
    const savedPersons = await personRepository.find();

    const indexedFaces = await faceRepository.createQueryBuilder('face')
      .leftJoin('face.media', 'media')
      .where('media.directory = :directory', {
        directory: parentDirId
      })
      .leftJoinAndSelect('face.person', 'person')
      .getMany();


    const faceToInsert = [];
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < scannedFaces.length; i++) {

      // was the face region already indexed
      let face: FaceRegionEntry = null;
      for (let j = 0; j < indexedFaces.length; j++) {
        if (indexedFaces[j].box.height === scannedFaces[i].box.height &&
          indexedFaces[j].box.width === scannedFaces[i].box.width &&
          indexedFaces[j].box.left === scannedFaces[i].box.left &&
          indexedFaces[j].box.top === scannedFaces[i].box.top &&
          indexedFaces[j].person.name === scannedFaces[i].name) {
          face = indexedFaces[j];
          indexedFaces.splice(j, 1);
          break; // region found, stop processing
        }
      }

      if (face == null) {
        (scannedFaces[i] as FaceRegionEntry).person = savedPersons.find(p => p.name === scannedFaces[i].name);
        faceToInsert.push(scannedFaces[i]);
      }
    }
    if (faceToInsert.length > 0) {
      await this.insertChunk(faceRepository, faceToInsert, 100);
    }
    await faceRepository.remove(indexedFaces, {chunk: Math.max(Math.ceil(indexedFaces.length / 500), 1)});

  }

  private async saveChunk<T>(repository: Repository<any>, entities: T[], size: number): Promise<T[]> {
    if (entities.length === 0) {
      return [];
    }
    if (entities.length < size) {
      return await repository.save(entities);
    }
    let list: T[] = [];
    for (let i = 0; i < entities.length / size; i++) {
      list = list.concat(await repository.save(entities.slice(i * size, (i + 1) * size)));
    }
    return list;
  }

  private async insertChunk<T>(repository: Repository<any>, entities: T[], size: number): Promise<number[]> {
    if (entities.length === 0) {
      return [];
    }
    if (entities.length < size) {
      return (await repository.insert(entities)).identifiers.map((i: any) => i.id);
    }
    let list: number[] = [];
    for (let i = 0; i < entities.length / size; i++) {
      list = list.concat((await repository.insert(entities.slice(i * size, (i + 1) * size))).identifiers.map(ids => ids.id));
    }
    return list;
  }
}
