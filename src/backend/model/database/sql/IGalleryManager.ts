import {ParentDirectoryDTO} from '../../../../common/entities/DirectoryDTO';
import {IGalleryManager} from '../interfaces/IGalleryManager';
import {DuplicatesDTO} from '../../../../common/entities/DuplicatesDTO';
import {Connection} from 'typeorm';
import {DirectoryEntity} from './enitites/DirectoryEntity';
import {FileDTO} from '../../../../common/entities/FileDTO';

export interface ISQLGalleryManager extends IGalleryManager {
  listDirectory(relativeDirectoryName: string,
                knownLastModified?: number,
                knownLastScanned?: number): Promise<ParentDirectoryDTO>;

  countDirectories(): Promise<number>;

  countPhotos(): Promise<number>;

  countVideos(): Promise<number>;

  countMediaSize(): Promise<number>;

  getPossibleDuplicates(): Promise<DuplicatesDTO[]>;

  selectDirStructure(directory: string): Promise<ParentDirectoryDTO<FileDTO>>;

  fillPreviewForSubDir(connection: Connection, dir: DirectoryEntity): Promise<void>;
}
