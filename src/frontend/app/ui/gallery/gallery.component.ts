import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AuthenticationService} from '../../model/network/authentication.service';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {GalleryService} from './gallery.service';
import {GalleryGridComponent} from './grid/grid.gallery.component';
import {SearchTypes} from '../../../../common/entities/AutoCompleteItem';
import {Config} from '../../../../common/config/public/Config';
import {DirectoryDTO} from '../../../../common/entities/DirectoryDTO';
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
import {FileDTO} from '../../../../common/entities/FileDTO';

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

  public directories: DirectoryDTO[] = [];
  public isPhotoWithLocation = false;
  public countDown: { day: number, hour: number, minute: number, second: number } = null;
  public readonly mapEnabled: boolean;
  readonly SearchTypes: typeof SearchTypes;
  private $counter: Observable<number>;
  private subscription: { [key: string]: Subscription } = {
    content: null,
    route: null,
    timer: null,
    sorting: null
  };

  constructor(public _galleryService: GalleryService,
              private _authService: AuthenticationService,
              private _router: Router,
              private shareService: ShareService,
              private _route: ActivatedRoute,
              private _navigation: NavigationService,
              private rndService: SeededRandomService) {
    this.mapEnabled = Config.Client.Map.enabled;
    this.SearchTypes = SearchTypes;
    PageHelper.showScrollY();
  }


  updateTimer(t: number) {
    if (this.shareService.sharingSubject.value == null) {
      return;
    }
    t = Math.floor((this.shareService.sharingSubject.value.expires - Date.now()) / 1000);
    this.countDown = <any>{};
    this.countDown.day = Math.floor(t / 86400);
    t -= this.countDown.day * 86400;
    this.countDown.hour = Math.floor(t / 3600) % 24;
    t -= this.countDown.hour * 3600;
    this.countDown.minute = Math.floor(t / 60) % 60;
    t -= this.countDown.minute * 60;
    this.countDown.second = t % 60;
  }

  ngOnDestroy() {
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

  async ngOnInit() {
    await this.shareService.wait();
    if (!this._authService.isAuthenticated() &&
      (!this.shareService.isSharing() ||
        (this.shareService.isSharing() && Config.Client.Sharing.passwordProtected === true))) {

      return this._navigation.toLogin();
    }
    this.showSearchBar = Config.Client.Search.enabled && this._authService.isAuthorized(UserRoles.Guest);
    this.showShare = Config.Client.Sharing.enabled && this._authService.isAuthorized(UserRoles.User);
    this.showRandomPhotoBuilder = Config.Client.RandomPhoto.enabled && this._authService.isAuthorized(UserRoles.Guest);
    this.subscription.content = this._galleryService.content.subscribe(this.onContentChange);
    this.subscription.route = this._route.params.subscribe(this.onRoute);

    if (this.shareService.isSharing()) {
      this.$counter = interval(1000);
      this.subscription.timer = this.$counter.subscribe((x) => this.updateTimer(x));
    }

    this.subscription.sorting = this._galleryService.sorting.subscribe(() => {
      this.sortDirectories();
    });

  }

  private onRoute = async (params: Params) => {
    const searchText = params[QueryParams.gallery.searchText];
    if (searchText && searchText !== '') {
      const typeString: string = params[QueryParams.gallery.search.type];
      let type: SearchTypes = null;
      if (typeString && typeString !== '') {
        type = <any>SearchTypes[<any>typeString];
      }

      this._galleryService.search(searchText, type).catch(console.error);

      return;
    }

    if (params[QueryParams.gallery.sharingKey_params] && params[QueryParams.gallery.sharingKey_params] !== '') {
      const sharing = await this.shareService.currentSharing.pipe(take(1)).toPromise();
      const qParams: { [key: string]: any } = {};
      qParams[QueryParams.gallery.sharingKey_query] = this.shareService.getSharingKey();
      this._router.navigate(['/gallery', sharing.path], {queryParams: qParams}).catch(console.error);
      return;
    }

    let directoryName = params[QueryParams.gallery.directory];
    directoryName = directoryName || '';

    this._galleryService.loadDirectory(directoryName);


  };

  private onContentChange = (content: ContentWrapper) => {
    const tmp = <DirectoryDTO | SearchResultDTO>(content.searchResult || content.directory || {
      directories: [],
      media: []
    });
    this.directories = tmp.directories;
    this.sortDirectories();
    this.isPhotoWithLocation = false;

    for (let i = 0; i < tmp.media.length; i++) {
      if ((<PhotoDTO>tmp.media[i]).metadata &&
        (<PhotoDTO>tmp.media[i]).metadata.positionData &&
        (<PhotoDTO>tmp.media[i]).metadata.positionData.GPSData &&
        (<PhotoDTO>tmp.media[i]).metadata.positionData.GPSData.longitude
      ) {
        this.isPhotoWithLocation = true;
        break;
      }
    }
  };

  private sortDirectories() {
    if (!this.directories) {
      return;
    }
    switch (this._galleryService.sorting.value) {
      case SortingMethods.ascName:
      case SortingMethods.ascDate:
        this.directories.sort((a: DirectoryDTO, b: DirectoryDTO) => {
          if (a.name.toLowerCase() < b.name.toLowerCase()) {
            return -1;
          }
          if (a.name.toLowerCase() > b.name.toLowerCase()) {
            return 1;
          }
          return 0;
        });
        break;
      case SortingMethods.descName:
      case SortingMethods.descDate:
        this.directories.sort((a: DirectoryDTO, b: DirectoryDTO) => {
          if (a.name.toLowerCase() < b.name.toLowerCase()) {
            return 1;
          }
          if (a.name.toLowerCase() > b.name.toLowerCase()) {
            return -1;
          }
          return 0;
        });
        break;
      case SortingMethods.random:
        this.rndService.setSeed(this.directories.length);
        this.directories.sort((a: DirectoryDTO, b: DirectoryDTO) => {
          if (a.name.toLowerCase() < b.name.toLowerCase()) {
            return 1;
          }
          if (a.name.toLowerCase() > b.name.toLowerCase()) {
            return -1;
          }
          return 0;
        }).sort(() => {
          return this.rndService.get() - 0.5;
        });
        break;

    }

  }
}

