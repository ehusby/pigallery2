import {Config} from '../common/config/private/Config';
import * as express from 'express';
import {Request} from 'express';
import * as cookieParser from 'cookie-parser';
import * as _http from 'http';
import {Server as HttpServer} from 'http';
// @ts-ignore
import * as locale from 'locale';
import {ObjectManagers} from './model/ObjectManagers';
import {Logger} from './Logger';
import {LoggerRouter} from './routes/LoggerRouter';
import {DiskManager} from './model/DiskManger';
import {ConfigDiagnostics} from './model/diagnostics/ConfigDiagnostics';
import {Localizations} from './model/Localizations';
import {CookieNames} from '../common/CookieNames';
import {Router} from './routes/Router';
import {PhotoProcessing} from './model/fileprocessing/PhotoProcessing';
import * as _csrf from 'csurf';
import * as unless from 'express-unless';
import {Event} from '../common/event/Event';
import {QueryParams} from '../common/QueryParams';
import {ConfigClassBuilder} from 'typeconfig/node';
import {ConfigClassOptions} from 'typeconfig/src/decorators/class/IConfigClass';
import {DatabaseType} from '../common/config/private/PrivateConfig';

const session = require('cookie-session');

declare var process: NodeJS.Process;

const LOG_TAG = '[server]';

export class Server {

  public onStarted = new Event<void>();
  private app: express.Express;
  private server: HttpServer;

  constructor() {
    if (!(process.env.NODE_ENV === 'production')) {
      Logger.info(LOG_TAG, 'Running in DEBUG mode, set env variable NODE_ENV=production to disable ');
    }
    this.init().catch(console.error);
  }

  get App(): any {
    return this.server;
  }

  async init(): Promise<void> {
    Logger.info(LOG_TAG, 'running diagnostics...');
    await ConfigDiagnostics.runDiagnostics();
    Logger.verbose(LOG_TAG, 'using config from ' +
      (ConfigClassBuilder.attachPrivateInterface(Config).__options as ConfigClassOptions).configPath + ':');
    Logger.verbose(LOG_TAG, JSON.stringify(Config, null, '\t'));

    this.app = express();

    LoggerRouter.route(this.app);

    this.app.set('view engine', 'ejs');


    /**
     * Session above all
     */

    this.app.use(session({
      name: CookieNames.session,
      keys: Config.Server.sessionSecret
    }));


    /**
     * Parse parameters in POST
     */
    // for parsing application/json
    this.app.use(express.json());
    this.app.use(cookieParser());
    const csuf: any = _csrf();
    csuf.unless = unless;
    this.app.use(csuf.unless((req: Request) => {
      return Config.Client.authenticationRequired === false ||
        ['/api/user/login', '/api/user/logout', '/api/share/login'].indexOf(req.originalUrl) !== -1 ||
        (Config.Client.Sharing.enabled === true && !!req.query[QueryParams.gallery.sharingKey_query]);
    }));

    // enable token generation but do not check it
    this.app.post(['/api/user/login', '/api/share/login'], _csrf({ignoreMethods: ['POST']}));
    this.app.get(['/api/user/me', '/api/share/:' + QueryParams.gallery.sharingKey_params], _csrf({ignoreMethods: ['GET']}));


    DiskManager.init();
    PhotoProcessing.init();
    Localizations.init();

    this.app.use(locale(Config.Client.languages, 'en'));
    if (Config.Server.Database.type !== DatabaseType.memory) {
      await ObjectManagers.InitSQLManagers();
    } else {
      await ObjectManagers.InitMemoryManagers();
    }

    Router.route(this.app);


    // Get PORT from environment and store in Express.
    this.app.set('port', Config.Server.port);

    // Create HTTP server.
    this.server = _http.createServer(this.app);

    // Listen on provided PORT, on all network interfaces.
    this.server.listen(Config.Server.port, Config.Server.host);
    this.server.on('error', this.onError);
    this.server.on('listening', this.onListening);

    this.onStarted.trigger();
  }

  /**
   * Event listener for HTTP server "error" event.
   */
  private onError = (error: any) => {
    if (error.syscall !== 'listen') {
      Logger.error(LOG_TAG, 'Server error', error);
      throw error;
    }

    const bind = Config.Server.host + ':' + Config.Server.port;

    // handle specific listen error with friendly messages
    switch (error.code) {
      case 'EACCES':
        Logger.error(LOG_TAG, bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        Logger.error(LOG_TAG, bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  };

  /**
   * Event listener for HTTP server "listening" event.
   */
  private onListening = () => {
    const addr = this.server.address();
    const bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    Logger.info(LOG_TAG, 'Listening on ' + bind);
  };

}






