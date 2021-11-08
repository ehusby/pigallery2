import {AuthenticationMWs} from '../middlewares/user/AuthenticationMWs';
import {Express} from 'express';
import {GalleryMWs} from '../middlewares/GalleryMWs';
import {RenderingMWs} from '../middlewares/RenderingMWs';
import {ThumbnailGeneratorMWs} from '../middlewares/thumbnail/ThumbnailGeneratorMWs';
import {UserRoles} from '../../common/entities/UserDTO';
import {ThumbnailSourceType} from '../model/threading/PhotoWorker';
import {VersionMWs} from '../middlewares/VersionMWs';
import {SupportedFormats} from '../../common/SupportedFormats';
import {PhotoConverterMWs} from '../middlewares/thumbnail/PhotoConverterMWs';

export class GalleryRouter {
  public static route(app: Express): void {

    this.addGetImageIcon(app);
    this.addGetVideoIcon(app);
    this.addGetPhotoThumbnail(app);
    this.addGetVideoThumbnail(app);
    this.addGetBestFitImage(app);
    this.addGetImage(app);
    this.addGetBestFitVideo(app);
    this.addGetVideo(app);
    this.addGetMetaFile(app);
    this.addRandom(app);
    this.addDirectoryList(app);
    this.addDirectoryZip(app);

    this.addSearch(app);
    this.addAutoComplete(app);
  }

  protected static addDirectoryList(app: Express): void {
    app.get(['/api/gallery/content/:directory(*)', '/api/gallery/', '/api/gallery//'],
      // common part
      AuthenticationMWs.authenticate,
      AuthenticationMWs.normalizePathParam('directory'),
      AuthenticationMWs.authorisePath('directory', true),
      VersionMWs.injectGalleryVersion,

      // specific part
      GalleryMWs.listDirectory,
      ThumbnailGeneratorMWs.addThumbnailInformation,
      GalleryMWs.cleanUpGalleryResults,
      RenderingMWs.renderResult
    );
  }

  protected static addDirectoryZip(app: Express): void {
    app.get(['/api/gallery/zip/:directory(*)'],
      // common part
      AuthenticationMWs.authenticate,
      AuthenticationMWs.normalizePathParam('directory'),
      AuthenticationMWs.authorisePath('directory', true),

      // specific part
      GalleryMWs.zipDirectory
    );
  }

  protected static addGetImage(app: Express): void {
    app.get(['/api/gallery/content/:mediaPath(*\.(' + SupportedFormats.Photos.join('|') + '))'],
      // common part
      AuthenticationMWs.authenticate,
      AuthenticationMWs.normalizePathParam('mediaPath'),
      AuthenticationMWs.authorisePath('mediaPath', false),

      // specific part
      GalleryMWs.loadFile,
      RenderingMWs.renderFile
    );
  }

  protected static addGetBestFitImage(app: Express): void {
    app.get(['/api/gallery/content/:mediaPath(*\.(' + SupportedFormats.Photos.join('|') + '))/bestFit'],
      // common part
      AuthenticationMWs.authenticate,
      AuthenticationMWs.normalizePathParam('mediaPath'),
      AuthenticationMWs.authorisePath('mediaPath', false),

      // specific part
      GalleryMWs.loadFile,
      PhotoConverterMWs.convertPhoto,
      RenderingMWs.renderFile
    );
  }

  protected static addGetVideo(app: Express): void {
    app.get(['/api/gallery/content/:mediaPath(*\.(' + SupportedFormats.Videos.join('|') + '))'],
      // common part
      AuthenticationMWs.authenticate,
      AuthenticationMWs.normalizePathParam('mediaPath'),
      AuthenticationMWs.authorisePath('mediaPath', false),

      // specific part
      GalleryMWs.loadFile,
      RenderingMWs.renderFile
    );
  }

  protected static addGetBestFitVideo(app: Express): void {
    app.get(['/api/gallery/content/:mediaPath(*\.(' + SupportedFormats.Videos.join('|') + '))/bestFit'],
      // common part
      AuthenticationMWs.authenticate,
      AuthenticationMWs.normalizePathParam('mediaPath'),
      AuthenticationMWs.authorisePath('mediaPath', false),

      // specific part
      GalleryMWs.loadFile,
      GalleryMWs.loadBestFitVideo,
      RenderingMWs.renderFile
    );
  }

  protected static addGetMetaFile(app: Express): void {
    app.get(['/api/gallery/content/:mediaPath(*\.(' + SupportedFormats.MetaFiles.join('|') + '))'],
      // common part
      AuthenticationMWs.authenticate,
      AuthenticationMWs.normalizePathParam('mediaPath'),
      AuthenticationMWs.authorisePath('mediaPath', false),

      // specific part
      GalleryMWs.loadFile,
      RenderingMWs.renderFile
    );
  }

  protected static addRandom(app: Express): void {
    app.get(['/api/gallery/random/:searchQueryDTO'],
      // common part
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Guest),
      VersionMWs.injectGalleryVersion,

      // specific part
      GalleryMWs.getRandomImage,
      GalleryMWs.loadFile,
      RenderingMWs.renderFile
    );
  }

  protected static addGetPhotoThumbnail(app: Express): void {
    app.get('/api/gallery/content/:mediaPath(*\.(' + SupportedFormats.Photos.join('|') + '))/thumbnail/:size?',
      // common part
      AuthenticationMWs.authenticate,
      AuthenticationMWs.normalizePathParam('mediaPath'),
      AuthenticationMWs.authorisePath('mediaPath', false),

      // specific part
      GalleryMWs.loadFile,
      ThumbnailGeneratorMWs.generateThumbnailFactory(ThumbnailSourceType.Photo),
      RenderingMWs.renderFile
    );
  }

  protected static addGetVideoThumbnail(app: Express): void {
    app.get('/api/gallery/content/:mediaPath(*\.(' + SupportedFormats.Videos.join('|') + '))/thumbnail/:size?',
      // common part
      AuthenticationMWs.authenticate,
      AuthenticationMWs.normalizePathParam('mediaPath'),
      AuthenticationMWs.authorisePath('mediaPath', false),

      // specific part
      GalleryMWs.loadFile,
      ThumbnailGeneratorMWs.generateThumbnailFactory(ThumbnailSourceType.Video),
      RenderingMWs.renderFile
    );
  }


  protected static addGetVideoIcon(app: Express): void {
    app.get('/api/gallery/content/:mediaPath(*\.(' + SupportedFormats.Videos.join('|') + '))/icon',
      // common part
      AuthenticationMWs.authenticate,
      AuthenticationMWs.normalizePathParam('mediaPath'),
      AuthenticationMWs.authorisePath('mediaPath', false),

      // specific part
      GalleryMWs.loadFile,
      ThumbnailGeneratorMWs.generateIconFactory(ThumbnailSourceType.Video),
      RenderingMWs.renderFile
    );
  }

  protected static addGetImageIcon(app: Express): void {
    app.get('/api/gallery/content/:mediaPath(*\.(' + SupportedFormats.Photos.join('|') + '))/icon',
      // common part
      AuthenticationMWs.authenticate,
      AuthenticationMWs.normalizePathParam('mediaPath'),
      AuthenticationMWs.authorisePath('mediaPath', false),

      // specific part
      GalleryMWs.loadFile,
      ThumbnailGeneratorMWs.generateIconFactory(ThumbnailSourceType.Photo),
      RenderingMWs.renderFile
    );
  }

  protected static addSearch(app: Express): void {
    app.get('/api/search/:searchQueryDTO(*)',
      // common part
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Guest),
      VersionMWs.injectGalleryVersion,

      // specific part
      GalleryMWs.search,
      ThumbnailGeneratorMWs.addThumbnailInformation,
      GalleryMWs.cleanUpGalleryResults,
      RenderingMWs.renderResult
    );
  }


  protected static addAutoComplete(app: Express): void {
    app.get('/api/autocomplete/:text(*)',
      // common part
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Guest),
      VersionMWs.injectGalleryVersion,

      // specific part
      GalleryMWs.autocomplete,
      RenderingMWs.renderResult
    );
  }

}
