import * as path from 'path';
import {promises as fsp} from 'fs';
import {NextFunction, Request, Response} from 'express';
import {ErrorCodes, ErrorDTO} from '../../common/entities/Error';
import {DirectoryDTO} from '../../common/entities/DirectoryDTO';
import {ObjectManagers} from '../model/ObjectManagers';
import {SearchTypes} from '../../common/entities/AutoCompleteItem';
import {ContentWrapper} from '../../common/entities/ConentWrapper';
import {PhotoDTO} from '../../common/entities/PhotoDTO';
import {ProjectPath} from '../ProjectPath';
import {Config} from '../../common/config/private/Config';
import {UserDTO} from '../../common/entities/UserDTO';
import {RandomQuery} from '../model/database/interfaces/IGalleryManager';
import {MediaDTO} from '../../common/entities/MediaDTO';
import {VideoDTO} from '../../common/entities/VideoDTO';
import {Utils} from '../../common/Utils';
import {QueryParams} from '../../common/QueryParams';
import {VideoProcessing} from '../model/fileprocessing/VideoProcessing';
import {DiskMangerWorker} from '../model/threading/DiskMangerWorker';


export class GalleryMWs {


  public static async listDirectory(req: Request, res: Response, next: NextFunction) {
    const directoryName = req.params.directory || '/';
    const absoluteDirectoryName = path.join(ProjectPath.ImageFolder, directoryName);
    try {
      if ((await fsp.stat(absoluteDirectoryName)).isDirectory() === false) {
        return next();
      }
    } catch (e) {
      return next();
    }

    try {
      const directory = await ObjectManagers.getInstance()
        .GalleryManager.listDirectory(directoryName,
          parseInt(req.query[QueryParams.gallery.knownLastModified], 10),
          parseInt(req.query[QueryParams.gallery.knownLastScanned], 10));

      if (directory == null) {
        req.resultPipe = new ContentWrapper(null, null, true);
        return next();
      }
      if (req.session.user.permissions &&
        req.session.user.permissions.length > 0 &&
        req.session.user.permissions[0] !== '/*') {
        (<DirectoryDTO>directory).directories = (<DirectoryDTO>directory).directories.filter(d =>
          UserDTO.isDirectoryAvailable(d, req.session.user.permissions));
      }
      req.resultPipe = new ContentWrapper(directory, null);
      return next();

    } catch (err) {
      return next(new ErrorDTO(ErrorCodes.GENERAL_ERROR, 'Error during listing the directory', err));
    }
  }


  public static cleanUpGalleryResults(req: Request, res: Response, next: NextFunction) {
    if (!req.resultPipe) {
      return next();
    }

    const cw: ContentWrapper = req.resultPipe;
    if (cw.notModified === true) {
      return next();
    }

    const cleanUpMedia = (media: MediaDTO[]) => {
      media.forEach(m => {
        if (MediaDTO.isPhoto(m)) {
          delete (<VideoDTO>m).metadata.bitRate;
          delete (<VideoDTO>m).metadata.duration;
        } else if (MediaDTO.isVideo(m)) {
          delete (<PhotoDTO>m).metadata.caption;
          delete (<PhotoDTO>m).metadata.cameraData;
          delete (<PhotoDTO>m).metadata.orientation;
          delete (<PhotoDTO>m).metadata.orientation;
          delete (<PhotoDTO>m).metadata.keywords;
          delete (<PhotoDTO>m).metadata.positionData;
        }
        Utils.removeNullOrEmptyObj(m);
      });
    };

    if (cw.directory) {
      DirectoryDTO.removeReferences(cw.directory);
      // TODO: remove when typeorm inheritance is fixed
      cleanUpMedia(cw.directory.media);
    }
    if (cw.searchResult) {
      cleanUpMedia(cw.searchResult.media);
    }


    if (Config.Client.Media.Video.enabled === false) {
      if (cw.directory) {
        const removeVideos = (dir: DirectoryDTO) => {
          dir.media = dir.media.filter(m => !MediaDTO.isVideo(m));
          if (dir.directories) {
            dir.directories.forEach(d => removeVideos(d));
          }
        };
        removeVideos(cw.directory);
      }
      if (cw.searchResult) {
        cw.searchResult.media = cw.searchResult.media.filter(m => !MediaDTO.isVideo(m));
      }
    }

    return next();
  }


  public static async getRandomImage(req: Request, res: Response, next: NextFunction) {
    if (Config.Client.RandomPhoto.enabled === false) {
      return next();
    }
    try {
      const query: RandomQuery = {};
      if (req.query.directory) {
        query.directory = DiskMangerWorker.normalizeDirPath(req.query.directory);
      }
      if (req.query.recursive === 'true') {
        query.recursive = true;
      }
      if (req.query.orientation) {
        query.orientation = parseInt(req.query.orientation.toString(), 10);
      }
      if (req.query.maxResolution) {
        query.maxResolution = parseFloat(req.query.maxResolution.toString());
      }
      if (req.query.minResolution) {
        query.minResolution = parseFloat(req.query.minResolution.toString());
      }
      if (req.query.fromDate) {
        query.fromDate = new Date(req.query.fromDate);
      }
      if (req.query.toDate) {
        query.toDate = new Date(req.query.toDate);
      }
      if (query.minResolution && query.maxResolution && query.maxResolution < query.minResolution) {
        return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'Input error: min resolution is greater than the max resolution'));
      }
      if (query.toDate && query.fromDate && query.toDate.getTime() < query.fromDate.getTime()) {
        return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'Input error: to date is earlier than from date'));
      }

      const photo = await ObjectManagers.getInstance()
        .GalleryManager.getRandomPhoto(query);
      if (!photo) {
        return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'No photo found'));
      }

      req.params.mediaPath = path.join(photo.directory.path, photo.directory.name, photo.name);
      return next();
    } catch (e) {
      return next(new ErrorDTO(ErrorCodes.GENERAL_ERROR, 'Can\'t get random photo: ' + e.toString()));
    }
  }

  public static async loadFile(req: Request, res: Response, next: NextFunction) {
    if (!(req.params.mediaPath)) {
      return next();
    }
    const fullMediaPath = path.join(ProjectPath.ImageFolder, req.params.mediaPath);

    // check if file exist
    try {
      if ((await fsp.stat(fullMediaPath)).isDirectory()) {
        return next();
      }
    } catch (e) {
      return next(new ErrorDTO(ErrorCodes.GENERAL_ERROR, 'no such file:' + req.params.mediaPath, 'can\'t find file: ' + fullMediaPath));
    }


    req.resultPipe = fullMediaPath;
    return next();
  }

  public static async loadBestFitVideo(req: Request, res: Response, next: NextFunction) {
    if (!(req.resultPipe)) {
      return next();
    }
    const fullMediaPath: string = req.resultPipe;

    const convertedVideo = VideoProcessing.generateConvertedFilePath(fullMediaPath);

    // check if transcoded video exist
    try {
      await fsp.access(convertedVideo);
      req.resultPipe = convertedVideo;
    } catch (e) {
    }


    return next();
  }


  public static async search(req: Request, res: Response, next: NextFunction) {
    if (Config.Client.Search.enabled === false) {
      return next();
    }

    if (!(req.params.text)) {
      return next();
    }

    let type: SearchTypes;
    if (req.query[QueryParams.gallery.search.type]) {
      type = parseInt(req.query[QueryParams.gallery.search.type], 10);
    }
    try {
      const result = await ObjectManagers.getInstance().SearchManager.search(req.params.text, type);

      result.directories.forEach(dir => dir.media = dir.media || []);
      req.resultPipe = new ContentWrapper(null, result);
      return next();
    } catch (err) {
      return next(new ErrorDTO(ErrorCodes.GENERAL_ERROR, 'Error during searching', err));
    }
  }

  public static async instantSearch(req: Request, res: Response, next: NextFunction) {
    if (Config.Client.Search.instantSearchEnabled === false) {
      return next();
    }

    if (!(req.params.text)) {
      return next();
    }

    try {
      const result = await ObjectManagers.getInstance().SearchManager.instantSearch(req.params.text);

      result.directories.forEach(dir => dir.media = dir.media || []);
      req.resultPipe = new ContentWrapper(null, result);
      return next();
    } catch (err) {
      return next(new ErrorDTO(ErrorCodes.GENERAL_ERROR, 'Error during searching', err));
    }
  }

  public static async autocomplete(req: Request, res: Response, next: NextFunction) {
    if (Config.Client.Search.AutoComplete.enabled === false) {
      return next();
    }
    if (!(req.params.text)) {
      return next();
    }

    try {
      req.resultPipe = await ObjectManagers.getInstance().SearchManager.autocomplete(req.params.text);
      return next();
    } catch (err) {
      return next(new ErrorDTO(ErrorCodes.GENERAL_ERROR, 'Error during searching', err));
    }

  }


}
