import {Config} from '../../../../../common/config/private/Config';
import {ColumnOptions} from 'typeorm/decorator/options/ColumnOptions';
import {DatabaseType} from '../../../../../common/config/private/PrivateConfig';

export class ColumnCharsetCS implements ColumnOptions {

  public get charset(): string {
    return Config.Server.Database.type === DatabaseType.mysql ? 'utf8' : 'utf8';
  }

  public get collation(): string {
    return Config.Server.Database.type === DatabaseType.mysql ? 'utf8_bin' : null;

  }
}

export const columnCharsetCS = new ColumnCharsetCS();
