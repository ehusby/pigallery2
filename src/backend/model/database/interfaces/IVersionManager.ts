import {IObjectManager} from './IObjectManager';

export interface IVersionManager extends IObjectManager {
  getDataVersion(): Promise<string>;
}
