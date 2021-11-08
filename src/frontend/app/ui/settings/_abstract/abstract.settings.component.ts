import {Directive, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {AuthenticationService} from '../../../model/network/authentication.service';
import {UserRoles} from '../../../../../common/entities/UserDTO';
import {Utils} from '../../../../../common/Utils';
import {ErrorDTO} from '../../../../../common/entities/Error';
import {NotificationService} from '../../../model/notification.service';
import {NavigationService} from '../../../model/navigation.service';
import {AbstractSettingsService} from './abstract.settings.service';
import {Subscription} from 'rxjs';
import {ISettingsComponent} from './ISettingsComponent';
import {WebConfig} from '../../../../../common/config/private/WebConfig';
import {FormControl} from '@angular/forms';

interface ConfigState {
  value: any;
  original: any;
  default: any;
  readonly: any;
  onChange: any;
  isEnumType: boolean;
  isConfigType: boolean;
}

interface RecursiveState extends ConfigState {
  value: any;
  original: any;
  default: any;
  readonly: any;
  onChange: any;
  isEnumType: any;
  isConfigType: any;

  [key: string]: RecursiveState;
}

@Directive()
export abstract class SettingsComponentDirective<T extends { [key: string]: any },
  S extends AbstractSettingsService<T> = AbstractSettingsService<T>>
  implements OnInit, OnDestroy, OnChanges, ISettingsComponent {

  @Input()
  public simplifiedMode = true;

  @ViewChild('settingsForm', {static: true})
  form: FormControl;


  @Output()
  hasAvailableSettings = true;

  public inProgress = false;
  public error: string = null;
  public changed = false;
  public states: RecursiveState = {} as any;


  private subscription: Subscription = null;
  private readonly settingsSubscription: Subscription = null;

  protected constructor(private name: string,
                        protected authService: AuthenticationService,
                        private navigation: NavigationService,
                        public settingsService: S,
                        protected notification: NotificationService,
                        private sliceFN?: (s: WebConfig) => T) {
    if (this.sliceFN) {
      this.settingsSubscription = this.settingsService.Settings.subscribe(this.onNewSettings);
      this.onNewSettings(this.settingsService.settingsService.settings.value);
    }
  }


  get Name(): string {
    return this.changed ? this.name + '*' : this.name;
  }

  get Changed(): boolean {
    return this.changed;
  }

  get HasAvailableSettings(): boolean {
    return this.hasAvailableSettings;
  }

  onNewSettings = (s: WebConfig) => {

    this.states = Utils.clone(this.sliceFN(s.State) as any);
    const addOriginal = (obj: any) => {
      for (const k of Object.keys(obj)) {
        if (typeof obj[k].value === 'undefined') {
          if (typeof obj[k] === 'object') {
            addOriginal(obj[k]);
          }
          continue;
        }

        obj[k].original = Utils.clone(obj[k].value);
        obj[k].onChange = this.onOptionChange;
      }
    };
    addOriginal(this.states);
    this.ngOnChanges();
  };

  settingsSame(newSettings: T, original: T): boolean {
    if (typeof original !== 'object' || original == null) {
      return newSettings === original;
    }
    if (!newSettings) {
      return false;
    }
    if (Array.isArray(original) && original.length !== newSettings.length) {
      return false;
    }
    const keys = Object.keys(newSettings);
    for (const key of keys) {
      if (typeof original[key] === 'undefined') {
        console.warn('unknown settings: ' + key);
        return false;
      }
      if (typeof original[key] === 'object') {
        if (this.settingsSame(newSettings[key], original[key]) === false) {
          return false;
        }
      } else if (newSettings[key] !== original[key]) {
        return false;
      }
    }

    return true;
  }

  onOptionChange = () => {
    setTimeout(() => {
      const settingsSame = (state: RecursiveState): boolean => {


        if (typeof state === 'undefined') {
          return true;
        }
        if (typeof state.original === 'object') {
          return Utils.equalsFilter(state.original, state.value);
        }
        if (typeof state.original !== 'undefined') {
          return state.value === state.original;
        }

        const keys = Object.keys(state);

        for (const key of keys) {
          if (settingsSame(state[key]) === false) {
            return false;
          }
        }

        return true;
      };

      this.changed = !settingsSame(this.states);
    }, 0);
  };

  ngOnInit(): void {
    if (!this.authService.isAuthenticated() ||
      this.authService.user.value.role < UserRoles.Admin) {
      this.navigation.toLogin();
      return;
    }
    this.getSettings();

    // TODO: fix after this issue is fixed: https://github.com/angular/angular/issues/24818
    this.subscription = this.form.valueChanges.subscribe(() => {
      this.onOptionChange();
    });
  }

  ngOnChanges(): void {
    this.hasAvailableSettings = ((this.settingsService.isSupported() &&
      this.settingsService.showInSimplifiedMode())
      || !this.simplifiedMode);
  }


  ngOnDestroy(): void {
    if (this.subscription != null) {
      this.subscription.unsubscribe();
    }
    if (this.settingsSubscription != null) {
      this.settingsSubscription.unsubscribe();
    }
  }

  public reset(): void {
    this.getSettings();
  }

  stateToSettings(): T {
    const ret: T = {} as any;

    const add = (obj: any, to: any): void => {
      for (const key of Object.keys(obj)) {
        to[key] = {};
        if (obj[key].isConfigType || (typeof obj[key] === 'object' && typeof obj[key].value === 'undefined')) {
          add(obj[key], to[key]);
          continue;
        }
        to[key] = obj[key].value;
      }
    };
    add(this.states, ret);

    return ret;

  }

  public async save(): Promise<boolean> {
    this.inProgress = true;
    this.error = '';
    try {
      await this.settingsService.updateSettings(this.stateToSettings());
      await this.getSettings();
      this.notification.success(this.Name + ' ' + $localize`settings saved`, $localize`Success`);
      this.inProgress = false;
      return true;
    } catch (err) {
      console.error(err);
      if (err.message) {
        this.error = (err as ErrorDTO).message;
      }
    }

    this.inProgress = false;
    return false;
  }


  private async getSettings(): Promise<void> {
    await this.settingsService.getSettings();
    this.changed = false;
  }
}



