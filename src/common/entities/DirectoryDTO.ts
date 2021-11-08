import {MediaDTO, MediaDTOUtils} from './MediaDTO';
import {FileDTO} from './FileDTO';
import {PhotoDTO, PreviewPhotoDTO} from './PhotoDTO';
import {Utils} from '../Utils';

export interface DirectoryPathDTO {
  name: string;
  path: string;
}
//
// export interface DirectoryDTO<S extends FileDTO = MediaDTO> extends DirectoryPathDTO {
//   id: number;
//   name: string;
//   path: string;
//   lastModified: number;
//   lastScanned: number;
//   isPartial?: boolean;
//   parent: DirectoryDTO<S>;
//   mediaCount: number;
//   directories: DirectoryDTO<S>[];
//   preview: PreviewPhotoDTO;
//   media: S[];
//   metaFile: FileDTO[];
// }


export interface DirectoryBaseDTO<S extends FileDTO = MediaDTO> extends DirectoryPathDTO {
  id: number;
  name: string;
  path: string;
  lastModified: number;
  lastScanned: number;
  isPartial?: boolean;
  parent: DirectoryBaseDTO<S>;
  mediaCount: number;

  directories?: DirectoryBaseDTO<S>[];
  media?: S[];
  metaFile?: FileDTO[];
  preview?: PreviewPhotoDTO;
}

export interface ParentDirectoryDTO<S extends FileDTO = MediaDTO> extends DirectoryBaseDTO<S> {
  id: number;
  name: string;
  path: string;
  lastModified: number;
  lastScanned: number;
  isPartial?: boolean;
  parent: ParentDirectoryDTO<S>;
  mediaCount: number;
  directories: SubDirectoryDTO<S>[];
  media: S[];
  metaFile: FileDTO[];
}

export interface SubDirectoryDTO<S extends FileDTO = MediaDTO> extends DirectoryBaseDTO<S> {
  id: number;
  name: string;
  path: string;
  lastModified: number;
  lastScanned: number;
  isPartial?: boolean;
  parent: ParentDirectoryDTO<S>;
  mediaCount: number;
  preview: PreviewPhotoDTO;
}

export const DirectoryDTOUtils = {
  unpackDirectory: (dir: DirectoryBaseDTO): void => {
    dir.media.forEach((media: MediaDTO) => {
      media.directory = dir;
    });

    if (dir.metaFile) {
      dir.metaFile.forEach((file: FileDTO) => {
        file.directory = dir;
      });
    }

    if (dir.directories) {
      dir.directories.forEach((directory) => {
        DirectoryDTOUtils.unpackDirectory(directory);
        directory.parent = dir;
      });
    }
  },

  packDirectory: (dir: DirectoryBaseDTO): DirectoryBaseDTO => {
    if (dir.preview) {
      dir.preview.directory = {
        path: dir.preview.directory.path,
        name: dir.preview.directory.name,
      } as DirectoryPathDTO;

      // make sure that it is not a same object as one of the photo in the media[]
      // as the next foreach would remove the directory
      dir.preview = Utils.clone(dir.preview);
    }

    if (dir.media) {
      dir.media.forEach((media: MediaDTO) => {
        media.directory = null;
      });
    }

    if (dir.metaFile) {
      dir.metaFile.forEach((file: FileDTO) => {
        file.directory = null;
      });
    }
    if (dir.directories) {
      dir.directories.forEach((directory) => {
        DirectoryDTOUtils.packDirectory(directory);
        directory.parent = null;
      });
    }

    return dir;

  },
  filterPhotos: (dir: DirectoryBaseDTO): PhotoDTO[] => {
    return dir.media.filter(m => MediaDTOUtils.isPhoto(m)) as PhotoDTO[];
  },
  filterVideos: (dir: DirectoryBaseDTO): PhotoDTO[] => {
    return dir.media.filter(m => MediaDTOUtils.isPhoto(m)) as PhotoDTO[];
  }
};
