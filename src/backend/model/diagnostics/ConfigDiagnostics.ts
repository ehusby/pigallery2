import {Config} from '../../../common/config/private/Config';
import {Logger} from '../../Logger';
import {NotificationManager} from '../NotifocationManager';
import {SQLConnection} from '../database/sql/SQLConnection';
import * as fs from 'fs';
import {FFmpegFactory} from '../FFmpegFactory';
import {ClientConfig} from '../../../common/config/public/ClientConfig';
import {IPrivateConfig, ServerConfig} from '../../../common/config/private/PrivateConfig';
import MapLayers = ClientConfig.MapLayers;

const LOG_TAG = '[ConfigDiagnostics]';


export class ConfigDiagnostics {

  static checkReadWritePermission(path: string) {
    return new Promise((resolve, reject) => {
      // tslint:disable-next-line:no-bitwise
      fs.access(path, fs.constants.R_OK | fs.constants.W_OK, (err) => {
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    });
  }

  static async testDatabase(databaseConfig: ServerConfig.DataBaseConfig) {
    if (databaseConfig.type !== ServerConfig.DatabaseType.memory) {
      await SQLConnection.tryConnection(databaseConfig);
    }
    if (databaseConfig.type !== ServerConfig.DatabaseType.sqlite) {
      try {
        await this.checkReadWritePermission(SQLConnection.getSQLiteDB(databaseConfig));
      } catch (e) {
        throw new Error('Cannot read or write sqlite storage file: ' + SQLConnection.getSQLiteDB(databaseConfig));
      }
    }
  }


  static async testMetaFileConfig(metaFileConfig: ClientConfig.MetaFileConfig, config: IPrivateConfig) {
    // TODO: now we have metadata for pg2conf files too not only gpx that also runs without map
    if (metaFileConfig.enabled === true &&
      config.Client.Map.enabled === false) {
      throw new Error('*.gpx meta files are not supported without MAP');
    }
  }


  static testClientVideoConfig(videoConfig: ClientConfig.VideoConfig) {
    return new Promise((resolve, reject) => {
      try {
        if (videoConfig.enabled === true) {
          const ffmpeg = FFmpegFactory.get();
          ffmpeg().getAvailableCodecs((err: Error) => {
            if (err) {
              return reject(new Error('Error accessing ffmpeg, cant find executable: ' + err.toString()));
            }
            ffmpeg(__dirname + '/blank.jpg').ffprobe((err2: Error) => {
              if (err2) {
                return reject(new Error('Error accessing ffmpeg-probe, cant find executable: ' + err2.toString()));
              }
              return resolve();
            });
          });
        } else {
          return resolve();
        }
      } catch (e) {
        return reject(new Error('unknown video error: ' + e.toString()));
      }
    });
  }

  static async testServerVideoConfig(videoConfig: ServerConfig.VideoConfig, config: IPrivateConfig) {
    if (config.Client.Media.Video.enabled === true) {
      if (videoConfig.transcoding.fps <= 0) {
        throw new Error('fps should be grater than 0');
      }
    }
  }

  static async testSharp() {
    const sharp = require('sharp');
    sharp();
  }

  static async testThumbnailLib(processingLibrary: ServerConfig.PhotoProcessingLib) {
    switch (processingLibrary) {
      case ServerConfig.PhotoProcessingLib.sharp:
        await this.testSharp();
        break;
    }
  }

  static async testTempFolder(folder: string) {
    await this.checkReadWritePermission(folder);
  }

  static testImageFolder(folder: string) {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(folder)) {
        reject('Images folder not exists: \'' + folder + '\'');
      }
      fs.access(folder, fs.constants.R_OK, (err) => {
        if (err) {
          reject({message: 'Error during getting read access to images folder', error: err.toString()});
        }
      });
      resolve();
    });
  }


  static async testServerPhotoConfig(server: ServerConfig.PhotoConfig) {

  }

  static async testClientPhotoConfig(client: ClientConfig.PhotoConfig) {

  }

  public static async testServerThumbnailConfig(server: ServerConfig.ThumbnailConfig) {
    if (server.personFaceMargin < 0 || server.personFaceMargin > 1) {
      throw new Error('personFaceMargin should be between 0 and 1');
    }
  }

  static async testClientThumbnailConfig(thumbnailConfig: ClientConfig.ThumbnailConfig) {
    if (isNaN(thumbnailConfig.iconSize) || thumbnailConfig.iconSize <= 0) {
      throw new Error('IconSize has to be >= 0 integer, got: ' + thumbnailConfig.iconSize);
    }

    if (!thumbnailConfig.thumbnailSizes.length) {
      throw new Error('At least one thumbnail size is needed');
    }
    for (let i = 0; i < thumbnailConfig.thumbnailSizes.length; i++) {
      if (isNaN(thumbnailConfig.thumbnailSizes[i]) || thumbnailConfig.thumbnailSizes[i] <= 0) {
        throw new Error('Thumbnail size has to be >= 0 integer, got: ' + thumbnailConfig.thumbnailSizes[i]);
      }
    }
  }


  static async testTasksConfig(task: ServerConfig.JobConfig, config: IPrivateConfig) {

  }

  static async testFacesConfig(faces: ClientConfig.FacesConfig, config: IPrivateConfig) {
    if (faces.enabled === true) {
      if (config.Server.Database.type === ServerConfig.DatabaseType.memory) {
        throw new Error('Memory Database do not support faces');
      }
      if (config.Client.Search.enabled === false) {
        throw new Error('Faces support needs enabled search');
      }
    }
  }

  static async testSearchConfig(search: ClientConfig.SearchConfig, config: IPrivateConfig) {
    if (search.enabled === true &&
      config.Server.Database.type === ServerConfig.DatabaseType.memory) {
      throw new Error('Memory Database do not support searching');
    }
  }


  static async testSharingConfig(sharing: ClientConfig.SharingConfig, config: IPrivateConfig) {
    if (sharing.enabled === true &&
      config.Server.Database.type === ServerConfig.DatabaseType.memory) {
      throw new Error('Memory Database do not support sharing');
    }
    if (sharing.enabled === true &&
      config.Client.authenticationRequired === false) {
      throw new Error('In case of no authentication, sharing is not supported');
    }
  }

  static async testRandomPhotoConfig(sharing: ClientConfig.RandomPhotoConfig, config: IPrivateConfig) {
    if (sharing.enabled === true &&
      config.Server.Database.type === ServerConfig.DatabaseType.memory) {
      throw new Error('Memory Database do not support random photo');
    }
  }


  static async testMapConfig(map: ClientConfig.MapConfig): Promise<void> {
    if (map.enabled === false) {
      return;
    }
    if (map.mapProvider === ClientConfig.MapProviders.Mapbox &&
      (!map.mapboxAccessToken || map.mapboxAccessToken.length === 0)) {
      throw new Error('Mapbox needs a valid api key.');
    }
    if (map.mapProvider === ClientConfig.MapProviders.Custom &&
      (!map.customLayers || map.customLayers.length === 0)) {
      throw new Error('Custom maps need at least one valid layer');
    }
    if (map.mapProvider === ClientConfig.MapProviders.Custom) {
      map.customLayers.forEach((l: MapLayers) => {
        if (!l.url || l.url.length === 0) {
          throw new Error('Custom maps url need to be a valid layer');
        }
      });
    }
  }


  static async runDiagnostics() {

    if (Config.Server.Database.type !== ServerConfig.DatabaseType.memory) {
      try {
        await ConfigDiagnostics.testDatabase(Config.Server.Database);
      } catch (ex) {
        const err: Error = ex;
        Logger.warn(LOG_TAG, '[SQL error]', err.toString());
        Logger.error(LOG_TAG, 'Error during initializing SQL DB, check DB connection and settings');
        process.exit(1);
      }
    }

    if (Config.Server.Media.photoProcessingLibrary !== ServerConfig.PhotoProcessingLib.Jimp) {
      try {
        await ConfigDiagnostics.testThumbnailLib(Config.Server.Media.photoProcessingLibrary);
      } catch (ex) {
        const err: Error = ex;
        NotificationManager.warning('Thumbnail hardware acceleration is not possible.' +
          ' \'' + ServerConfig.PhotoProcessingLib[Config.Server.Media.photoProcessingLibrary] + '\' node module is not found.' +
          ' Falling back temporally to JS based thumbnail generation', err.toString());
        Logger.warn(LOG_TAG, '[Thumbnail hardware acceleration] module error: ', err.toString());
        Logger.warn(LOG_TAG, 'Thumbnail hardware acceleration is not possible.' +
          ' \'' + ServerConfig.PhotoProcessingLib[Config.Server.Media.photoProcessingLibrary] + '\' node module is not found.' +
          ' Falling back temporally to JS based thumbnail generation');
        Config.Server.Media.photoProcessingLibrary = ServerConfig.PhotoProcessingLib.Jimp;
      }
    }

    try {
      await ConfigDiagnostics.testTempFolder(Config.Server.Media.tempFolder);
    } catch (ex) {
      const err: Error = ex;
      NotificationManager.error('Thumbnail folder error', err.toString());
      Logger.error(LOG_TAG, 'Thumbnail folder error', err.toString());
    }


    try {
      await ConfigDiagnostics.testClientVideoConfig(Config.Client.Media.Video);
      await ConfigDiagnostics.testServerVideoConfig(Config.Server.Media.Video, Config);
    } catch (ex) {
      const err: Error = ex;
      NotificationManager.warning('Video support error, switching off..', err.toString());
      Logger.warn(LOG_TAG, 'Video support error, switching off..', err.toString());
      Config.Client.Media.Video.enabled = false;
    }

    try {
      await ConfigDiagnostics.testMetaFileConfig(Config.Client.MetaFile, Config);
    } catch (ex) {
      const err: Error = ex;
      NotificationManager.warning('Meta file support error, switching off..', err.toString());
      Logger.warn(LOG_TAG, 'Meta file support error, switching off..', err.toString());
      Config.Client.MetaFile.enabled = false;
    }


    try {
      await ConfigDiagnostics.testImageFolder(Config.Server.Media.folder);
    } catch (ex) {
      const err: Error = ex;
      NotificationManager.error('Images folder error', err.toString());
      Logger.error(LOG_TAG, 'Images folder error', err.toString());
    }
    try {
      await ConfigDiagnostics.testClientThumbnailConfig(Config.Client.Media.Thumbnail);
    } catch (ex) {
      const err: Error = ex;
      NotificationManager.error('Thumbnail settings error', err.toString());
      Logger.error(LOG_TAG, 'Thumbnail settings error', err.toString());
    }


    try {
      await ConfigDiagnostics.testSearchConfig(Config.Client.Search, Config);
    } catch (ex) {
      const err: Error = ex;
      NotificationManager.warning('Search is not supported with these settings. Disabling temporally. ' +
        'Please adjust the config properly.', err.toString());
      Logger.warn(LOG_TAG, 'Search is not supported with these settings, switching off..', err.toString());
      Config.Client.Search.enabled = false;
    }

    try {
      await ConfigDiagnostics.testFacesConfig(Config.Client.Faces, Config);
    } catch (ex) {
      const err: Error = ex;
      NotificationManager.warning('Faces are not supported with these settings. Disabling temporally. ' +
        'Please adjust the config properly.', err.toString());
      Logger.warn(LOG_TAG, 'Faces are not supported with these settings, switching off..', err.toString());
      Config.Client.Faces.enabled = false;
    }


    try {
      await ConfigDiagnostics.testTasksConfig(Config.Server.Jobs, Config);
    } catch (ex) {
      const err: Error = ex;
      NotificationManager.warning('Some Tasks are not supported with these settings. Disabling temporally. ' +
        'Please adjust the config properly.', err.toString());
      Logger.warn(LOG_TAG, 'Some Tasks not supported with these settings, switching off..', err.toString());
      Config.Client.Faces.enabled = false;
    }

    try {
      await ConfigDiagnostics.testSharingConfig(Config.Client.Sharing, Config);
    } catch (ex) {
      const err: Error = ex;
      NotificationManager.warning('Sharing is not supported with these settings. Disabling temporally. ' +
        'Please adjust the config properly.', err.toString());
      Logger.warn(LOG_TAG, 'Sharing is not supported with these settings, switching off..', err.toString());
      Config.Client.Sharing.enabled = false;
    }

    try {
      await ConfigDiagnostics.testRandomPhotoConfig(Config.Client.Sharing, Config);
    } catch (ex) {
      const err: Error = ex;
      NotificationManager.warning('Random Media is not supported with these settings. Disabling temporally. ' +
        'Please adjust the config properly.', err.toString());
      Logger.warn(LOG_TAG, 'Random Media is not supported with these settings, switching off..', err.toString());
      Config.Client.Sharing.enabled = false;
    }


    try {
      await ConfigDiagnostics.testMapConfig(Config.Client.Map);
    } catch (ex) {
      const err: Error = ex;
      NotificationManager.warning('Maps is not supported with these settings. Using open street maps temporally. ' +
        'Please adjust the config properly.', err.toString());
      Logger.warn(LOG_TAG, 'Maps is not supported with these settings. Using open street maps temporally ' +
        'Please adjust the config properly.', err.toString());
      Config.Client.Map.mapProvider = ClientConfig.MapProviders.OpenStreetMap;
    }

  }

}
