import {IPrivateConfig, ServerConfig} from './PrivateConfig';
import {ClientConfig} from '../public/ClientConfig';
import * as crypto from 'crypto';
import * as path from 'path';
import {ConfigClass, ConfigClassBuilder} from 'typeconfig/node';
import {ConfigProperty, IConfigClass} from 'typeconfig/common';


declare const process: any;

const upTime = (new Date()).toISOString();

@ConfigClass({
  configPath: path.join(__dirname, './../../../../config.json'),
  saveIfNotExist: true,
  attachDescription: true,
  enumsAsString: true,
  softReadonly: true,
  cli: {
    enable: {
      configPath: true,
      attachState: true,
      attachDescription: true,
      rewriteCLIConfig: true,
      rewriteENVConfig: true,
      enumsAsString: true,
      saveIfNotExist: true,
      exitOnConfig: true
    },
    defaults: {
      enabled: true
    }
  }
})
export class PrivateConfigClass implements IPrivateConfig {
  @ConfigProperty({type: ServerConfig.Config})
  Server: ServerConfig.Config = new ServerConfig.Config();
  @ConfigProperty({type: ClientConfig.Config})
  Client: IConfigClass & ClientConfig.Config = <IConfigClass & ClientConfig.Config>(new ClientConfig.Config());

  constructor() {
    if (!this.Server.sessionSecret || this.Server.sessionSecret.length === 0) {
      this.Server.sessionSecret = [crypto.randomBytes(256).toString('hex'),
        crypto.randomBytes(256).toString('hex'),
        crypto.randomBytes(256).toString('hex')];
    }

    this.Server.Environment.appVersion = require('../../../../package.json').version;
    this.Server.Environment.buildTime = require('../../../../package.json').buildTime;
    this.Server.Environment.buildCommitHash = require('../../../../package.json').buildCommitHash;
    this.Server.Environment.upTime = upTime;
    this.Server.Environment.isDocker = !!process.env['PI_DOCKER'];
  }


  async original(): Promise<PrivateConfigClass & IConfigClass> {
    const pc = ConfigClassBuilder.attachInterface(new PrivateConfigClass());
    await pc.load();
    return pc;
  }

}

export const Config = ConfigClassBuilder.attachInterface(new PrivateConfigClass());
Config.loadSync();
