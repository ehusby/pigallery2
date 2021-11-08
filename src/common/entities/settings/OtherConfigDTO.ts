import {ServerConfig, ServerThreadingConfig} from '../../config/private/PrivateConfig';
import {ClientConfig, ClientOtherConfig} from '../../config/public/ClientConfig';


export interface OtherConfigDTO {
  Server: ServerThreadingConfig;
  Client: ClientOtherConfig;
}
