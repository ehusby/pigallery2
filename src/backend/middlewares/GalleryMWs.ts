import * as path from 'path';
import {promises as fsp} from 'fs';
import * as archiver from 'archiver';
import {NextFunction, Request, Response} from 'express';
import {ErrorCodes, ErrorDTO} from '../../common/entities/Error';
import {DirectoryDTOUtils, ParentDirectoryDTO} from '../../common/entities/DirectoryDTO';
import {ObjectManagers} from '../model/ObjectManagers';
import {ContentWrapper} from '../../common/entities/ConentWrapper';
import {PhotoDTO} from '../../common/entities/PhotoDTO';
import {ProjectPath} from '../ProjectPath';
import {Config} from '../../common/config/private/Config';
import {UserDTOUtils} from '../../common/entities/UserDTO';
import {MediaDTO, MediaDTOUtils} from '../../common/entities/MediaDTO';
import {VideoDTO} from '../../common/entities/VideoDTO';
import {Utils} from '../../common/Utils';
import {QueryParams} from '../../common/QueryParams';
import {VideoProcessing} from '../model/fileprocessing/VideoProcessing';
import {SearchQueryDTO, SearchQueryTypes} from '../../common/entities/SearchQueryDTO';
import {LocationLookupException} from '../exceptions/LocationLookupException';
import {SupportedFormats} from '../../common/SupportedFormats';

export class GalleryMWs {


  public static async listDirectory(req: Request, res: Response, next: NextFunction): Promise<any> {
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
          parseInt(req.query[QueryParams.gallery.knownLastModified] as string, 10),
          parseInt(req.query[QueryParams.gallery.knownLastScanned] as string, 10));

      if (directory == null) {
        req.resultPipe = new ContentWrapper(null, null, true);
        return next();
      }
      if (req.session.user.permissions &&
        req.session.user.permissions.length > 0 &&
        req.session.user.permissions[0] !== '/*') {
        directory.directories = directory.directories.filter((d): boolean =>
          UserDTOUtils.isDirectoryAvailable(d, req.session.user.permissions));
      }
      req.resultPipe = new ContentWrapper(directory, null);
      return next();

    } catch (err) {
      return next(new ErrorDTO(ErrorCodes.GENERAL_ERROR, 'Error during listing the directory', err));
    }
  }

  public static async zipDirectory(req: Request, res: Response, next: NextFunction): Promise<any> {
    if (Config.Client.Other.enableDownloadZip === false) {
      return next();
    }
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
      res.set('Content-Type', 'application/zip');
      res.set('Content-Disposition', 'attachment; filename=Gallery.zip');

      const archive = archiver('zip', {
        store: true, // disable compression
      });

      res.on('close', () => {
        console.log('zip ' + archive.pointer() + ' bytes');
      });

      archive.on('error', (err: any) => {
        throw err;
      });

      archive.pipe(res);

      // append photos in absoluteDirectoryName
      // using case-insensitive glob of extensions
      for (const ext of SupportedFormats.WithDots.Photos) {
        archive.glob(`*${ext}`, {cwd: absoluteDirectoryName, nocase: true});
      }
      // append videos in absoluteDirectoryName
      // using case-insensitive glob of extensions
      for (const ext of SupportedFormats.WithDots.Videos) {
        archive.glob(`*${ext}`, {cwd: absoluteDirectoryName, nocase: true});
      }

      await archive.finalize();
      return next();

    } catch (err) {
      return next(new ErrorDTO(ErrorCodes.GENERAL_ERROR, 'Error creating zip', err));
    }
  }

  public static cleanUpGalleryResults(req: Request, res: Response, next: NextFunction): any {
    if (!req.resultPipe) {
      return next();
    }

    const cw: ContentWrapper = req.resultPipe;
    if (cw.notModified === true) {
      return next();
    }

    const cleanUpMedia = (media: MediaDTO[]): void => {
      media.forEach((m): void => {
        if (MediaDTOUtils.isPhoto(m)) {
          delete (m as VideoDTO).metadata.bitRate;
          delete (m as VideoDTO).metadata.duration;
        } else if (MediaDTOUtils.isVideo(m)) {
          delete (m as PhotoDTO).metadata.rating;
          delete (m as PhotoDTO).metadata.caption;
          delete (m as PhotoDTO).metadata.cameraData;
          delete (m as PhotoDTO).metadata.orientation;
          delete (m as PhotoDTO).metadata.orientation;
          delete (m as PhotoDTO).metadata.keywords;
          delete (m as PhotoDTO).metadata.positionData;
        }
        Utils.removeNullOrEmptyObj(m);
      });
    };

    if (cw.directory) {
      DirectoryDTOUtils.packDirectory(cw.directory);
      // TODO: remove when typeorm inheritance is fixed (and handles proper inheritance)
      cleanUpMedia(cw.directory.media);
    }
    if (cw.searchResult) {
      cw.searchResult.directories.forEach(d => DirectoryDTOUtils.packDirectory(d));
      cleanUpMedia(cw.searchResult.media);
    }


    if (Config.Client.Media.Video.enabled === false) {
      if (cw.directory) {
        const removeVideos = (dir: ParentDirectoryDTO): void => {
          dir.media = dir.media.filter((m): boolean => !MediaDTOUtils.isVideo(m));
        };
        removeVideos(cw.directory);
      }
      if (cw.searchResult) {
        cw.searchResult.media = cw.searchResult.media.filter((m): boolean => !MediaDTOUtils.isVideo(m));
      }
    }

    return next();
  }


  public static async loadFile(req: Request, res: Response, next: NextFunction): Promise<any> {
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

  public static async loadBestFitVideo(req: Request, res: Response, next: NextFunction): Promise<any> {
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


  public static async search(req: Request, res: Response, next: NextFunction): Promise<any> {
    if (Config.Client.Search.enabled === false || !(req.params.searchQueryDTO)) {
      return next();
    }

    const query: SearchQueryDTO = JSON.parse(req.params.searchQueryDTO as any);

    try {
      const result = await ObjectManagers.getInstance().SearchManager.search(query);

      result.directories.forEach((dir): MediaDTO[] => dir.media = dir.media || []);
      req.resultPipe = new ContentWrapper(null, result);
      return next();
    } catch (err) {
      if (err instanceof LocationLookupException) {
        return next(new ErrorDTO(ErrorCodes.LocationLookUp_ERROR, 'Cannot find location: ' + err.location, err));
      }
      return next(new ErrorDTO(ErrorCodes.GENERAL_ERROR, 'Error during searching', err));
    }
  }


  public static async autocomplete(req: Request, res: Response, next: NextFunction): Promise<any> {
    if (Config.Client.Search.AutoComplete.enabled === false) {
      return next();
    }
    if (!(req.params.text)) {
      return next();
    }

    let type: SearchQueryTypes = SearchQueryTypes.any_text;
    if (req.query[QueryParams.gallery.search.type]) {
      type = parseInt(req.query[QueryParams.gallery.search.type] as string, 10);
    }
    try {
      req.resultPipe = await ObjectManagers.getInstance().SearchManager.autocomplete(req.params.text, type);
      return next();
    } catch (err) {
      return next(new ErrorDTO(ErrorCodes.GENERAL_ERROR, 'Error during searching', err));
    }

  }


  public static async getRandomImage(req: Request, res: Response, next: NextFunction): Promise<any> {
    if (Config.Client.RandomPhoto.enabled === false || !(req.params.searchQueryDTO)) {
      return next();
    }

    try {
      const query: SearchQueryDTO = JSON.parse(req.params.searchQueryDTO as any);

      const photo = await ObjectManagers.getInstance()
        .SearchManager.getRandomPhoto(query);
      if (!photo) {
        return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'No photo found'));
      }

      req.params.mediaPath = path.join(photo.directory.path, photo.directory.name, photo.name);
      return next();
    } catch (e) {
      return next(new ErrorDTO(ErrorCodes.GENERAL_ERROR, 'Can\'t get random photo: ' + e.toString()));
    }
  }


}
