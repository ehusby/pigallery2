import {Component} from '@angular/core';
import {SettingsComponentDirective} from '../_abstract/abstract.settings.component';
import {AuthenticationService} from '../../../model/network/authentication.service';
import {NavigationService} from '../../../model/navigation.service';
import {NotificationService} from '../../../model/notification.service';
import {BasicSettingsService} from './basic.settings.service';
import {BasicConfigDTO} from '../../../../../common/entities/settings/BasicConfigDTO';

@Component({
  selector: 'app-settings-basic',
  templateUrl: './basic.settings.component.html',
  styleUrls: ['./basic.settings.component.css',
    '../_abstract/abstract.settings.component.css'],
  providers: [BasicSettingsService],
})
export class BasicSettingsComponent extends SettingsComponentDirective<BasicConfigDTO> {

  urlPlaceholder = location.origin;
  urlBaseChanged = false;
  urlError = false;

  constructor(authService: AuthenticationService,
              navigation: NavigationService,
              settingsService: BasicSettingsService,
              notification: NotificationService) {
    super($localize`Basic`, authService, navigation, settingsService, notification, s => ({
      port: s.Server.port,
      host: s.Server.host,
      imagesFolder: s.Server.Media.folder,
      tempFolder: s.Server.Media.tempFolder,
      applicationTitle: s.Client.applicationTitle,
      publicUrl: s.Client.publicUrl,
      urlBase: s.Client.urlBase
    }));
    this.checkUrlError();
  }

  public async save(): Promise<boolean> {
    const val = await super.save();
    if (val === true) {
      this.notification.info($localize`Restart the server to apply the new settings`);
    }
    return val;
  }

  calcBaseUrl(): string {
    const url = this.states.publicUrl.value.replace(new RegExp('\\\\', 'g'), '/')
      .replace(new RegExp('http://', 'g'), '')
      .replace(new RegExp('https://', 'g'), '');
    if (url.indexOf('/') !== -1) {
      return url.substring(url.indexOf('/'));
    }
    return '';

  }

  checkUrlError(): void {
    this.urlError = this.states.urlBase.value !== this.calcBaseUrl();
  }

  onUrlChanged(): void {
    if (this.urlBaseChanged === false) {
      this.states.urlBase.value = this.calcBaseUrl();
    } else {
      this.checkUrlError();
    }

  }

  onUrlBaseChanged = () => {
    this.urlBaseChanged = true;

    this.checkUrlError();
  }

}



