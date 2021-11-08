import * as cluster from 'cluster';
import {Logger} from '../../Logger';
import {DiskManagerTask, ThumbnailTask, WorkerMessage, WorkerTask, WorkerTaskTypes} from './Worker';
import {ParentDirectoryDTO} from '../../../common/entities/DirectoryDTO';
import {RendererInput} from './PhotoWorker';
import {TaskQue, TaskQueEntry} from './TaskQue';
import {ITaskExecuter} from './TaskExecuter';
import {DirectoryScanSettings} from './DiskMangerWorker';


interface WorkerWrapper<O> {
  worker: cluster.Worker;
  poolTask: TaskQueEntry<WorkerTask, O>;
}

const LOG_TAG = '[ThreadPool]';

export class ThreadPool<O> {

  public static WorkerCount = 0;
  private workers: WorkerWrapper<O>[] = [];
  private taskQue = new TaskQue<WorkerTask, O>();

  constructor(private size: number) {
    Logger.silly(LOG_TAG, 'Creating thread pool with', size, 'workers');
    for (let i = 0; i < size; i++) {
      this.startWorker();
    }
  }

  protected executeTask(task: WorkerTask): Promise<O> {
    const promise = this.taskQue.add(task).promise.obj;
    this.run();
    return promise;
  }

  private run = (): void => {
    if (this.taskQue.isEmpty()) {
      return;
    }
    const worker = this.getFreeWorker();
    if (worker == null) {
      return;
    }

    const poolTask = this.taskQue.get();
    worker.poolTask = poolTask;
    worker.worker.send(poolTask.data);
  };

  private getFreeWorker(): null | WorkerWrapper<O> {
    for (const worker of this.workers) {
      if (worker.poolTask == null) {
        return worker;
      }
    }
    return null;
  }

  private startWorker(): void {
    const worker = {poolTask: null, worker: cluster.fork()} as WorkerWrapper<O>;
    this.workers.push(worker);
    worker.worker.on('online', (): void => {
      ThreadPool.WorkerCount++;
      Logger.debug(LOG_TAG, 'Worker ' + worker.worker.process.pid + ' is online, worker count:', ThreadPool.WorkerCount);
    });
    worker.worker.on('exit', (code, signal): void => {
      ThreadPool.WorkerCount--;
      Logger.warn(LOG_TAG, 'Worker ' + worker.worker.process.pid + ' died with code: ' + code +
        ', and signal: ' + signal + ', worker count:', ThreadPool.WorkerCount);
      Logger.debug(LOG_TAG, 'Starting a new worker');
      this.startWorker();
    });

    worker.worker.on('message', (msg: WorkerMessage<O>): void => {
      if (worker.poolTask == null) {
        throw new Error('No worker task after worker task is completed');
      }
      if (msg.error) {
        worker.poolTask.promise.reject(msg.error);
      } else {
        worker.poolTask.promise.resolve(msg.result);
      }
      this.taskQue.ready(worker.poolTask);
      worker.poolTask = null;
      this.run();
    });
  }

}

export class DiskManagerTH extends ThreadPool<ParentDirectoryDTO> implements ITaskExecuter<string, ParentDirectoryDTO> {
  execute(relativeDirectoryName: string, settings: DirectoryScanSettings = {}): Promise<ParentDirectoryDTO> {
    return super.executeTask({
      type: WorkerTaskTypes.diskManager,
      relativeDirectoryName,
      settings
    } as DiskManagerTask);
  }
}

export class ThumbnailTH extends ThreadPool<void> implements ITaskExecuter<RendererInput, void> {
  execute(input: RendererInput): Promise<void> {
    return super.executeTask({
      type: WorkerTaskTypes.thumbnail,
      input,
    } as ThumbnailTask);
  }
}
