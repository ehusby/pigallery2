import {ClientConfig} from './ClientConfig';
import {WebConfigClass} from 'typeconfig/src/decorators/class/WebConfigClass';
import {WebConfigClassBuilder} from 'typeconfig/src/decorators/builders/WebConfigClassBuilder';
import {ConfigProperty} from 'typeconfig/src/decorators/property/ConfigPropoerty';


/**
 * These configuration will be available at frontend and backend too
 */
@WebConfigClass()
export class ClientClass {

  @ConfigProperty()
  public Client: ClientConfig = new ClientConfig();
}

// ConfigInject is getting injected form the server side to the global scope
// tslint:disable-next-line:no-namespace
declare namespace ServerInject {
  export const ConfigInject: ClientClass;
}

export let Config = WebConfigClassBuilder.attachInterface(new ClientClass());


if (typeof ServerInject !== 'undefined' && typeof ServerInject.ConfigInject !== 'undefined') {
  Config.load(ServerInject.ConfigInject);
}


if (Config.Client.publicUrl === '') {
  Config.Client.publicUrl = location.origin;
}

