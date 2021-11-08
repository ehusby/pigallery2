import {Injectable} from '@angular/core';
import {DirectoryDTOUtils, DirectoryPathDTO, ParentDirectoryDTO} from '../../../../common/entities/DirectoryDTO';
import {Utils} from '../../../../common/Utils';
import {Config} from '../../../../common/config/public/Config';
import {IAutoCompleteItem} from '../../../../common/entities/AutoCompleteItem';
import {SearchResultDTO} from '../../../../common/entities/SearchResultDTO';
import {MediaDTO} from '../../../../common/entities/MediaDTO';
import {SortingMethods} from '../../../../common/entities/SortingMethods';
import {VersionService} from '../../model/version.service';
import {SearchQueryDTO, SearchQueryTypes} from '../../../../common/entities/SearchQueryDTO';

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
  private static readonly VERSION = 'version';

  constructor(private versionService: VersionService) {

    // if it was a forced reload not a navigation, clear cache
    if (GalleryCacheService.wasAReload()) {
      GalleryCacheService.deleteCache();
    }

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

  private static wasAReload(): boolean {
    const perfEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming [];
    return perfEntries && perfEntries[0] && perfEntries[0].type === 'reload';
  }

  private static loadCacheItem(key: string): SearchResultDTO {
    const tmp = localStorage.getItem(key);
    if (tmp != null) {
      const value: CacheItem<SearchResultDTO> = JSON.parse(tmp);
      if (value.timestamp < Date.now() - Config.Client.Search.searchCacheTimeout) {
        localStorage.removeItem(key);
        return null;
      }
      return value.item;
    }

    return null;
  }

  private static deleteCache(): void {
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

      for (const item of toRemove) {
        localStorage.removeItem(item);
      }
    } catch (e) {

    }
  }

  public getSorting(dir: DirectoryPathDTO): SortingMethods {
    const key = GalleryCacheService.SORTING_PREFIX + dir.path + '/' + dir.name;
    const tmp = localStorage.getItem(key);
    if (tmp != null) {
      return parseInt(tmp, 10);
    }
    return null;
  }

  public removeSorting(dir: DirectoryPathDTO): void {
    try {
      const key = GalleryCacheService.SORTING_PREFIX + dir.path + '/' + dir.name;
      localStorage.removeItem(key);
    } catch (e) {
      this.reset();
      console.error(e);
    }
  }

  public setSorting(dir: DirectoryPathDTO, sorting: SortingMethods): SortingMethods {
    try {
      const key = GalleryCacheService.SORTING_PREFIX + dir.path + '/' + dir.name;
      localStorage.setItem(key, sorting.toString());
    } catch (e) {
      this.reset();
      console.error(e);
    }
    return null;
  }

  public getAutoComplete(text: string, type: SearchQueryTypes): IAutoCompleteItem[] {
    if (Config.Client.Other.enableCache === false) {
      return null;
    }
    const key = GalleryCacheService.AUTO_COMPLETE_PREFIX + text + (type ? '_' + type : '');
    const tmp = localStorage.getItem(key);
    if (tmp != null) {
      const value: CacheItem<IAutoCompleteItem[]> = JSON.parse(tmp);
      if (value.timestamp < Date.now() - Config.Client.Search.AutoComplete.cacheTimeout) {
        localStorage.removeItem(key);
        return null;
      }
      return value.item;
    }
    return null;
  }

  public setAutoComplete(text: string, type: SearchQueryTypes, items: Array<IAutoCompleteItem>): void {
    if (Config.Client.Other.enableCache === false) {
      return;
    }
    const key = GalleryCacheService.AUTO_COMPLETE_PREFIX + text + (type ? '_' + type : '');
    const tmp: CacheItem<Array<IAutoCompleteItem>> = {
      timestamp: Date.now(),
      item: items
    };
    try {
      localStorage.setItem(key, JSON.stringify(tmp));
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

  public getSearch(query: SearchQueryDTO): SearchResultDTO {
    if (Config.Client.Other.enableCache === false) {
      return null;
    }
    const key = GalleryCacheService.SEARCH_PREFIX + JSON.stringify(query);
    return GalleryCacheService.loadCacheItem(key);
  }

  public setSearch(query: SearchQueryDTO, searchResult: SearchResultDTO): void {
    if (Config.Client.Other.enableCache === false) {
      return;
    }
    const tmp: CacheItem<SearchResultDTO> = {
      timestamp: Date.now(),
      item: searchResult
    };
    const key = GalleryCacheService.SEARCH_PREFIX + JSON.stringify(query);
    try {
      localStorage.setItem(key, JSON.stringify(tmp));
    } catch (e) {
      this.reset();
      console.error(e);
    }
  }

  public getDirectory(directoryName: string): ParentDirectoryDTO {
    if (Config.Client.Other.enableCache === false) {
      return null;
    }
    try {
      const value = localStorage.getItem(GalleryCacheService.CONTENT_PREFIX + Utils.concatUrls(directoryName));
      if (value != null) {
        const directory: ParentDirectoryDTO = JSON.parse(value);

        DirectoryDTOUtils.unpackDirectory(directory);
        return directory;
      }
    } catch (e) {
    }
    return null;
  }

  public setDirectory(directory: ParentDirectoryDTO): void {
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
      directory.directories.forEach((dir) => {
        const subKey = GalleryCacheService.CONTENT_PREFIX + Utils.concatUrls(dir.path, dir.name);
        if (localStorage.getItem(subKey) == null) { // don't override existing
          localStorage.setItem(subKey, JSON.stringify(dir));
        }
      });
    } catch (e) {
      this.reset();
      console.error(e);
    }

  }

  /**
   * Update media state at cache too (Eg.: thumbnail rendered)
   * @param media: MediaBaseDTO
   */
  public mediaUpdated(media: MediaDTO): void {

    if (Config.Client.Other.enableCache === false) {
      return;
    }

    try {
      const directoryName = Utils.concatUrls(media.directory.path, media.directory.name);
      const value = localStorage.getItem(directoryName);
      if (value != null) {
        const directory: ParentDirectoryDTO = JSON.parse(value);
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

  private reset(): void {
    try {
      const currentUserStr = localStorage.getItem('currentUser');
      localStorage.clear();
      localStorage.setItem('currentUser', currentUserStr);
      localStorage.setItem(GalleryCacheService.VERSION, this.versionService.version.value);
    } catch (e) {

    }
  }

}
