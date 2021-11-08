import {IPersonManager} from '../interfaces/IPersonManager';

export interface ISQLPersonManager extends IPersonManager {
  countFaces(): Promise<number>;
}
