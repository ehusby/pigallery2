import {AuthenticationMWs} from '../../middlewares/user/AuthenticationMWs';
import {UserRoles} from '../../../common/entities/UserDTO';
import {RenderingMWs} from '../../middlewares/RenderingMWs';
import {Express} from 'express';
import {SettingsMWs} from '../../middlewares/admin/SettingsMWs';

export class SettingsRouter {
  public static route(app: Express): void {

    this.addSettings(app);
  }

  private static addSettings(app: Express): void {
    app.get('/api/settings',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Admin),
      RenderingMWs.renderConfig
    );


    app.put('/api/settings/database',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Admin),
      SettingsMWs.updateDatabaseSettings,
      RenderingMWs.renderOK
    );

    app.put('/api/settings/map',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Admin),
      SettingsMWs.updateMapSettings,
      RenderingMWs.renderOK
    );
    app.put('/api/settings/video',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Admin),
      SettingsMWs.updateVideoSettings,
      RenderingMWs.renderOK
    );
    app.put('/api/settings/photo',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Admin),
      SettingsMWs.updatePhotoSettings,
      RenderingMWs.renderOK
    );
    app.put('/api/settings/metafile',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Admin),
      SettingsMWs.updateMetaFileSettings,
      RenderingMWs.renderOK
    );

    app.put('/api/settings/authentication',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Admin),
      SettingsMWs.updateAuthenticationSettings,
      RenderingMWs.renderOK
    );
    app.put('/api/settings/thumbnail',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Admin),
      SettingsMWs.updateThumbnailSettings,
      RenderingMWs.renderOK
    );
    app.put('/api/settings/search',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Admin),
      SettingsMWs.updateSearchSettings,
      RenderingMWs.renderOK
    );
    app.put('/api/settings/faces',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Admin),
      SettingsMWs.updateFacesSettings,
      RenderingMWs.renderOK
    );
    app.put('/api/settings/albums',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Admin),
      SettingsMWs.updateAlbumsSettings,
      RenderingMWs.renderOK
    );
    app.put('/api/settings/share',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Admin),
      SettingsMWs.updateShareSettings,
      RenderingMWs.renderOK
    );
    app.put('/api/settings/randomPhoto',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Admin),
      SettingsMWs.updateRandomPhotoSettings,
      RenderingMWs.renderOK
    );
    app.put('/api/settings/basic',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Admin),
      SettingsMWs.updateBasicSettings,
      RenderingMWs.renderOK
    );
    app.put('/api/settings/other',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Admin),
      SettingsMWs.updateOtherSettings,
      RenderingMWs.renderOK
    );
    app.put('/api/settings/indexing',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Admin),
      SettingsMWs.updateIndexingSettings,
      RenderingMWs.renderOK
    );
    app.put('/api/settings/jobs',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Admin),
      SettingsMWs.updateJobSettings,
      RenderingMWs.renderOK
    );
  }


}
