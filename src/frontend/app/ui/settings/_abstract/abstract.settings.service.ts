import {BehaviorSubject} from 'rxjs';
import {SettingsService} from '../settings.service';
import {WebConfig} from '../../../../../common/config/private/WebConfig';

export abstract class AbstractSettingsService<T> {

  protected constructor(public settingsService: SettingsService) {

  }

  get Settings(): BehaviorSubject<WebConfig> {
    return this.settingsService.settings;
  }


  public getSettings(): Promise<void> {
    return this.settingsService.getSettings();
  }

  public showInSimplifiedMode(): boolean {
    return true;
  }

  isSupported(): boolean {
    return true;
  }

  abstract updateSettings(settings: T): Promise<void>;
}
