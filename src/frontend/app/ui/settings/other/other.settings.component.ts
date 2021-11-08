import {Component, OnChanges} from '@angular/core';
import {SettingsComponentDirective} from '../_abstract/abstract.settings.component';
import {AuthenticationService} from '../../../model/network/authentication.service';
import {NavigationService} from '../../../model/navigation.service';
import {NotificationService} from '../../../model/notification.service';
import {OtherSettingsService} from './other.settings.service';
import {OtherConfigDTO} from '../../../../../common/entities/settings/OtherConfigDTO';
import {Utils} from '../../../../../common/Utils';
import {SortingMethods} from '../../../../../common/entities/SortingMethods';
import {StringifySortingMethod} from '../../../pipes/StringifySortingMethod';

@Component({
  selector: 'app-settings-other',
  templateUrl: './other.settings.component.html',
  styleUrls: ['./other.settings.component.css',
    '../_abstract/abstract.settings.component.css'],
  providers: [OtherSettingsService],
})
export class OtherSettingsComponent extends SettingsComponentDirective<OtherConfigDTO> implements OnChanges {


  types: { key: number; value: string }[] = [];
  threads: { key: number, value: string }[] = [{key: 0, value: 'auto'}].concat(Utils.createRange(1, 100)
    .map(v => ({key: v, value: '' + v})));
  sortingMap: any;

  constructor(authService: AuthenticationService,
              navigation: NavigationService,
              settingsService: OtherSettingsService,
              notification: NotificationService,
              private formatter: StringifySortingMethod) {
    super($localize`Other`, authService, navigation, settingsService, notification, s => ({
      Server: s.Server.Threading,
      Client: s.Client.Other
    }));
    this.sortingMap = (v: { key: number; value: string }) => {
      v.value = this.formatter.transform(v.key);
      return v;
    };
    this.types = Utils.enumToArray(SortingMethods);
    this.hasAvailableSettings = !this.simplifiedMode;
  }

  ngOnChanges(): void {
    this.hasAvailableSettings = !this.simplifiedMode;
  }


  public async save(): Promise<boolean> {
    const val = await super.save();
    if (val === true) {

      this.notification.info($localize`Restart the server to apply the new settings`, $localize`Info`);
    }
    return val;
  }
}



