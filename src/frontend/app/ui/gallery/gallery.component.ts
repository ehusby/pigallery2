import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AuthenticationService} from '../../model/network/authentication.service';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {GalleryService} from './gallery.service';
import {GalleryGridComponent} from './grid/grid.gallery.component';
import {Config} from '../../../../common/config/public/Config';
import {ParentDirectoryDTO, SubDirectoryDTO} from '../../../../common/entities/DirectoryDTO';
import {SearchResultDTO} from '../../../../common/entities/SearchResultDTO';
import {ShareService} from './share.service';
import {NavigationService} from '../../model/navigation.service';
import {UserRoles} from '../../../../common/entities/UserDTO';
import {interval, Observable, Subscription} from 'rxjs';
import {ContentWrapper} from '../../../../common/entities/ConentWrapper';
import {PageHelper} from '../../model/page.helper';
import {SortingMethods} from '../../../../common/entities/SortingMethods';
import {PhotoDTO} from '../../../../common/entities/PhotoDTO';
import {QueryParams} from '../../../../common/QueryParams';
import {SeededRandomService} from '../../model/seededRandom.service';
import {take} from 'rxjs/operators';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.css']
})
export class GalleryComponent implements OnInit, OnDestroy {

  @ViewChild(GalleryGridComponent, {static: false}) grid: GalleryGridComponent;

  public showSearchBar = false;
  public showShare = false;
  public showRandomPhotoBuilder = false;

  public directories: SubDirectoryDTO[] = [];
  public isPhotoWithLocation = false;
  public countDown: { day: number, hour: number, minute: number, second: number } = null;
  public readonly mapEnabled: boolean;
  private $counter: Observable<number>;
  private subscription: { [key: string]: Subscription } = {
    content: null,
    route: null,
    timer: null,
    sorting: null
  };

  constructor(public galleryService: GalleryService,
              private authService: AuthenticationService,
              private router: Router,
              private shareService: ShareService,
              private route: ActivatedRoute,
              private navigation: NavigationService,
              private rndService: SeededRandomService) {
    this.mapEnabled = Config.Client.Map.enabled;
    PageHelper.showScrollY();
  }


  updateTimer(t: number): void {
    if (this.shareService.sharingSubject.value == null) {
      return;
    }
    // if the timer is longer than 10 years, just do not show it
    if ((this.shareService.sharingSubject.value.expires - Date.now()) / 1000 / 86400 / 365 > 10) {
      return;
    }

    t = Math.floor((this.shareService.sharingSubject.value.expires - Date.now()) / 1000);
    this.countDown = ({} as any);
    this.countDown.day = Math.floor(t / 86400);
    t -= this.countDown.day * 86400;
    this.countDown.hour = Math.floor(t / 3600) % 24;
    t -= this.countDown.hour * 3600;
    this.countDown.minute = Math.floor(t / 60) % 60;
    t -= this.countDown.minute * 60;
    this.countDown.second = t % 60;
  }

  ngOnDestroy(): void {
    if (this.subscription.content !== null) {
      this.subscription.content.unsubscribe();
    }
    if (this.subscription.route !== null) {
      this.subscription.route.unsubscribe();
    }
    if (this.subscription.timer !== null) {
      this.subscription.timer.unsubscribe();
    }
    if (this.subscription.sorting !== null) {
      this.subscription.sorting.unsubscribe();
    }
  }

  async ngOnInit(): Promise<boolean> {
    await this.shareService.wait();
    if (!this.authService.isAuthenticated() &&
      (!this.shareService.isSharing() ||
        (this.shareService.isSharing() && Config.Client.Sharing.passwordProtected === true))) {

      return this.navigation.toLogin();
    }
    this.showSearchBar = Config.Client.Search.enabled && this.authService.canSearch();
    this.showShare = Config.Client.Sharing.enabled && this.authService.isAuthorized(UserRoles.User);
    this.showRandomPhotoBuilder = Config.Client.RandomPhoto.enabled && this.authService.isAuthorized(UserRoles.User);
    this.subscription.content = this.galleryService.content.subscribe(this.onContentChange);
    this.subscription.route = this.route.params.subscribe(this.onRoute);

    if (this.shareService.isSharing()) {
      this.$counter = interval(1000);
      this.subscription.timer = this.$counter.subscribe((x): void => this.updateTimer(x));
    }

    this.subscription.sorting = this.galleryService.sorting.subscribe((): void => {
      this.sortDirectories();
    });

  }

  private onRoute = async (params: Params): Promise<void> => {
    const searchQuery = params[QueryParams.gallery.search.query];
    if (searchQuery) {

      this.galleryService.search(searchQuery).catch(console.error);

      return;
    }

    if (params[QueryParams.gallery.sharingKey_params] && params[QueryParams.gallery.sharingKey_params] !== '') {
      const sharing = await this.shareService.currentSharing.pipe(take(1)).toPromise();
      const qParams: { [key: string]: any } = {};
      qParams[QueryParams.gallery.sharingKey_query] = this.shareService.getSharingKey();
      this.router.navigate(['/gallery', sharing.path], {queryParams: qParams}).catch(console.error);
      return;
    }

    let directoryName = params[QueryParams.gallery.directory];
    directoryName = directoryName || '';

    this.galleryService.loadDirectory(directoryName);
  };

  private onContentChange = (content: ContentWrapper): void => {
    const tmp = (content.searchResult || content.directory || {
      directories: [],
      media: []
    }) as ParentDirectoryDTO | SearchResultDTO;
    this.directories = tmp.directories;
    this.sortDirectories();
    this.isPhotoWithLocation = false;

    for (const media of tmp.media as PhotoDTO[]) {
      if (media.metadata &&
        media.metadata.positionData &&
        media.metadata.positionData.GPSData &&
        media.metadata.positionData.GPSData.longitude
      ) {
        this.isPhotoWithLocation = true;
        break;
      }
    }
  };

  private collator = new Intl.Collator(undefined, {numeric: true});

  private sortDirectories(): void {
    if (!this.directories) {
      return;
    }
    switch (this.galleryService.sorting.value) {
      case SortingMethods.ascRating: // directories does not have rating
      case SortingMethods.ascName:
        this.directories.sort((a, b) => this.collator.compare(a.name, b.name));
        break;
      case SortingMethods.ascDate:
        if (Config.Client.Other.enableDirectorySortingByDate === true) {
          this.directories.sort((a, b) => a.lastModified - b.lastModified);
          break;
        }
        this.directories.sort((a, b) => this.collator.compare(a.name, b.name));
        break;
      case SortingMethods.descRating: // directories does not have rating
      case SortingMethods.descName:
        this.directories.sort((a, b) => this.collator.compare(b.name, a.name));
        break;
      case SortingMethods.descDate:
        if (Config.Client.Other.enableDirectorySortingByDate === true) {
          this.directories.sort((a, b) => b.lastModified - a.lastModified);
          break;
        }
        this.directories.sort((a, b) => this.collator.compare(b.name, a.name));
        break;
      case SortingMethods.random:
        this.rndService.setSeed(this.directories.length);
        this.directories.sort((a, b): number => {
          if (a.name.toLowerCase() < b.name.toLowerCase()) {
            return 1;
          }
          if (a.name.toLowerCase() > b.name.toLowerCase()) {
            return -1;
          }
          return 0;
        }).sort((): number => {
          return this.rndService.get() - 0.5;
        });
        break;

    }

  }
}
