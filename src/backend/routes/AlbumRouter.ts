import {AuthenticationMWs} from '../middlewares/user/AuthenticationMWs';
import {Express} from 'express';
import {RenderingMWs} from '../middlewares/RenderingMWs';
import {UserRoles} from '../../common/entities/UserDTO';
import {VersionMWs} from '../middlewares/VersionMWs';
import {AlbumMWs} from '../middlewares/AlbumMWs';

export class AlbumRouter {
  public static route(app: Express): void {

    this.addListAlbums(app);
    this.addAddSavedSearch(app);
    this.addDeleteAlbum(app);
  }


  private static addListAlbums(app: Express): void {
    app.get(['/api/albums'],
      // common part
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.User),
      VersionMWs.injectGalleryVersion,

      // specific part
      AlbumMWs.listAlbums,
      RenderingMWs.renderResult
    );
  }

  private static addDeleteAlbum(app: Express): void {
    app.delete(['/api/albums/:id'],
      // common part
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Admin),
      VersionMWs.injectGalleryVersion,

      // specific part
      AlbumMWs.deleteAlbum,
      RenderingMWs.renderResult
    );
  }

  private static addAddSavedSearch(app: Express): void {
    app.put(['/api/albums/saved-searches'],
      // common part
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Admin),
      VersionMWs.injectGalleryVersion,

      // specific part
      AlbumMWs.createSavedSearch,
      RenderingMWs.renderResult
    );
  }

}
