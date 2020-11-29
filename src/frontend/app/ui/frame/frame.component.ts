import {Component, ViewEncapsulation} from '@angular/core';
import {RouterLink} from '@angular/router';
import {AuthenticationService} from '../../model/network/authentication.service';
import {UserDTO, UserRoles} from '../../../../common/entities/UserDTO';
import {Config} from '../../../../common/config/public/Config';
import {BehaviorSubject} from 'rxjs';
import {NotificationService} from '../../model/notification.service';
import {QueryService} from '../../model/query.service';

@Component({
  selector: 'app-frame',
  templateUrl: './frame.component.html',
  styleUrls: ['./frame.component.css'],
  providers: [RouterLink],
  encapsulation: ViewEncapsulation.Emulated
})
export class FrameComponent {

  user: BehaviorSubject<UserDTO>;
  public readonly authenticationRequired = Config.Client.authenticationRequired;
  public readonly title = Config.Client.applicationTitle;
  collapsed = true;

  constructor(private _authService: AuthenticationService,
              public notificationService: NotificationService,
              public queryService: QueryService) {
    this.user = this._authService.user;
  }


  isAdmin() {
    return this.user.value && this.user.value.role >= UserRoles.Admin;
  }

  isFacesAvailable() {
    return Config.Client.Faces.enabled && this.user.value && this.user.value.role >= Config.Client.Faces.readAccessMinRole;
  }


  logout() {
    this._authService.logout();
  }
}

