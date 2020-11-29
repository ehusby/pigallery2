import {NextFunction, Request, Response} from 'express';
import * as fs from 'fs';
import {PhotoProcessing} from '../../model/fileprocessing/PhotoProcessing';
import {Config} from '../../../common/config/private/Config';

export class PhotoConverterMWs {

  public static async convertPhoto(req: Request, res: Response, next: NextFunction) {
    if (!req.resultPipe) {
      return next();
    }
    // if conversion is not enabled redirect, so browser can cache the full
    if (Config.Client.Media.Photo.Converting.enabled === false) {
      return res.redirect(req.originalUrl.slice(0, -1 * '\\bestFit'.length));
    }
    const fullMediaPath = req.resultPipe;

    const convertedVideo = PhotoProcessing.generateConvertedPath(fullMediaPath, Config.Server.Media.Photo.Converting.resolution);

    // check if converted photo exist
    if (fs.existsSync(convertedVideo) === true) {
      req.resultPipe = convertedVideo;
      return next();
    }

    if (Config.Server.Media.Photo.Converting.onTheFly === true) {
      req.resultPipe = await PhotoProcessing.convertPhoto(fullMediaPath);
      return next();
    }

    // not converted and won't be now
    return res.redirect(req.originalUrl.slice(0, -1 * '\\bestFit'.length));
  }
}

