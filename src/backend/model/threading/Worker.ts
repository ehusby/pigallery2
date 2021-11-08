import {DirectoryScanSettings, DiskMangerWorker} from './DiskMangerWorker';
import {Logger} from '../../Logger';
import {PhotoWorker, RendererInput} from './PhotoWorker';
import {Utils} from '../../../common/Utils';
import {MediaDTO} from '../../../common/entities/MediaDTO';
import {ParentDirectoryDTO} from '../../../common/entities/DirectoryDTO';

declare var process: NodeJS.Process;
declare var global: NodeJS.Global;
const LOG_TAG = '[Worker]';

export class Worker {
  public static process<O extends (void | ParentDirectoryDTO<MediaDTO>)>(): void {
    Logger.debug(LOG_TAG, 'Worker is waiting for tasks');
    process.on('message', async (task: WorkerTask) => {
      try {
        let result = null;
        switch (task.type) {
          case WorkerTaskTypes.diskManager:
            result = await DiskMangerWorker.scanDirectory((task as DiskManagerTask).relativeDirectoryName,
              (task as DiskManagerTask).settings);
            if (global.gc) {
              global.gc();
            }
            break;
          case WorkerTaskTypes.thumbnail:
            result = await PhotoWorker.render((task as ThumbnailTask).input);
            break;
          default:
            throw new Error('Unknown worker task type');
        }
        process.send({
          error: null,
          result
        } as WorkerMessage<O>);
      } catch (err) {
        process.send({error: err, result: null});
      }
    });
  }
}


export enum WorkerTaskTypes {
  thumbnail = 1, diskManager = 2
}

export interface WorkerTask {
  type: WorkerTaskTypes;
}

export interface DiskManagerTask extends WorkerTask {
  relativeDirectoryName: string;
  settings: DirectoryScanSettings;
}

export interface ThumbnailTask extends WorkerTask {
  input: RendererInput;
}

export const WorkerTask = {
  equals: (t1: WorkerTask, t2: WorkerTask): boolean => {
    return Utils.equalsFilter(t1, t2);
  }
};

export interface WorkerMessage<O> {
  error: Error;
  result: O;
}
