import {Injectable, NgModule} from '@angular/core';
import {BrowserModule, HAMMER_GESTURE_CONFIG, HammerGestureConfig, HammerModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {AppComponent} from './app.component';
import {UserService} from './model/network/user.service';
import {GalleryService} from './ui/gallery/gallery.service';
import {NetworkService} from './model/network/network.service';
import {GalleryCacheService} from './ui/gallery/cache.gallery.service';
import {FullScreenService} from './ui/gallery/fullscreen.service';
import {AuthenticationService} from './model/network/authentication.service';
import {UserMangerSettingsComponent} from './ui/settings/usermanager/usermanager.settings.component';
import {FrameComponent} from './ui/frame/frame.component';
import {LeafletModule} from '@asymmetrik/ngx-leaflet';
import {LoadingBarModule} from '@ngx-loading-bar/core';
import {GalleryLightboxMediaComponent} from './ui/gallery/lightbox/media/media.lightbox.gallery.component';
import {GalleryPhotoLoadingComponent} from './ui/gallery/grid/photo/loading/loading.photo.grid.gallery.component';
import {GalleryNavigatorComponent} from './ui/gallery/navigator/navigator.gallery.component';
import {GallerySearchComponent} from './ui/gallery/search/search.gallery.component';
import {GalleryLightboxComponent} from './ui/gallery/lightbox/lightbox.gallery.component';
import {GalleryDirectoryComponent} from './ui/gallery/directories/directory/directory.gallery.component';
import {GalleryGridComponent} from './ui/gallery/grid/grid.gallery.component';
import {GalleryPhotoComponent} from './ui/gallery/grid/photo/photo.grid.gallery.component';
import {LoginComponent} from './ui/login/login.component';
import {AdminComponent} from './ui/admin/admin.component';
import {GalleryComponent} from './ui/gallery/gallery.component';
import {StringifyRole} from './pipes/StringifyRolePipe';
import {GPXFilesFilterPipe} from './pipes/GPXFilesFilterPipe';
import {GalleryMapComponent} from './ui/gallery/map/map.gallery.component';
import {GalleryMapLightboxComponent} from './ui/gallery/map/lightbox/lightbox.map.gallery.component';
import {ThumbnailManagerService} from './ui/gallery/thumbnailManager.service';
import {OverlayService} from './ui/gallery/overlay.service';
import {GalleryShareComponent} from './ui/gallery/share/share.gallery.component';
import {ShareLoginComponent} from './ui/sharelogin/share-login.component';
import {ShareService} from './ui/gallery/share.service';
import {ModalModule} from 'ngx-bootstrap/modal';
import {BsDatepickerModule} from 'ngx-bootstrap/datepicker';
import {DatabaseSettingsComponent} from './ui/settings/database/database.settings.component';
import {ToastrModule} from 'ngx-toastr';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {NotificationService} from './model/notification.service';
import {JwBootstrapSwitchNg2Module} from 'jw-bootstrap-switch-ng2';
import {ClipboardModule} from 'ngx-clipboard';
import {NavigationService} from './model/navigation.service';
import {InfoPanelLightboxComponent} from './ui/gallery/lightbox/infopanel/info-panel.lightbox.gallery.component';
import {MapSettingsComponent} from './ui/settings/map/map.settings.component';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {BsDropdownModule} from 'ngx-bootstrap/dropdown';
import {CollapseModule} from 'ngx-bootstrap/collapse';
import {PopoverModule} from 'ngx-bootstrap/popover';
import {ThumbnailSettingsComponent} from './ui/settings/thumbnail/thumbnail.settings.component';
import {SearchSettingsComponent} from './ui/settings/search/search.settings.component';
import {SettingsService} from './ui/settings/settings.service';
import {ShareSettingsComponent} from './ui/settings/share/share.settings.component';
import {BasicSettingsComponent} from './ui/settings/basic/basic.settings.component';
import {OtherSettingsComponent} from './ui/settings/other/other.settings.component';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {DefaultUrlSerializer, UrlSerializer, UrlTree} from '@angular/router';
import {IndexingSettingsComponent} from './ui/settings/indexing/indexing.settings.component';
import {LanguageComponent} from './ui/language/language.component';
import {QueryService} from './model/query.service';
import {IconizeSortingMethod} from './pipes/IconizeSortingMethod';
import {StringifySortingMethod} from './pipes/StringifySortingMethod';
import {RandomQueryBuilderGalleryComponent} from './ui/gallery/random-query-builder/random-query-builder.gallery.component';
import {RandomPhotoSettingsComponent} from './ui/settings/random-photo/random-photo.settings.component';
import {VideoSettingsComponent} from './ui/settings/video/video.settings.component';
import {DurationPipe} from './pipes/DurationPipe';
import {MapService} from './ui/gallery/map/map.service';
import {MetaFileSettingsComponent} from './ui/settings/metafiles/metafile.settings.component';
import {ThumbnailLoaderService} from './ui/gallery/thumbnailLoader.service';
import {FileSizePipe} from './pipes/FileSizePipe';
import {DuplicateService} from './ui/duplicates/duplicates.service';
import {DuplicateComponent} from './ui/duplicates/duplicates.component';
import {DuplicatesPhotoComponent} from './ui/duplicates/photo/photo.duplicates.component';
import {SeededRandomService} from './model/seededRandom.service';
import {FacesComponent} from './ui/faces/faces.component';
import {FacesService} from './ui/faces/faces.service';
import {FaceComponent} from './ui/faces/face/face.component';
import {VersionService} from './model/version.service';
import {DirectoriesComponent} from './ui/gallery/directories/directories.component';
import {ControlsLightboxComponent} from './ui/gallery/lightbox/controls/controls.lightbox.gallery.component';
import {FacesSettingsComponent} from './ui/settings/faces/faces.settings.component';
import {TimepickerModule} from 'ngx-bootstrap/timepicker';
import {TimeStampDatePickerComponent} from './ui/utils/timestamp-datepicker/datepicker.component';
import {TimeStampTimePickerComponent} from './ui/utils/timestamp-timepicker/timepicker.component';
import {PhotoSettingsComponent} from './ui/settings/photo/photo.settings.component';
import {JobProgressComponent} from './ui/settings/jobs/progress/job-progress.settings.component';
import {JobsSettingsComponent} from './ui/settings/jobs/jobs.settings.component';
import {ScheduledJobsService} from './ui/settings/scheduled-jobs.service';
import {BackendtextService} from './model/backendtext.service';
import {JobButtonComponent} from './ui/settings/jobs/button/job-button.settings.component';
import {ErrorInterceptor} from './model/network/helper/error.interceptor';
import {CSRFInterceptor} from './model/network/helper/csrf.interceptor';
import {SettingsEntryComponent} from './ui/settings/_abstract/settings-entry/settings-entry.component';
import {GallerySearchQueryEntryComponent} from './ui/gallery/search/query-enrty/query-entry.search.gallery.component';
import {StringifySearchQuery} from './pipes/StringifySearchQuery';
import {AutoCompleteService} from './ui/gallery/search/autocomplete.service';
import {SearchQueryParserService} from './ui/gallery/search/search-query-parser.service';
import {GallerySearchFieldComponent} from './ui/gallery/search/search-field/search-field.gallery.component';
import {AppRoutingModule} from './app.routing';
import {CookieService} from 'ngx-cookie-service';
import {LeafletMarkerClusterModule} from '@asymmetrik/ngx-leaflet-markercluster';
import {icon, Marker} from 'leaflet';
import {AlbumsComponent} from './ui/albums/albums.component';
import {AlbumComponent} from './ui/albums/album/album.component';
import {AlbumsService} from './ui/albums/albums.service';
import {GallerySearchQueryBuilderComponent} from './ui/gallery/search/query-builder/query-bulder.gallery.component';
import {SavedSearchPopupComponent} from './ui/albums/saved-search-popup/saved-search-popup.component';
import {AlbumsSettingsComponent} from './ui/settings/albums/albums.settings.component';


@Injectable()
export class MyHammerConfig extends HammerGestureConfig {
  events: string[] = ['pinch'];
  overrides = {
    pan: {threshold: 1},
    swipe: {direction: 31}, // enable swipe up
    pinch: {enable: true}
  };
}


export class CustomUrlSerializer implements UrlSerializer {
  private defaultUrlSerializer: DefaultUrlSerializer = new DefaultUrlSerializer();

  parse(url: string): UrlTree {
    // Encode parentheses
    url = url.replace(/\(/g, '%28').replace(/\)/g, '%29');
    // Use the default serializer.
    return this.defaultUrlSerializer.parse(url);
  }

  serialize(tree: UrlTree): string {
    return this.defaultUrlSerializer.serialize(tree).replace(/%28/g, '(').replace(/%29/g, ')');
  }
}

// Fixes Leaflet icon path issue:
// https://stackoverflow.com/questions/41144319/leaflet-marker-not-found-production-env
const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
Marker.prototype.options.icon = iconDefault;


@NgModule({
  imports: [
    BrowserModule,
    HammerModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    ClipboardModule,
    JwBootstrapSwitchNg2Module,
    TooltipModule.forRoot(),
    ToastrModule.forRoot(),
    ModalModule.forRoot(),
    CollapseModule.forRoot(),
    PopoverModule.forRoot(),
    BsDropdownModule.forRoot(),
    BsDatepickerModule.forRoot(),
    TimepickerModule.forRoot(),
    LoadingBarModule,
    LeafletModule,
    LeafletMarkerClusterModule
  ],
  declarations: [AppComponent,
    LoginComponent,
    ShareLoginComponent,
    GalleryComponent,
    FacesComponent,
    // misc
    FrameComponent,
    LanguageComponent,
    TimeStampDatePickerComponent,
    TimeStampTimePickerComponent,
    // Albums
    AlbumsComponent,
    AlbumComponent,
    SavedSearchPopupComponent,
    // Gallery
    GalleryLightboxMediaComponent,
    GalleryPhotoLoadingComponent,
    GalleryGridComponent,
    GalleryDirectoryComponent,
    GalleryLightboxComponent,
    GalleryMapComponent,
    GalleryMapLightboxComponent,
    FrameComponent,
    GallerySearchComponent,
    GallerySearchQueryEntryComponent,
    GallerySearchFieldComponent,
    GallerySearchQueryBuilderComponent,
    GalleryShareComponent,
    GalleryNavigatorComponent,
    GalleryPhotoComponent,
    AdminComponent,
    InfoPanelLightboxComponent,
    ControlsLightboxComponent,
    RandomQueryBuilderGalleryComponent,
    DirectoriesComponent,
    // Face
    FaceComponent,
    // Duplicates
    DuplicateComponent,
    DuplicatesPhotoComponent,
    // Settings
    SettingsEntryComponent,
    UserMangerSettingsComponent,
    DatabaseSettingsComponent,
    MapSettingsComponent,
    ThumbnailSettingsComponent,
    VideoSettingsComponent,
    PhotoSettingsComponent,
    MetaFileSettingsComponent,
    SearchSettingsComponent,
    ShareSettingsComponent,
    RandomPhotoSettingsComponent,
    BasicSettingsComponent,
    FacesSettingsComponent,
    AlbumsSettingsComponent,
    OtherSettingsComponent,
    IndexingSettingsComponent,
    JobProgressComponent,
    JobsSettingsComponent,
    JobButtonComponent,

    // Pipes
    StringifyRole,
    IconizeSortingMethod,
    StringifySortingMethod,
    DurationPipe,
    FileSizePipe,
    GPXFilesFilterPipe,
    StringifySearchQuery
  ],
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: CSRFInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true},
    {provide: UrlSerializer, useClass: CustomUrlSerializer},
    {provide: HAMMER_GESTURE_CONFIG, useClass: MyHammerConfig},
    StringifySortingMethod,
    NetworkService,
    ShareService,
    UserService,
    AlbumsService,
    GalleryCacheService,
    GalleryService,
    MapService,
    SearchQueryParserService,
    AutoCompleteService,
    AuthenticationService,
    ThumbnailLoaderService,
    ThumbnailManagerService,
    NotificationService,
    FullScreenService,
    NavigationService,
    SettingsService,
    SeededRandomService,
    OverlayService,
    QueryService,
    DuplicateService,
    FacesService,
    VersionService,
    ScheduledJobsService,
    BackendtextService,
    CookieService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
