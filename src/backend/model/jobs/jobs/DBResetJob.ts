import {ObjectManagers} from '../../ObjectManagers';
import {Config} from '../../../../common/config/private/Config';
import {ConfigTemplateEntry, DefaultsJobs} from '../../../../common/entities/job/JobDTO';
import {Job} from './Job';
import {DatabaseType} from '../../../../common/config/private/PrivateConfig';


export class DBRestJob extends Job {
  public readonly Name = DefaultsJobs[DefaultsJobs['Database Reset']];
  public readonly ConfigTemplate: ConfigTemplateEntry[] = null;
  protected readonly IsInstant = true;

  public get Supported(): boolean {
    return Config.Server.Database.type !== DatabaseType.memory;
  }

  protected async init(): Promise<void> {
  }

  protected async step(): Promise<boolean> {
    this.Progress.Left = 1;
    this.Progress.Processed++;
    await ObjectManagers.getInstance().IndexingManager.resetDB();
    return false;
  }


}
