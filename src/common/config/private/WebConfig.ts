/* tslint:disable:no-inferrable-types */
import 'reflect-metadata';
import {ClientConfig} from '../public/ClientConfig';
import {ServerConfig} from './PrivateConfig';
import {WebConfigClass} from 'typeconfig/web';
import {ConfigProperty, ConfigState} from 'typeconfig/common';


@WebConfigClass({softReadonly: true})
export class WebConfig {
  @ConfigState()
  State: any;

  @ConfigProperty()
  Server: ServerConfig = new ServerConfig();
  @ConfigProperty()
  Client: ClientConfig = new ClientConfig();

}
