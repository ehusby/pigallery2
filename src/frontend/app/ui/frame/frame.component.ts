import {Component, ViewEncapsulation} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
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

  public readonly user: BehaviorSubject<UserDTO>;
  public readonly authenticationRequired = Config.Client.authenticationRequired;
  public readonly title = Config.Client.applicationTitle;
  public collapsed = true;

  constructor(private authService: AuthenticationService,
              public notificationService: NotificationService,
              public queryService: QueryService,
              private router: Router) {
    this.user = this.authService.user;
  }


  isAdmin(): boolean {
    return this.user.value && this.user.value.role >= UserRoles.Admin;
  }

  isFacesAvailable(): boolean {
    return Config.Client.Faces.enabled && this.user.value && this.user.value.role >= Config.Client.Faces.readAccessMinRole;
  }

  isLinkActive(url: string): boolean {
    return this.router.url.startsWith(url);
  }

  logout(): void {
    this.authService.logout();
  }

  isAlbumsAvailable(): boolean {
    return Config.Client.Album.enabled;
  }
}

