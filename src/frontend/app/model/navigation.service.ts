import {Injectable} from '@angular/core';

import {Router} from '@angular/router';
import {ShareService} from '../ui/gallery/share.service';

@Injectable()
export class NavigationService {


  constructor(private router: Router,
              private shareService: ShareService) {

  }

  public isLoginPage(): boolean {
    return this.router.isActive('login', true) || this.router.isActive('shareLogin', true);
  }

  public async toLogin(): Promise<boolean> {
    await this.shareService.wait();
    if (this.shareService.isSharing()) {
      return this.router.navigate(['shareLogin'], {queryParams: {sk: this.shareService.getSharingKey()}});
    } else {
      return this.router.navigate(['login']);
    }
  }

  public async toGallery(): Promise<boolean> {
    await this.shareService.wait();
    if (this.shareService.isSharing()) {
      return this.router.navigate(['share', this.shareService.getSharingKey()]);
    } else {
      return this.router.navigate(['gallery', '']);
    }
  }

  public async search(searchText: string): Promise<boolean> {
    return this.router.navigate(['search', searchText]);
  }
}
