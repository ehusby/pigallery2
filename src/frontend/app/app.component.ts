import {Component, OnDestroy, OnInit} from '@angular/core';
import {AuthenticationService} from './model/network/authentication.service';
import {Router} from '@angular/router';
import {Config} from '../../common/config/public/Config';
import {Title} from '@angular/platform-browser';
import {ShareService} from './ui/gallery/share.service';
import 'hammerjs';
import {Subscription} from 'rxjs';
import {QueryParams} from '../../common/QueryParams';

@Component({
  selector: 'app-pi-gallery2',
  template: `
    <router-outlet></router-outlet>`
})
export class AppComponent implements OnInit, OnDestroy {

  private subscription: Subscription = null;

  constructor(private router: Router,
              private authenticationService: AuthenticationService,
              private shareService: ShareService,
              private title: Title) {
  }

  async ngOnInit(): Promise<void> {
    this.title.setTitle(Config.Client.applicationTitle);
    await this.shareService.wait();
    this.subscription = this.authenticationService.user.subscribe(() => {
      if (this.authenticationService.isAuthenticated()) {
        if (this.isLoginPage()) {
          return this.toGallery();
        }
      } else {
        if (!this.isLoginPage()) {
          return this.toLogin();
        }
      }

    });

  }

  ngOnDestroy(): void {
    if (this.subscription != null) {
      this.subscription.unsubscribe();
    }
  }

  private isLoginPage(): boolean {
    return this.router.isActive('login', true) || this.router.isActive('shareLogin', false);
  }

  private async toLogin(): Promise<void> {
    if (this.shareService.isSharing()) {
      const q: any = {};
      q[QueryParams.gallery.sharingKey_query] = this.shareService.getSharingKey();
      await this.router.navigate(['shareLogin'], {queryParams: q});
      return;
    } else {
      await this.router.navigate(['login']);
      return;
    }
  }

  private async toGallery(): Promise<void> {
    if (this.shareService.isSharing()) {
      await this.router.navigate(['share', this.shareService.getSharingKey()]);
      return;
    } else {
      await this.router.navigate(['gallery', '']);
      return;
    }
  }
}
