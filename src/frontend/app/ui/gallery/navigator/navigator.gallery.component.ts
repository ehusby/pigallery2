import {Component, Input, OnChanges} from '@angular/core';
import {ParentDirectoryDTO} from '../../../../../common/entities/DirectoryDTO';
import {RouterLink} from '@angular/router';
import {UserDTOUtils} from '../../../../../common/entities/UserDTO';
import {AuthenticationService} from '../../../model/network/authentication.service';
import {QueryService} from '../../../model/query.service';
import {GalleryService} from '../gallery.service';
import {Utils} from '../../../../../common/Utils';
import {SortingMethods} from '../../../../../common/entities/SortingMethods';
import {Config} from '../../../../../common/config/public/Config';
import {SearchResultDTO} from '../../../../../common/entities/SearchResultDTO';
import {SearchQueryTypes} from '../../../../../common/entities/SearchQueryDTO';

@Component({
  selector: 'app-gallery-navbar',
  styleUrls: ['./navigator.gallery.component.css'],
  templateUrl: './navigator.gallery.component.html',
  providers: [RouterLink],
})
export class GalleryNavigatorComponent implements OnChanges {
  @Input() directory: ParentDirectoryDTO;
  @Input() searchResult: SearchResultDTO;

  routes: NavigatorPath[] = [];
  SortingMethods = SortingMethods;
  sortingMethodsType: { key: number; value: string }[] = [];
  config = Config;
  DefaultSorting = Config.Client.Other.defaultPhotoSortingMethod;
  readonly SearchQueryTypes = SearchQueryTypes;
  private readonly RootFolderName: string;

  constructor(private authService: AuthenticationService,
              public queryService: QueryService,
              public galleryService: GalleryService) {
    this.sortingMethodsType = Utils.enumToArray(SortingMethods);
    this.RootFolderName = $localize`Images`;
  }

  get ItemCount(): number {
    return this.directory ? this.directory.mediaCount : this.searchResult.media.length;
  }

  ngOnChanges(): void {
    this.getPath();
    this.DefaultSorting = this.galleryService.getDefaultSorting(this.directory);
  }

  getPath(): any {
    if (!this.directory) {
      return [];
    }

    const path = this.directory.path.replace(new RegExp('\\\\', 'g'), '/');

    const dirs = path.split('/');
    dirs.push(this.directory.name);

    // removing empty strings
    for (let i = 0; i < dirs.length; i++) {
      if (!dirs[i] || 0 === dirs[i].length || '.' === dirs[i]) {
        dirs.splice(i, 1);
        i--;
      }
    }

    const user = this.authService.user.value;
    const arr: NavigatorPath[] = [];

    // create root link
    if (dirs.length === 0) {
      arr.push({name: this.RootFolderName, route: null});
    } else {
      arr.push({name: this.RootFolderName, route: UserDTOUtils.isDirectoryPathAvailable('/', user.permissions) ? '/' : null});
    }

    // create rest navigation
    dirs.forEach((name, index) => {
      const route = dirs.slice(0, dirs.indexOf(name) + 1).join('/');
      if (dirs.length - 1 === index) {
        arr.push({name, route: null});
      } else {
        arr.push({name, route: UserDTOUtils.isDirectoryPathAvailable(route, user.permissions) ? route : null});
      }
    });


    this.routes = arr;


  }

  setSorting(sorting: SortingMethods): void {
    this.galleryService.setSorting(sorting);
  }

  getDownloadZipLink(): string {
    let queryParams = '';
    Object.entries(this.queryService.getParams()).forEach(e => {
      queryParams += e[0] + '=' + e[1];
    });
    return Utils.concatUrls(Config.Client.urlBase,
      '/api/gallery/zip/',
      this.getDirectoryPath(), '?' + queryParams);
  }

  getDirectoryPath(): string {
    return Utils.concatUrls(this.directory.path, this.directory.name);
  }

}

interface NavigatorPath {
  name: string;
  route: string;
}

