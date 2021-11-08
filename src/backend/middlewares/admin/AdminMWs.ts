import {NextFunction, Request, Response} from 'express';
import {ErrorCodes, ErrorDTO} from '../../../common/entities/Error';
import {ObjectManagers} from '../../model/ObjectManagers';
import {Config} from '../../../common/config/private/Config';
import {ISQLGalleryManager} from '../../model/database/sql/IGalleryManager';
import {DatabaseType, ServerConfig} from '../../../common/config/private/PrivateConfig';
import {ISQLPersonManager} from '../../model/database/sql/IPersonManager';
import {StatisticDTO} from '../../../common/entities/settings/StatisticDTO';


export class AdminMWs {

  public static async loadStatistic(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (Config.Server.Database.type === DatabaseType.memory) {
      return next(new ErrorDTO(ErrorCodes.GENERAL_ERROR, 'Statistic is only available for indexed content'));
    }


    const galleryManager = ObjectManagers.getInstance().GalleryManager as ISQLGalleryManager;
    const personManager = ObjectManagers.getInstance().PersonManager as ISQLPersonManager;
    try {
      req.resultPipe = {
        directories: await galleryManager.countDirectories(),
        photos: await galleryManager.countPhotos(),
        videos: await galleryManager.countVideos(),
        diskUsage: await galleryManager.countMediaSize(),
        persons: await personManager.countFaces(),
      } as StatisticDTO;
      return next();
    } catch (err) {
      if (err instanceof Error) {
        return next(new ErrorDTO(ErrorCodes.GENERAL_ERROR, 'Error while getting statistic: ' + err.toString(), err));
      }
      return next(new ErrorDTO(ErrorCodes.GENERAL_ERROR, 'Error while getting statistic', err));
    }
  }

  public static async getDuplicates(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (Config.Server.Database.type === DatabaseType.memory) {
      return next(new ErrorDTO(ErrorCodes.GENERAL_ERROR, 'Statistic is only available for indexed content'));
    }


    const galleryManager = ObjectManagers.getInstance().GalleryManager as ISQLGalleryManager;
    try {
      req.resultPipe = await galleryManager.getPossibleDuplicates();
      return next();
    } catch (err) {
      if (err instanceof Error) {
        return next(new ErrorDTO(ErrorCodes.GENERAL_ERROR, 'Error while getting duplicates: ' + err.toString(), err));
      }
      return next(new ErrorDTO(ErrorCodes.GENERAL_ERROR, 'Error while getting duplicates', err));
    }
  }


  public static async startJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      const JobConfig: any = req.body.config;
      const soloRun: boolean = req.body.soloRun;
      const allowParallelRun: boolean = req.body.allowParallelRun;
      await ObjectManagers.getInstance().JobManager.run(id, JobConfig, soloRun, allowParallelRun);
      req.resultPipe = 'ok';
      return next();
    } catch (err) {
      if (err instanceof Error) {
        return next(new ErrorDTO(ErrorCodes.JOB_ERROR, 'Job error: ' + err.toString(), err));
      }
      return next(new ErrorDTO(ErrorCodes.JOB_ERROR, 'Job error: ' + JSON.stringify(err, null, '  '), err));
    }
  }

  public static stopJob(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = req.params.id;
      ObjectManagers.getInstance().JobManager.stop(id);
      req.resultPipe = 'ok';
      return next();
    } catch (err) {
      if (err instanceof Error) {
        return next(new ErrorDTO(ErrorCodes.JOB_ERROR, 'Job error: ' + err.toString(), err));
      }
      return next(new ErrorDTO(ErrorCodes.JOB_ERROR, 'Job error: ' + JSON.stringify(err, null, '  '), err));
    }
  }

  public static getAvailableJobs(req: Request, res: Response, next: NextFunction): void {
    try {
      req.resultPipe = ObjectManagers.getInstance().JobManager.getAvailableJobs();
      return next();
    } catch (err) {
      if (err instanceof Error) {
        return next(new ErrorDTO(ErrorCodes.JOB_ERROR, 'Job error: ' + err.toString(), err));
      }
      return next(new ErrorDTO(ErrorCodes.JOB_ERROR, 'Job error: ' + JSON.stringify(err, null, '  '), err));
    }
  }

  public static getJobProgresses(req: Request, res: Response, next: NextFunction): void {
    try {
      req.resultPipe = ObjectManagers.getInstance().JobManager.getProgresses();
      return next();
    } catch (err) {
      if (err instanceof Error) {
        return next(new ErrorDTO(ErrorCodes.JOB_ERROR, 'Job error: ' + err.toString(), err));
      }
      return next(new ErrorDTO(ErrorCodes.JOB_ERROR, 'Job error: ' + JSON.stringify(err, null, '  '), err));
    }
  }
}
