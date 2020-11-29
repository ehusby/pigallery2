import {Injectable} from '@angular/core';
import {DirectoryDTO} from '../../../../common/entities/DirectoryDTO';
import {Utils} from '../../../../common/Utils';
import {Config} from '../../../../common/config/public/Config';
import {AutoCompleteItem, SearchTypes} from '../../../../common/entities/AutoCompleteItem';
import {SearchResultDTO} from '../../../../common/entities/SearchResultDTO';
import {MediaDTO} from '../../../../common/entities/MediaDTO';
import {SortingMethods} from '../../../../common/entities/SortingMethods';
import {VersionService} from '../../model/version.service';

interface CacheItem<T> {
  timestamp: number;
  item: T;
}

@Injectable()
export class GalleryCacheService {

  private static readonly CONTENT_PREFIX = 'content:';
  private static readonly AUTO_COMPLETE_PREFIX = 'autocomplete:';
  private static readonly INSTANT_SEARCH_PREFIX = 'instant_search:';
  private static readonly SEARCH_PREFIX = 'search:';
  private static readonly SORTING_PREFIX = 'sorting:';
  private static readonly SEARCH_TYPE_PREFIX = ':type:';
  private static readonly VERSION = 'version';

  constructor(private versionService: VersionService) {
    const onNewVersion = (ver: string) => {
      if (ver !== null &&
        localStorage.getItem(GalleryCacheService.VERSION) !== ver) {
        GalleryCacheService.deleteCache();
        localStorage.setItem(GalleryCacheService.VERSION, ver);
      }
    };
    this.versionService.version.subscribe(onNewVersion);
    onNewVersion(this.versionService.version.value);
  }

  private static loadCacheItem(key: string): SearchResultDTO {
    const tmp = localStorage.getItem(key);
    if (tmp != null) {
      const value: CacheItem<SearchResultDTO> = JSON.parse(tmp);
      if (value.timestamp < Date.now() - Config.Client.Search.instantSearchCacheTimeout) {
        localStorage.removeItem(key);
        return null;
      }
      return value.item;
    }

    return null;
  }

  private static deleteCache() {
    try {
      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        if (localStorage.key(i).startsWith(GalleryCacheService.CONTENT_PREFIX) ||
          localStorage.key(i).startsWith(GalleryCacheService.SEARCH_PREFIX) ||
          localStorage.key(i).startsWith(GalleryCacheService.INSTANT_SEARCH_PREFIX) ||
          localStorage.key(i).startsWith(GalleryCacheService.AUTO_COMPLETE_PREFIX)
        ) {
          toRemove.push(localStorage.key(i));
        }
      }

      for (let i = 0; i < toRemove.length; i++) {
        localStorage.removeItem(toRemove[i]);
      }
    } catch (e) {

    }
  }

  public getSorting(dir: DirectoryDTO): SortingMethods {
    const key = GalleryCacheService.SORTING_PREFIX + dir.path + '/' + dir.name;
    const tmp = localStorage.getItem(key);
    if (tmp != null) {
      return parseInt(tmp, 10);
    }
    return null;
  }

  public removeSorting(dir: DirectoryDTO) {
    try {
      const key = GalleryCacheService.SORTING_PREFIX + dir.path + '/' + dir.name;
      localStorage.removeItem(key);
    } catch (e) {
      this.reset();
      console.error(e);
    }
  }

  public setSorting(dir: DirectoryDTO, sorting: SortingMethods): SortingMethods {
    try {
      const key = GalleryCacheService.SORTING_PREFIX + dir.path + '/' + dir.name;
      localStorage.setItem(key, sorting.toString());
    } catch (e) {
      this.reset();
      console.error(e);
    }
    return null;
  }

  public getAutoComplete(text: string): AutoCompleteItem[] {
    if (Config.Client.Other.enableCache === false) {
      return null;
    }
    const key = GalleryCacheService.AUTO_COMPLETE_PREFIX + text;
    const tmp = localStorage.getItem(key);
    if (tmp != null) {
      const value: CacheItem<AutoCompleteItem[]> = JSON.parse(tmp);
      if (value.timestamp < Date.now() - Config.Client.Search.AutoComplete.cacheTimeout) {
        localStorage.removeItem(key);
        return null;
      }
      return value.item;
    }
    return null;
  }

  public setAutoComplete(text: string, items: Array<AutoCompleteItem>): void {
    if (Config.Client.Other.enableCache === false) {
      return;
    }
    const tmp: CacheItem<Array<AutoCompleteItem>> = {
      timestamp: Date.now(),
      item: items
    };
    try {
      localStorage.setItem(GalleryCacheService.AUTO_COMPLETE_PREFIX + text, JSON.stringify(tmp));
    } catch (e) {
      this.reset();
      console.error(e);
    }
  }

  public getInstantSearch(text: string): SearchResultDTO {
    if (Config.Client.Other.enableCache === false) {
      return null;
    }
    const key = GalleryCacheService.INSTANT_SEARCH_PREFIX + text;
    return GalleryCacheService.loadCacheItem(key);
  }

  public setInstantSearch(text: string, searchResult: SearchResultDTO): void {
    if (Config.Client.Other.enableCache === false) {
      return;
    }
    const tmp: CacheItem<SearchResultDTO> = {
      timestamp: Date.now(),
      item: searchResult
    };
    try {
      localStorage.setItem(GalleryCacheService.INSTANT_SEARCH_PREFIX + text, JSON.stringify(tmp));
    } catch (e) {
      this.reset();
      console.error(e);
    }
  }

  public getSearch(text: string, type?: SearchTypes): SearchResultDTO {
    if (Config.Client.Other.enableCache === false) {
      return null;
    }
    let key = GalleryCacheService.SEARCH_PREFIX + text;
    if (typeof type !== 'undefined' && type !== null) {
      key += GalleryCacheService.SEARCH_TYPE_PREFIX + type;
    }

    return GalleryCacheService.loadCacheItem(key);
  }

  public setSearch(text: string, type: SearchTypes, searchResult: SearchResultDTO): void {
    if (Config.Client.Other.enableCache === false) {
      return;
    }
    const tmp: CacheItem<SearchResultDTO> = {
      timestamp: Date.now(),
      item: searchResult
    };
    let key = GalleryCacheService.SEARCH_PREFIX + text;
    if (typeof type !== 'undefined' && type !== null) {
      key += GalleryCacheService.SEARCH_TYPE_PREFIX + type;
    }
    try {
      localStorage.setItem(key, JSON.stringify(tmp));
    } catch (e) {
      this.reset();
      console.error(e);
    }
  }

  public getDirectory(directoryName: string): DirectoryDTO {
    if (Config.Client.Other.enableCache === false) {
      return null;
    }
    try {
      const value = localStorage.getItem(GalleryCacheService.CONTENT_PREFIX + Utils.concatUrls(directoryName));
      if (value != null) {
        const directory: DirectoryDTO = JSON.parse(value);

        DirectoryDTO.addReferences(directory);
        return directory;
      }
    } catch (e) {
    }
    return null;
  }

  public setDirectory(directory: DirectoryDTO): void {
    if (Config.Client.Other.enableCache === false) {
      return;
    }

    const key = GalleryCacheService.CONTENT_PREFIX + Utils.concatUrls(directory.path, directory.name);
    if (directory.isPartial === true && localStorage.getItem(key)) {
      return;
    }

    try {
      // try to fit it
      localStorage.setItem(key, JSON.stringify(directory));
      directory.directories.forEach((dir: DirectoryDTO) => {
        const sub_key = GalleryCacheService.CONTENT_PREFIX + Utils.concatUrls(dir.path, dir.name);
        if (localStorage.getItem(sub_key) == null) { // don't override existing
          localStorage.setItem(sub_key, JSON.stringify(dir));
        }
      });
    } catch (e) {
      this.reset();
      console.error(e);
    }

  }

  /**
   * Update media state at cache too (Eg.: thumbnail rendered)
   * @param media
   */
  public mediaUpdated(media: MediaDTO): void {

    if (Config.Client.Other.enableCache === false) {
      return;
    }

    try {
      const directoryName = Utils.concatUrls(media.directory.path, media.directory.name);
      const value = localStorage.getItem(directoryName);
      if (value != null) {
        const directory: DirectoryDTO = JSON.parse(value);
        directory.media.forEach((p) => {
          if (p.name === media.name) {
            // update data
            p.metadata = media.metadata;
            p.readyThumbnails = media.readyThumbnails;

            // save changes
            localStorage.setItem(directoryName, JSON.stringify(directory));
            return;
          }
        });
      }
    } catch (e) {
      this.reset();
      console.error(e);
    }

  }

  private reset() {
    try {
      const currentUserStr = localStorage.getItem('currentUser');
      localStorage.clear();
      localStorage.setItem('currentUser', currentUserStr);
      localStorage.setItem(GalleryCacheService.VERSION, this.versionService.version.value);
    } catch (e) {

    }
  }

}
