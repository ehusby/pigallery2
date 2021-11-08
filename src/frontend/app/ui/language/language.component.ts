import {Component, Input} from '@angular/core';
import {Config} from '../../../../common/config/public/Config';
import {CookieNames} from '../../../../common/CookieNames';
import {CookieService} from 'ngx-cookie-service';

@Component({
  selector: 'app-language',
  templateUrl: './language.component.html',
  styleUrls: ['./language.component.css'],
})
export class LanguageComponent {

  @Input() isDark: boolean;
  languages: string[] = [];
  current: string = null;

  constructor(private cookieService: CookieService) {
    this.languages = Config.Client.languages;
    if (this.cookieService.get(CookieNames.lang) != null) {
      this.current = this.cookieService.get(CookieNames.lang);
    }
  }

}

