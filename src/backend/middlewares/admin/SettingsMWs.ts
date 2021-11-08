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
import {
  DatabaseType,
  IPrivateConfig,
  ServerDataBaseConfig,
  ServerIndexingConfig,
  ServerJobConfig,
  ServerPhotoConfig,
  ServerThumbnailConfig,
  ServerVideoConfig
} from '../../../common/config/private/PrivateConfig';
import {
  ClientAlbumConfig,
  ClientFacesConfig,
  ClientMapConfig,
  ClientMetaFileConfig,
  ClientPhotoConfig,
  ClientRandomPhotoConfig,
  ClientSearchConfig,
  ClientSharingConfig,
  ClientThumbnailConfig,
  ClientVideoConfig
} from '../../../common/config/public/ClientConfig';

const LOG_TAG = '[SettingsMWs]';


export class SettingsMWs {

  public static async updateDatabaseSettings(req: Request, res: Response, next: NextFunction): Promise<any> {

    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    const databaseSettings = req.body.settings as ServerDataBaseConfig;

    try {
      if (databaseSettings.type !== DatabaseType.memory) {
        await ConfigDiagnostics.testDatabase(databaseSettings);
      }
      Config.Server.Database = databaseSettings;
      // only updating explicitly set config (not saving config set by the diagnostics)
      const original = await Config.original();
      original.Server.Database = databaseSettings;
      if (databaseSettings.type === DatabaseType.memory) {
        original.Client.Sharing.enabled = false;
        original.Client.Search.enabled = false;
      }
      original.save();
      await ConfigDiagnostics.runDiagnostics();
      Logger.info(LOG_TAG, 'new config:');
      Logger.info(LOG_TAG, JSON.stringify(Config, null, '\t'));

      await ObjectManagers.reset();
      if (Config.Server.Database.type !== DatabaseType.memory) {
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

  public static async updateMapSettings(req: Request, res: Response, next: NextFunction): Promise<any> {
    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    try {
      await ConfigDiagnostics.testMapConfig(req.body.settings as ClientMapConfig);

      Config.Client.Map = (req.body.settings as ClientMapConfig);
      // only updating explicitly set config (not saving config set by the diagnostics)
      const original = await Config.original();
      original.Client.Map = (req.body.settings as ClientMapConfig);
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

  public static async updateVideoSettings(req: Request, res: Response, next: NextFunction): Promise<any> {
    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    try {
      const settings: {
        server: ServerVideoConfig,
        client: ClientVideoConfig
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

  public static async updateMetaFileSettings(req: Request, res: Response, next: NextFunction): Promise<any> {
    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    try {
      const original = await Config.original();
      await ConfigDiagnostics.testMetaFileConfig(req.body.settings as ClientMetaFileConfig, original);

      Config.Client.MetaFile = (req.body.settings as ClientMetaFileConfig);
      // only updating explicitly set config (not saving config set by the diagnostics)

      original.Client.MetaFile = (req.body.settings as ClientMetaFileConfig);
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


  public static async updateAlbumsSettings(req: Request, res: Response, next: NextFunction): Promise<any> {
    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    try {
      const original = await Config.original();
      await ConfigDiagnostics.testAlbumsConfig(req.body.settings as ClientAlbumConfig, original);

      Config.Client.Album = (req.body.settings as ClientAlbumConfig);
      // only updating explicitly set config (not saving config set by the diagnostics)

      original.Client.Album = (req.body.settings as ClientAlbumConfig);
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

  public static async updateShareSettings(req: Request, res: Response, next: NextFunction): Promise<any> {
    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    try {
      // only updating explicitly set config (not saving config set by the diagnostics)
      const original = await Config.original();
      await ConfigDiagnostics.testSharingConfig(req.body.settings as ClientSharingConfig, original);

      Config.Client.Sharing = (req.body.settings as ClientSharingConfig);
      original.Client.Sharing = (req.body.settings as ClientSharingConfig);
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

  public static async updateRandomPhotoSettings(req: Request, res: Response, next: NextFunction): Promise<any> {
    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    try {
      // only updating explicitly set config (not saving config set by the diagnostics)
      const original = await Config.original();
      await ConfigDiagnostics.testRandomPhotoConfig(req.body.settings as ClientRandomPhotoConfig, original);

      Config.Client.RandomPhoto = (req.body.settings as ClientRandomPhotoConfig);
      original.Client.RandomPhoto = (req.body.settings as ClientRandomPhotoConfig);
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

  public static async updateSearchSettings(req: Request, res: Response, next: NextFunction): Promise<any> {
    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    try {
      // only updating explicitly set config (not saving config set by the diagnostics)
      const original = await Config.original();
      await ConfigDiagnostics.testSearchConfig(req.body.settings as ClientSearchConfig, original);

      Config.Client.Search = (req.body.settings as ClientSearchConfig);
      original.Client.Search = (req.body.settings as ClientSearchConfig);
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

  public static async updateFacesSettings(req: Request, res: Response, next: NextFunction): Promise<any> {
    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    try {
      // only updating explicitly set config (not saving config set by the diagnostics)
      const original = await Config.original();
      await ConfigDiagnostics.testFacesConfig(req.body.settings as ClientFacesConfig, original);

      Config.Client.Faces = (req.body.settings as ClientFacesConfig);
      original.Client.Faces = (req.body.settings as ClientFacesConfig);
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

  public static async updateAuthenticationSettings(req: Request, res: Response, next: NextFunction): Promise<any> {
    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    try {
      Config.Client.authenticationRequired = (req.body.settings as boolean);
      // only updating explicitly set config (not saving config set by the diagnostics)
      const original = await Config.original();
      original.Client.authenticationRequired = (req.body.settings as boolean);
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

  public static async updateThumbnailSettings(req: Request, res: Response, next: NextFunction): Promise<any> {
    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    try {
      const settings: {
        server: ServerThumbnailConfig,
        client: ClientThumbnailConfig
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

  public static async updatePhotoSettings(req: Request, res: Response, next: NextFunction): Promise<any> {
    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    try {
      const settings: {
        server: ServerPhotoConfig,
        client: ClientPhotoConfig
      } = req.body.settings;

      await ConfigDiagnostics.testServerPhotoConfig(settings.server);
      await ConfigDiagnostics.testClientPhotoConfig(settings.client);
      Config.Server.Media.Photo = settings.server;
      Config.Client.Media.Photo = settings.client;
      // only updating explicitly set config (not saving config set by the diagnostics)
      const original = await Config.original();
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

  public static async updateBasicSettings(req: Request, res: Response, next: NextFunction): Promise<any> {
    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    try {
      const settings: BasicConfigDTO = req.body.settings;
      await ConfigDiagnostics.testImageFolder(settings.imagesFolder);
      const map = (config: IPrivateConfig, input: BasicConfigDTO) => {
        config.Server.port = input.port;
        config.Server.host = input.host;
        config.Server.Media.folder = input.imagesFolder;
        config.Server.Media.tempFolder = input.tempFolder;
        config.Client.publicUrl = input.publicUrl;
        config.Client.urlBase = input.urlBase;
        config.Client.applicationTitle = input.applicationTitle;
      };
      map(Config, settings);
      // only updating explicitly set config (not saving config set by the diagnostics)
      const original = await Config.original();
      map(original, settings);
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

  public static async updateOtherSettings(req: Request, res: Response, next: NextFunction): Promise<any> {
    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    try {
      const settings: OtherConfigDTO = req.body.settings;
      Config.Client.Other = settings.Client;

      // only updating explicitly set config (not saving config set by the diagnostics)
      const original = await Config.original();
      original.Client.Other = settings.Client;
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

  public static async updateIndexingSettings(req: Request, res: Response, next: NextFunction): Promise<any> {
    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    try {
      const settings: ServerIndexingConfig = req.body.settings;
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

  public static async updateJobSettings(req: Request, res: Response, next: NextFunction): Promise<any> {
    if ((typeof req.body === 'undefined') || (typeof req.body.settings === 'undefined')) {
      return next(new ErrorDTO(ErrorCodes.INPUT_ERROR, 'settings is needed'));
    }

    try {

      // only updating explicitly set config (not saving config set by the diagnostics)
      const settings: ServerJobConfig = req.body.settings;
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
