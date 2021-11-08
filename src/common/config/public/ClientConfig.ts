/* tslint:disable:no-inferrable-types */
import 'reflect-metadata';
import {SortingMethods} from '../../entities/SortingMethods';
import {UserRoles} from '../../entities/UserDTO';
import {ConfigProperty, SubConfigClass} from 'typeconfig/common';


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
export class ClientSearchConfig {
  @ConfigProperty()
  enabled: boolean = true;
  @ConfigProperty({type: 'unsignedInt'})
  searchCacheTimeout: number = 1000 * 60 * 60;
  @ConfigProperty()
  AutoComplete: AutoCompleteConfig = new AutoCompleteConfig();
  @ConfigProperty({type: 'unsignedInt'})
  maxMediaResult: number = 10000;
  @ConfigProperty({description: 'Search returns also with directories, not just media'})
  listDirectories: boolean = false;
  @ConfigProperty({
    description: 'Search also returns with metafiles from directories that contain a media file of the matched search result'
  })
  listMetafiles: boolean = false;
  @ConfigProperty({type: 'unsignedInt'})
  maxDirectoryResult: number = 200;
}


@SubConfigClass()
export class ClientAlbumConfig {
  @ConfigProperty()
  enabled: boolean = true;
}

@SubConfigClass()
export class ClientSharingConfig {
  @ConfigProperty()
  enabled: boolean = true;
  @ConfigProperty()
  passwordProtected: boolean = true;
}

@SubConfigClass()
export class ClientRandomPhotoConfig {
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
export class ClientMapConfig {
  @ConfigProperty()
  enabled: boolean = true;
  @ConfigProperty({type: 'unsignedInt', description: 'Maximum number of markers to be shown on the map preview on the gallery page.'})
  maxPreviewMarkers: number = 50;
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
export class ClientThumbnailConfig {
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
export class ClientOtherConfig {
  @ConfigProperty()
  enableCache: boolean = true;
  @ConfigProperty()
  enableOnScrollRendering: boolean = true;
  @ConfigProperty({type: SortingMethods})
  defaultPhotoSortingMethod: SortingMethods = SortingMethods.ascDate;
  @ConfigProperty({description: 'If enabled directories will be sorted by date, like photos, otherwise by name. Directory date is the last modification time of that directory not the creation date of the oldest photo'})
  enableDirectorySortingByDate: boolean = false;
  @ConfigProperty()
  enableOnScrollThumbnailPrioritising: boolean = true;
  @ConfigProperty()
  NavBar: NavBarConfig = new NavBarConfig();
  @ConfigProperty()
  captionFirstNaming: boolean = false; // shows the caption instead of the filename in the photo grid
  @ConfigProperty()
  enableDownloadZip: boolean = false;
}

@SubConfigClass()
export class ClientVideoConfig {
  @ConfigProperty()
  enabled: boolean = true;
}

@SubConfigClass()
export class PhotoConvertingConfig {
  @ConfigProperty()
  enabled: boolean = true;
}

@SubConfigClass()
export class ClientPhotoConfig {
  @ConfigProperty()
  Converting: PhotoConvertingConfig = new PhotoConvertingConfig();
  @ConfigProperty({description: 'Enables loading the full resolution image on zoom in the ligthbox (preview).'})
  loadFullImageOnZoom: boolean = true;
}

@SubConfigClass()
export class ClientMediaConfig {
  @ConfigProperty()
  Thumbnail: ClientThumbnailConfig = new ClientThumbnailConfig();
  @ConfigProperty()
  Video: ClientVideoConfig = new ClientVideoConfig();
  @ConfigProperty()
  Photo: ClientPhotoConfig = new ClientPhotoConfig();
}

@SubConfigClass()
export class ClientMetaFileConfig {
  @ConfigProperty()
  enabled: boolean = true;
}

@SubConfigClass()
export class ClientFacesConfig {
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
export class ClientConfig {
  @ConfigProperty()
  applicationTitle: string = 'PiGallery 2';
  @ConfigProperty()
  publicUrl: string = '';
  @ConfigProperty()
  urlBase: string = '';
  @ConfigProperty()
  Search: ClientSearchConfig = new ClientSearchConfig();
  @ConfigProperty()
  Sharing: ClientSharingConfig = new ClientSharingConfig();
  @ConfigProperty()
  Album: ClientAlbumConfig = new ClientAlbumConfig();
  @ConfigProperty()
  Map: ClientMapConfig = new ClientMapConfig();
  @ConfigProperty()
  RandomPhoto: ClientRandomPhotoConfig = new ClientRandomPhotoConfig();
  @ConfigProperty()
  Other: ClientOtherConfig = new ClientOtherConfig();
  @ConfigProperty()
  authenticationRequired: boolean = true;
  @ConfigProperty({type: UserRoles})
  unAuthenticatedUserRole: UserRoles = UserRoles.Admin;
  @ConfigProperty({arrayType: 'string', volatile: true})
  languages: string[];
  @ConfigProperty()
  Media: ClientMediaConfig = new ClientMediaConfig();
  @ConfigProperty()
  MetaFile: ClientMetaFileConfig = new ClientMetaFileConfig();
  @ConfigProperty()
  Faces: ClientFacesConfig = new ClientFacesConfig();
}



