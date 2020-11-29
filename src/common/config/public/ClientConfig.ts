/* tslint:disable:no-inferrable-types */
import 'reflect-metadata';
import {SortingMethods} from '../../entities/SortingMethods';
import {UserRoles} from '../../entities/UserDTO';
import {ConfigProperty, SubConfigClass} from 'typeconfig/common';


export module ClientConfig {

  export enum MapProviders {
    OpenStreetMap = 1, Mapbox = 2, Custom = 3
  }

  @SubConfigClass()
  export class AutoCompleteConfig {
    @ConfigProperty()
    enabled: boolean = true;
    @ConfigProperty({type: 'unsignedInt'})
    maxItemsPerCategory: number = 5;
    @ConfigProperty({type: 'unsignedInt'})
    cacheTimeout: number = 1000 * 60 * 60;
  }

  @SubConfigClass()
  export class SearchConfig {
    @ConfigProperty()
    enabled: boolean = true;
    @ConfigProperty()
    instantSearchEnabled: boolean = true;
    @ConfigProperty({type: 'unsignedInt'})
    InstantSearchTimeout: number = 3000;
    @ConfigProperty({type: 'unsignedInt'})
    instantSearchCacheTimeout: number = 1000 * 60 * 60;
    @ConfigProperty({type: 'unsignedInt'})
    searchCacheTimeout: number = 1000 * 60 * 60;
    @ConfigProperty()
    AutoComplete: AutoCompleteConfig = new AutoCompleteConfig();
    @ConfigProperty({type: 'unsignedInt'})
    maxMediaResult: number = 2000;
    @ConfigProperty({type: 'unsignedInt'})
    maxDirectoryResult: number = 200;
  }

  @SubConfigClass()
  export class SharingConfig {
    @ConfigProperty()
    enabled: boolean = true;
    @ConfigProperty()
    passwordProtected: boolean = true;
  }

  @SubConfigClass()
  export class RandomPhotoConfig {
    @ConfigProperty()
    enabled: boolean = true;
  }

  @SubConfigClass()
  export class MapLayers {
    @ConfigProperty()
    name: string = 'street';
    @ConfigProperty()
    url: string = '';
  }

  @SubConfigClass()
  export class MapConfig {
    @ConfigProperty()
    enabled: boolean = true;
    @ConfigProperty()
    useImageMarkers: boolean = true;
    @ConfigProperty({type: MapProviders})
    mapProvider: MapProviders = MapProviders.OpenStreetMap;
    @ConfigProperty()
    mapboxAccessToken: string = '';
    @ConfigProperty({arrayType: MapLayers})
    customLayers: MapLayers[] = [new MapLayers()];
  }

  @SubConfigClass()
  export class ThumbnailConfig {
    @ConfigProperty({type: 'unsignedInt', max: 100})
    iconSize: number = 45;
    @ConfigProperty({type: 'unsignedInt'})
    personThumbnailSize: number = 200;
    @ConfigProperty({arrayType: 'unsignedInt'})
    thumbnailSizes: number[] = [240, 480];
    @ConfigProperty({volatile: true})
    concurrentThumbnailGenerations: number = 1;
  }

  @SubConfigClass()
  export class NavBarConfig {
    @ConfigProperty()
    showItemCount: boolean = true;
  }

  @SubConfigClass()
  export class OtherConfig {
    @ConfigProperty()
    enableCache: boolean = true;
    @ConfigProperty()
    enableOnScrollRendering: boolean = true;
    @ConfigProperty({type: SortingMethods})
    defaultPhotoSortingMethod: SortingMethods = SortingMethods.ascDate;
    @ConfigProperty()
    enableOnScrollThumbnailPrioritising: boolean = true;
    @ConfigProperty()
    NavBar: NavBarConfig = new NavBarConfig();
    @ConfigProperty()
    captionFirstNaming: boolean = false; // shows the caption instead of the filename in the photo grid
  }

  @SubConfigClass()
  export class VideoConfig {
    @ConfigProperty()
    enabled: boolean = true;
  }

  @SubConfigClass()
  export class PhotoConvertingConfig {
    @ConfigProperty()
    enabled: boolean = true;
  }

  @SubConfigClass()
  export class PhotoConfig {
    @ConfigProperty()
    Converting: PhotoConvertingConfig = new PhotoConvertingConfig();
  }

  @SubConfigClass()
  export class MediaConfig {
    @ConfigProperty()
    Thumbnail: ThumbnailConfig = new ThumbnailConfig();
    @ConfigProperty()
    Video: VideoConfig = new VideoConfig();
    @ConfigProperty()
    Photo: PhotoConfig = new PhotoConfig();
  }

  @SubConfigClass()
  export class MetaFileConfig {
    @ConfigProperty()
    enabled: boolean = true;
  }

  @SubConfigClass()
  export class FacesConfig {
    @ConfigProperty()
    enabled: boolean = true;
    @ConfigProperty()
    keywordsToPersons: boolean = true;
    @ConfigProperty({type: UserRoles})
    writeAccessMinRole: UserRoles = UserRoles.Admin;
    @ConfigProperty({type: UserRoles})
    readAccessMinRole: UserRoles = UserRoles.User;
  }

  @SubConfigClass()
  export class Config {
    @ConfigProperty()
    applicationTitle: string = 'PiGallery 2';
    @ConfigProperty()
    publicUrl: string = '';
    @ConfigProperty()
    urlBase: string = '';
    @ConfigProperty()
    Search: SearchConfig = new SearchConfig();
    @ConfigProperty()
    Sharing: SharingConfig = new SharingConfig();
    @ConfigProperty()
    Map: MapConfig = new MapConfig();
    @ConfigProperty()
    RandomPhoto: RandomPhotoConfig = new RandomPhotoConfig();
    @ConfigProperty()
    Other: OtherConfig = new OtherConfig();
    @ConfigProperty()
    authenticationRequired: boolean = true;
    @ConfigProperty({type: UserRoles})
    unAuthenticatedUserRole: UserRoles = UserRoles.Admin;
    @ConfigProperty({arrayType: 'string', volatile: true})
    languages: string[];
    @ConfigProperty()
    Media: MediaConfig = new MediaConfig();
    @ConfigProperty()
    MetaFile: MetaFileConfig = new MetaFileConfig();
    @ConfigProperty()
    Faces: FacesConfig = new FacesConfig();
  }

}

