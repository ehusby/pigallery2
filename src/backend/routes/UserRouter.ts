import {UserMWs} from '../middlewares/user/UserMWs';
import {Express} from 'express';
import {UserRoles} from '../../common/entities/UserDTO';
import {AuthenticationMWs} from '../middlewares/user/AuthenticationMWs';
import {UserRequestConstrainsMWs} from '../middlewares/user/UserRequestConstrainsMWs';
import {RenderingMWs} from '../middlewares/RenderingMWs';

export class UserRouter {
  public static route(app: Express): void {
    this.addLogin(app);
    this.addLogout(app);
    this.addGetSessionUser(app);
    this.addChangePassword(app);


    this.addCreateUser(app);
    this.addDeleteUser(app);
    this.addListUsers(app);
    this.addChangeRole(app);
  }

  private static addLogin(app: Express): void {
    app.post('/api/user/login',
      AuthenticationMWs.inverseAuthenticate,
      AuthenticationMWs.login,
      RenderingMWs.renderSessionUser
    );
  }

  private static addLogout(app: Express): void {
    app.post('/api/user/logout',
      AuthenticationMWs.logout,
      RenderingMWs.renderOK
    );
  }


  private static addGetSessionUser(app: Express): void {
    app.get('/api/user/me',
      AuthenticationMWs.authenticate,
      RenderingMWs.renderSessionUser
    );
  }


  private static addChangePassword(app: Express): void {
    app.post('/api/user/:id/password',
      AuthenticationMWs.authenticate,
      UserRequestConstrainsMWs.forceSelfRequest,
      UserMWs.changePassword,
      RenderingMWs.renderOK
    );
  }


  private static addCreateUser(app: Express): void {
    app.put('/api/user',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Admin),
      UserMWs.createUser,
      RenderingMWs.renderOK
    );
  }

  private static addDeleteUser(app: Express): void {
    app.delete('/api/user/:id',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Admin),
      UserRequestConstrainsMWs.notSelfRequest,
      UserMWs.deleteUser,
      RenderingMWs.renderOK
    );
  }


  private static addListUsers(app: Express): void {
    app.get('/api/user/list',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Admin),
      UserMWs.listUsers,
      RenderingMWs.renderResult
    );
  }

  private static addChangeRole(app: Express): void {
    app.post('/api/user/:id/role',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Admin),
      UserRequestConstrainsMWs.notSelfRequestOr2Admins,
      UserMWs.changeRole,
      RenderingMWs.renderOK
    );
  }


}
