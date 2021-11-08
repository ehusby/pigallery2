import {Component, OnInit, ViewChild} from '@angular/core';
import {AuthenticationService} from '../../../model/network/authentication.service';
import {UserDTO, UserRoles} from '../../../../../common/entities/UserDTO';
import {Utils} from '../../../../../common/Utils';
import {UserManagerSettingsService} from './usermanager.settings.service';
import {ModalDirective} from 'ngx-bootstrap/modal';
import {NavigationService} from '../../../model/navigation.service';
import {NotificationService} from '../../../model/notification.service';
import {ErrorCodes, ErrorDTO} from '../../../../../common/entities/Error';
import {ISettingsComponent} from '../_abstract/ISettingsComponent';

@Component({
  selector: 'app-settings-usermanager',
  templateUrl: './usermanager.settings.component.html',
  styleUrls: ['./usermanager.settings.component.css',
    '../_abstract/abstract.settings.component.css'],
  providers: [UserManagerSettingsService],
})
export class UserMangerSettingsComponent implements OnInit, ISettingsComponent {
  @ViewChild('userModal', {static: false}) public childModal: ModalDirective;
  public newUser = {} as UserDTO;
  public userRoles: any[] = [];
  public users: UserDTO[] = [];
  public enabled = true;
  public error: string = null;
  public inProgress = false;
  Name: string;
  HasAvailableSettings = true;
  Changed = false;


  text = {
    Enabled: 'Enabled',
    Disabled: 'Disabled',
    Low: 'Low',
    High: 'High'
  };


  constructor(private authService: AuthenticationService,
              private navigation: NavigationService,
              private userSettings: UserManagerSettingsService,
              private notification: NotificationService) {
    this.Name = $localize`Password protection`;
    this.text.Enabled = $localize`Enabled`;
    this.text.Disabled = $localize`Disabled`;
    this.text.Low = $localize`Low`;
    this.text.High = $localize`High`;
  }


  ngOnInit(): void {
    if (!this.authService.isAuthenticated() ||
      this.authService.user.value.role < UserRoles.Admin) {
      this.navigation.toLogin();
      return;
    }
    this.userRoles = Utils
      .enumToArray(UserRoles)
      .filter(r => r.key !== UserRoles.LimitedGuest)
      .filter(r => r.key <= this.authService.user.value.role)
      .sort((a, b) => a.key - b.key);

    this.getSettings();
    this.getUsersList();
  }

  canModifyUser(user: UserDTO): boolean {
    const currentUser = this.authService.user.value;
    if (!currentUser) {
      return false;
    }

    return currentUser.name !== user.name && currentUser.role >= user.role;
  }

  async switched(event: { previousValue: false, currentValue: true }): Promise<void> {
    this.inProgress = true;
    this.error = '';
    this.enabled = event.currentValue;
    try {
      await this.userSettings.updateSettings(this.enabled);
      await this.getSettings();
      if (this.enabled === true) {
        this.notification.success($localize`Password protection enabled`, $localize`Success`);
        this.notification.info($localize`Server restart is recommended.`);
        this.getUsersList();
      } else {
        this.notification.success($localize`Password protection disabled`, $localize`Success`);
      }
    } catch (err) {
      console.error(err);
      if (err.message) {
        this.error = (err as ErrorDTO).message;
      }
    }
    this.inProgress = false;
  }

  initNewUser(): void {
    this.newUser = {role: UserRoles.User} as UserDTO;
    this.childModal.show();
  }

  async addNewUser(): Promise<void> {
    try {
      await this.userSettings.createUser(this.newUser);
      await this.getUsersList();
      this.childModal.hide();
    } catch (e) {
      const err: ErrorDTO = e;
      this.notification.error(err.message + ', ' + err.details, $localize`User creation error!`);
    }
  }

  async updateRole(user: UserDTO): Promise<void> {
    await this.userSettings.updateRole(user);
    await this.getUsersList();
    this.childModal.hide();
  }

  async deleteUser(user: UserDTO): Promise<void> {
    await this.userSettings.deleteUser(user);
    await this.getUsersList();
    this.childModal.hide();
  }

  private async getSettings(): Promise<void> {
    this.enabled = await this.userSettings.getSettings();
  }

  private async getUsersList(): Promise<void> {
    try {
      this.users = await this.userSettings.getUsers();
    } catch (err) {
      this.users = [];
      if ((err as ErrorDTO).code !== ErrorCodes.USER_MANAGEMENT_DISABLED) {
        throw err;
      }
    }
  }
}



