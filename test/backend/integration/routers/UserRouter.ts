import {Config} from '../../../../src/common/config/private/Config';
import {Server} from '../../../../src/backend/server';
import {LoginCredential} from '../../../../src/common/entities/LoginCredential';
import {UserDTO, UserRoles} from '../../../../src/common/entities/UserDTO';
import * as path from 'path';
import * as fs from 'fs';
import {SQLConnection} from '../../../../src/backend/model/database/sql/SQLConnection';
import {ObjectManagers} from '../../../../src/backend/model/ObjectManagers';
import {QueryParams} from '../../../../src/common/QueryParams';
import {Utils} from '../../../../src/common/Utils';
import {SuperAgentStatic} from 'superagent';
import {RouteTestingHelper} from './RouteTestingHelper';
import {ErrorCodes} from '../../../../src/common/entities/Error';
import {DatabaseType, ServerConfig} from '../../../../src/common/config/private/PrivateConfig';
import {ProjectPath} from '../../../../src/backend/ProjectPath';


process.env.NODE_ENV = 'test';
const chai: any = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);

describe('UserRouter', () => {

  const testUser: UserDTO = {
    id: 1,
    name: 'test',
    password: 'test',
    role: UserRoles.User,
    permissions: null
  };
  const {password, ...expectedUser} = testUser;
  const tempDir = path.join(__dirname, '../../tmp');
  let server: Server;
  const setUp = async () => {
    await fs.promises.rmdir(tempDir, {recursive: true});
    Config.Server.Threading.enabled = false;
    Config.Server.Database.type = DatabaseType.sqlite;
    Config.Server.Database.dbFolder = tempDir;
    ProjectPath.reset();


    server = new Server();
    await server.onStarted.wait();
    await ObjectManagers.InitSQLManagers();
    await ObjectManagers.getInstance().UserManager.createUser(Utils.clone(testUser));
    await SQLConnection.close();
  };
  const tearDown = async () => {
    await SQLConnection.close();
    await fs.promises.rmdir(tempDir, {recursive: true});
  };

  const checkUserResult = (result: any, user: any) => {

    result.should.have.status(200);
    result.body.should.be.a('object');
    should.equal(result.body.error, null);
    result.body.result.csrfToken.should.be.a('string');
    const {csrfToken, ...u} = result.body.result;
    u.should.deep.equal(user);
  };

  const login = async (srv: Server): Promise<any> => {
    const result = await (chai.request(srv.App) as SuperAgentStatic)
      .post('/api/user/login')
      .send({
        loginCredential: {
          password: testUser.password,
          username: testUser.name,
          rememberMe: false
        } as LoginCredential
      });

    checkUserResult(result, expectedUser);
    return result;
  };


  describe('/POST user/login', () => {
    beforeEach(setUp);
    afterEach(tearDown);
    it('it should login', async () => {
      Config.Client.authenticationRequired = true;
      await login(server);

    });
    it('it skip login', async () => {
      Config.Client.authenticationRequired = false;
      const result = await chai.request(server.App)
        .post('/api/user/login');

      result.res.should.have.status(404);
    });


  });


  describe('/GET user/me', () => {
    beforeEach(setUp);
    afterEach(tearDown);
    it('it should GET the authenticated user', async () => {
      Config.Client.authenticationRequired = true;

      const loginRes = await login(server);

      const result = await chai.request(server.App)
        .get('/api/user/me')
        .set('Cookie', loginRes.res.headers['set-cookie'])
        .set('CSRF-Token', loginRes.body.result.csrfToken);

      checkUserResult(result, expectedUser);
    });

    it('it should not authenticate', async () => {
      Config.Client.authenticationRequired = true;

      const result = await chai.request(server.App)
        .get('/api/user/me');

      result.res.should.have.status(401);
    });

    it('it should authenticate as user with sharing key', async () => {
      Config.Client.authenticationRequired = true;
      Config.Client.Sharing.enabled = true;

      const sharingKey = (await RouteTestingHelper.createSharing(testUser)).sharingKey;


      const loginRes = await login(server);
      const q: any = {};
      q[QueryParams.gallery.sharingKey_query] = sharingKey;
      const result = await chai.request(server.App)
        .get('/api/user/me?' + QueryParams.gallery.sharingKey_query + '=' + sharingKey)
        .set('Cookie', loginRes.res.headers['set-cookie'])
        .set('CSRF-Token', loginRes.body.result.csrfToken);

      // should return with logged in user, not limited sharing one
      checkUserResult(result, expectedUser);
    });


    it('it should authenticate with sharing key', async () => {
      Config.Client.authenticationRequired = true;
      Config.Client.Sharing.enabled = true;
      const sharing = (await RouteTestingHelper.createSharing(testUser));


      const q: any = {};
      q[QueryParams.gallery.sharingKey_query] = sharing.sharingKey;
      const result = await chai.request(server.App)
        .get('/api/user/me?' + QueryParams.gallery.sharingKey_query + '=' + sharing.sharingKey);


      checkUserResult(result, RouteTestingHelper.getExpectedSharingUser(sharing));
    });
    it('it should not authenticate with sharing key without password', async () => {
      Config.Client.authenticationRequired = true;
      Config.Client.Sharing.enabled = true;
      const sharing = (await RouteTestingHelper.createSharing(testUser, 'pass_secret'));


      const q: any = {};
      q[QueryParams.gallery.sharingKey_query] = sharing.sharingKey;
      const result = await chai.request(server.App)
        .get('/api/user/me?' + QueryParams.gallery.sharingKey_query + '=' + sharing.sharingKey);


      result.should.have.status(401);
      result.body.should.be.a('object');
      result.body.error.should.be.a('object');
      should.equal(result.body.error.code, ErrorCodes.NOT_AUTHENTICATED);
    });

    it('it should authenticate as guest', async () => {
      Config.Client.authenticationRequired = false;

      const result = await chai.request(server.App)
        .get('/api/user/me');

      const expectedGuestUser = {
        name: UserRoles[Config.Client.unAuthenticatedUserRole],
        role: Config.Client.unAuthenticatedUserRole
      } as UserDTO;


      checkUserResult(result, expectedGuestUser);
    });
  });
});
