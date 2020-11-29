/**/
import {NextFunction, Request, Response} from 'express';
import {ErrorCodes, ErrorDTO} from '../../../common/entities/Error';
import {ObjectManagers} from '../../model/ObjectManagers';
import {Logger} from '../../Logger';
import {Config} from '../../../common/config/private/Config';
import {ConfigDiagnostics} from '../../model/diagnostics/ConfigDiagnostics';
import {BasicConfigDTO} from '../../../common/entities/settings/BasicConfigDTO';
import {OtherConfigDTO} from '../../../common/entities/settings/OtherConfigDTO';
import {ProjectPath} from '../../ProjectPath';
import {ServerConfig} from '../../../common/config/private/PrivateConfig';
import {ClientConfig} from '../../../common/config/public/ClientConfig';

const LOG_TAG = '[SettingsMWs]';


export class SettingsMWs {

  public static async updateDatabaseSettings(req: Request, res: Response, next: NextFunction) {

    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    const databaseSettings = <ServerConfig.DataBaseConfig>req.body.settings;

    try {
      if (databaseSettings.type !== ServerConfig.DatabaseType.memory) {
        await ConfigDiagnostics.testDatabase(databaseSettings);
      }
      Config.Server.Database = databaseSettings;
      // only updating explicitly set config (not saving config set by the diagnostics)
      const original = await Config.original();
      original.Server.Database = databaseSettings;
      if (databaseSettings.type === ServerConfig.DatabaseType.memory) {
        original.Client.Sharing.enabled = false;
        original.Client.Search.enabled = false;
      }
      original.save();
      await ConfigDiagnostics.runDiagnostics();
      Logger.info(LOG_TAG, 'new config:');
      Logger.info(LOG_TAG, JSON.stringify(Config, null, '\t'));

      await ObjectManagers.reset();
      if (Config.Server.Database.type !== ServerConfig.DatabaseType.memory) {
        await ObjectManagers.InitSQLManagers();
      } else {
        await ObjectManagers.InitMemoryManagers();
      }

      return next();
    } catch (err) {
      if (err instanceof Error) {
        return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Error while saving database settings: ' + err.toString(), err));
      }
      return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Error while saving database settings', err));
    }
  }

  public static async updateMapSettings(req: Request, res: Response, next: NextFunction) {
    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    try {
      await ConfigDiagnostics.testMapConfig(<ClientConfig.MapConfig>req.body.settings);

      Config.Client.Map = <ClientConfig.MapConfig>req.body.settings;
      // only updating explicitly set config (not saving config set by the diagnostics)
      const original = await Config.original();
      original.Client.Map = <ClientConfig.MapConfig>req.body.settings;
      original.save();
      await ConfigDiagnostics.runDiagnostics();
      Logger.info(LOG_TAG, 'new config:');
      Logger.info(LOG_TAG, JSON.stringify(Config, null, '\t'));
      return next();
    } catch (err) {
      if (err instanceof Error) {
        return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Settings error: ' + err.toString(), err));
      }
      return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Settings error: ' + JSON.stringify(err, null, '  '), err));
    }
  }

  public static async updateVideoSettings(req: Request, res: Response, next: NextFunction) {
    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    try {
      const settings: {
        server: ServerConfig.VideoConfig,
        client: ClientConfig.VideoConfig
      } = req.body.settings;


      const original = await Config.original();
      await ConfigDiagnostics.testClientVideoConfig(settings.client);
      await ConfigDiagnostics.testServerVideoConfig(settings.server, original);
      Config.Server.Media.Video = settings.server;
      Config.Client.Media.Video = settings.client;
      // only updating explicitly set config (not saving config set by the diagnostics)
      original.Server.Media.Video = settings.server;
      original.Client.Media.Video = settings.client;
      original.save();
      await ConfigDiagnostics.runDiagnostics();
      Logger.info(LOG_TAG, 'new config:');
      Logger.info(LOG_TAG, JSON.stringify(Config, null, '\t'));
      return next();
    } catch (err) {
      if (err instanceof Error) {
        return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Settings error: ' + err.toString(), err));
      }
      return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Settings error: ' + JSON.stringify(err, null, '  '), err));
    }
  }

  public static async updateMetaFileSettings(req: Request, res: Response, next: NextFunction) {
    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    try {
      const original = await Config.original();
      await ConfigDiagnostics.testMetaFileConfig(<ClientConfig.MetaFileConfig>req.body.settings, original);

      Config.Client.MetaFile = <ClientConfig.MetaFileConfig>req.body.settings;
      // only updating explicitly set config (not saving config set by the diagnostics)

      original.Client.MetaFile = <ClientConfig.MetaFileConfig>req.body.settings;
      original.save();
      await ConfigDiagnostics.runDiagnostics();
      Logger.info(LOG_TAG, 'new config:');
      Logger.info(LOG_TAG, JSON.stringify(Config, null, '\t'));
      return next();
    } catch (err) {
      if (err instanceof Error) {
        return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Settings error: ' + err.toString(), err));
      }
      return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Settings error: ' + JSON.stringify(err, null, '  '), err));
    }
  }

  public static async updateShareSettings(req: Request, res: Response, next: NextFunction) {
    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    try {
      // only updating explicitly set config (not saving config set by the diagnostics)
      const original = await Config.original();
      await ConfigDiagnostics.testSharingConfig(<ClientConfig.SharingConfig>req.body.settings, original);

      Config.Client.Sharing = <ClientConfig.SharingConfig>req.body.settings;
      original.Client.Sharing = <ClientConfig.SharingConfig>req.body.settings;
      original.save();
      await ConfigDiagnostics.runDiagnostics();
      Logger.info(LOG_TAG, 'new config:');
      Logger.info(LOG_TAG, JSON.stringify(Config, null, '\t'));
      return next();
    } catch (err) {
      if (err instanceof Error) {
        return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Settings error: ' + err.toString(), err));
      }
      return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Settings error: ' + JSON.stringify(err, null, '  '), err));
    }
  }

  public static async updateRandomPhotoSettings(req: Request, res: Response, next: NextFunction) {
    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    try {
      // only updating explicitly set config (not saving config set by the diagnostics)
      const original = await Config.original();
      await ConfigDiagnostics.testRandomPhotoConfig(<ClientConfig.RandomPhotoConfig>req.body.settings, original);

      Config.Client.RandomPhoto = <ClientConfig.RandomPhotoConfig>req.body.settings;
      original.Client.RandomPhoto = <ClientConfig.RandomPhotoConfig>req.body.settings;
      original.save();
      await ConfigDiagnostics.runDiagnostics();
      Logger.info(LOG_TAG, 'new config:');
      Logger.info(LOG_TAG, JSON.stringify(Config, null, '\t'));
      return next();
    } catch (err) {
      if (err instanceof Error) {
        return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Settings error: ' + err.toString(), err));
      }
      return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Settings error: ' + JSON.stringify(err, null, '  '), err));
    }
  }

  public static async updateSearchSettings(req: Request, res: Response, next: NextFunction) {
    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    try {
      // only updating explicitly set config (not saving config set by the diagnostics)
      const original = await Config.original();
      await ConfigDiagnostics.testSearchConfig(<ClientConfig.SearchConfig>req.body.settings, original);

      Config.Client.Search = <ClientConfig.SearchConfig>req.body.settings;
      original.Client.Search = <ClientConfig.SearchConfig>req.body.settings;
      original.save();
      await ConfigDiagnostics.runDiagnostics();
      Logger.info(LOG_TAG, 'new config:');
      Logger.info(LOG_TAG, JSON.stringify(Config, null, '\t'));
      return next();
    } catch (err) {
      if (err instanceof Error) {
        return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Settings error: ' + err.toString(), err));
      }
      return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Settings error: ' + JSON.stringify(err, null, '  '), err));
    }
  }

  public static async updateFacesSettings(req: Request, res: Response, next: NextFunction) {
    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    try {
      // only updating explicitly set config (not saving config set by the diagnostics)
      const original = await Config.original();
      await ConfigDiagnostics.testFacesConfig(<ClientConfig.FacesConfig>req.body.settings, original);

      Config.Client.Faces = <ClientConfig.FacesConfig>req.body.settings;
      original.Client.Faces = <ClientConfig.FacesConfig>req.body.settings;
      original.save();
      await ConfigDiagnostics.runDiagnostics();
      Logger.info(LOG_TAG, 'new config:');
      Logger.info(LOG_TAG, JSON.stringify(Config, null, '\t'));
      return next();
    } catch (err) {
      if (err instanceof Error) {
        return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Settings error: ' + err.toString(), err));
      }
      return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Settings error: ' + JSON.stringify(err, null, '  '), err));
    }
  }

  public static async updateAuthenticationSettings(req: Request, res: Response, next: NextFunction) {
    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    try {
      Config.Client.authenticationRequired = <boolean>req.body.settings;
      // only updating explicitly set config (not saving config set by the diagnostics)
      const original = await Config.original();
      original.Client.authenticationRequired = <boolean>req.body.settings;
      if (original.Client.authenticationRequired === false) {
        original.Client.Sharing.enabled = false;
      }
      original.save();
      await ConfigDiagnostics.runDiagnostics();
      Logger.info(LOG_TAG, 'new config:');
      Logger.info(LOG_TAG, JSON.stringify(Config, null, '\t'));
      return next();
    } catch (err) {
      if (err instanceof Error) {
        return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Settings error: ' + err.toString(), err));
      }
      return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Settings error: ' + JSON.stringify(err, null, '  '), err));
    }
  }

  public static async updateThumbnailSettings(req: Request, res: Response, next: NextFunction) {
    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    try {
      const settings: {
        server: ServerConfig.ThumbnailConfig,
        client: ClientConfig.ThumbnailConfig
      } = req.body.settings;

      await ConfigDiagnostics.testServerThumbnailConfig(settings.server);
      await ConfigDiagnostics.testClientThumbnailConfig(settings.client);
      Config.Server.Media.Thumbnail = settings.server;
      Config.Client.Media.Thumbnail = settings.client;
      // only updating explicitly set config (not saving config set by the diagnostics)
      const original = await Config.original();
      original.Server.Media.Thumbnail = settings.server;
      original.Client.Media.Thumbnail = settings.client;
      original.save();
      ProjectPath.reset();
      await ConfigDiagnostics.runDiagnostics();
      Logger.info(LOG_TAG, 'new config:');
      Logger.info(LOG_TAG, JSON.stringify(Config, null, '\t'));
      return next();
    } catch (err) {
      if (err instanceof Error) {
        return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Settings error: ' + err.toString(), err));
      }
      return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Settings error: ' + JSON.stringify(err, null, '  '), err));
    }
  }

  public static async updatePhotoSettings(req: Request, res: Response, next: NextFunction) {
    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    try {
      const settings: {
        photoProcessingLibrary: ServerConfig.PhotoProcessingLib,
        server: ServerConfig.PhotoConfig,
        client: ClientConfig.PhotoConfig
      } = req.body.settings;

      await ConfigDiagnostics.testThumbnailLib(settings.photoProcessingLibrary);
      await ConfigDiagnostics.testServerPhotoConfig(settings.server);
      await ConfigDiagnostics.testClientPhotoConfig(settings.client);
      Config.Server.Media.photoProcessingLibrary = settings.photoProcessingLibrary;
      Config.Server.Media.Photo = settings.server;
      Config.Client.Media.Photo = settings.client;
      // only updating explicitly set config (not saving config set by the diagnostics)
      const original = await Config.original();
      original.Server.Media.photoProcessingLibrary = settings.photoProcessingLibrary;
      original.Server.Media.Photo = settings.server;
      original.Client.Media.Photo = settings.client;
      original.save();
      ProjectPath.reset();
      await ConfigDiagnostics.runDiagnostics();
      Logger.info(LOG_TAG, 'new config:');
      Logger.info(LOG_TAG, JSON.stringify(Config, null, '\t'));
      return next();
    } catch (err) {
      if (err instanceof Error) {
        return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Settings error: ' + err.toString(), err));
      }
      return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Settings error: ' + JSON.stringify(err, null, '  '), err));
    }
  }

  public static async updateBasicSettings(req: Request, res: Response, next: NextFunction) {
    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    try {
      const settings: BasicConfigDTO = req.body.settings;
      await ConfigDiagnostics.testImageFolder(settings.imagesFolder);
      Config.Server.port = settings.port;
      Config.Server.host = settings.host;
      Config.Server.Media.folder = settings.imagesFolder;
      Config.Client.publicUrl = settings.publicUrl;
      Config.Client.urlBase = settings.urlBase;
      Config.Client.applicationTitle = settings.applicationTitle;
      // only updating explicitly set config (not saving config set by the diagnostics)
      const original = await Config.original();
      original.Server.port = settings.port;
      original.Server.host = settings.host;
      original.Server.Media.folder = settings.imagesFolder;
      original.Client.publicUrl = settings.publicUrl;
      original.Client.urlBase = settings.urlBase;
      original.Client.applicationTitle = settings.applicationTitle;
      original.save();
      ProjectPath.reset();
      await ConfigDiagnostics.runDiagnostics();
      Logger.info(LOG_TAG, 'new config:');
      Logger.info(LOG_TAG, JSON.stringify(Config, null, '\t'));
      return next();
    } catch (err) {
      if (err instanceof Error) {
        return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Settings error: ' + err.toString(), err));
      }
      return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Settings error: ' + JSON.stringify(err, null, '  '), err));
    }
  }

  public static async updateOtherSettings(req: Request, res: Response, next: NextFunction) {
    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    try {
      const settings: OtherConfigDTO = req.body.settings;
      Config.Client.Other.enableCache = settings.Client.enableCache;
      Config.Client.Other.captionFirstNaming = settings.Client.captionFirstNaming;
      Config.Client.Other.enableOnScrollRendering = settings.Client.enableOnScrollRendering;
      Config.Client.Other.enableOnScrollThumbnailPrioritising = settings.Client.enableOnScrollThumbnailPrioritising;
      Config.Client.Other.defaultPhotoSortingMethod = settings.Client.defaultPhotoSortingMethod;
      Config.Client.Other.NavBar.showItemCount = settings.Client.NavBar.showItemCount;

      // only updating explicitly set config (not saving config set by the diagnostics)
      const original = await Config.original();
      original.Client.Other.enableCache = settings.Client.enableCache;
      original.Client.Other.captionFirstNaming = settings.Client.captionFirstNaming;
      original.Client.Other.enableOnScrollRendering = settings.Client.enableOnScrollRendering;
      original.Client.Other.enableOnScrollThumbnailPrioritising = settings.Client.enableOnScrollThumbnailPrioritising;
      original.Client.Other.defaultPhotoSortingMethod = settings.Client.defaultPhotoSortingMethod;
      original.Client.Other.NavBar.showItemCount = settings.Client.NavBar.showItemCount;
      original.Server.Threading.enabled = settings.Server.enabled;
      original.Server.Threading.thumbnailThreads = settings.Server.thumbnailThreads;
      await original.save();
      await ConfigDiagnostics.runDiagnostics();
      Logger.info(LOG_TAG, 'new config:');
      Logger.info(LOG_TAG, JSON.stringify(Config, null, '\t'));
      return next();
    } catch (err) {
      if (err instanceof Error) {
        return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Settings error: ' + err.toString(), err));
      }
      return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Settings error: ' + JSON.stringify(err, null, '  '), err));
    }
  }

  public static async updateIndexingSettings(req: Request, res: Response, next: NextFunction) {
    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    try {
      const settings: ServerConfig.IndexingConfig = req.body.settings;
      Config.Server.Indexing = settings;

      // only updating explicitly set config (not saving config set by the diagnostics)
      const original = await Config.original();
      original.Server.Indexing = settings;
      original.save();
      await ConfigDiagnostics.runDiagnostics();
      Logger.info(LOG_TAG, 'new config:');
      Logger.info(LOG_TAG, JSON.stringify(Config, null, '\t'));
      return next();
    } catch (err) {
      if (err instanceof Error) {
        return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Settings error: ' + err.toString(), err));
      }
      return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Settings error: ' + JSON.stringify(err, null, '  '), err));
    }
  }

  public static async updateJobSettings(req: Request, res: Response, next: NextFunction) {
    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    try {

      // only updating explicitly set config (not saving config set by the diagnostics)
      const settings: ServerConfig.JobConfig = req.body.settings;
      const original = await Config.original();
      await ConfigDiagnostics.testTasksConfig(settings, original);

      Config.Server.Jobs = settings;
      original.Server.Jobs = settings;
      original.save();

      await ConfigDiagnostics.runDiagnostics();
      ObjectManagers.getInstance().JobManager.runSchedules();
      Logger.info(LOG_TAG, 'new config:');
      Logger.info(LOG_TAG, JSON.stringify(Config, null, '\t'));
      return next();
    } catch (err) {
      if (err instanceof Error) {
        return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Settings error: ' + err.toString(), err));
      }
      return next(new ErrorDTO(ErrorCodes.SETTINGS_ERROR, 'Settings error: ' + JSON.stringify(err, null, '  '), err));
    }
  }

}
