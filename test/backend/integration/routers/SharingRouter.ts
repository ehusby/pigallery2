import {Config} from '../../../../src/common/config/private/Config';
import {Server} from '../../../../src/backend/server';
import {LoginCredential} from '../../../../src/common/entities/LoginCredential';
import {UserDTO, UserRoles} from '../../../../src/common/entities/UserDTO';
import * as path from 'path';
import * as fs from 'fs';
import {SQLConnection} from '../../../../src/backend/model/database/sql/SQLConnection';
import {ObjectManagers} from '../../../../src/backend/model/ObjectManagers';
import {Utils} from '../../../../src/common/Utils';
import {SuperAgentStatic} from 'superagent';
import {RouteTestingHelper} from './RouteTestingHelper';
import {QueryParams} from '../../../../src/common/QueryParams';
import {ErrorCodes} from '../../../../src/common/entities/Error';
import {DatabaseType, ServerConfig} from '../../../../src/common/config/private/PrivateConfig';


process.env.NODE_ENV = 'test';
const chai: any = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);

describe('SharingRouter', () => {

  const testUser: UserDTO = {
    id: 1,
    name: 'test',
    password: 'test',
    role: UserRoles.User,
    permissions: null
  };
  const {password: pass, ...expectedUser} = testUser;
  const tempDir = path.join(__dirname, '../../tmp');
  let server: Server;
  const setUp = async () => {
    await fs.promises.rmdir(tempDir, {recursive: true});
    Config.Client.authenticationRequired = true;
    Config.Server.Threading.enabled = false;
    Config.Client.Sharing.enabled = true;
    Config.Server.Database.type = DatabaseType.sqlite;
    Config.Server.Database.dbFolder = tempDir;

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

  const shouldBeValidUser = (result: any, user: any) => {

    result.should.have.status(200);
    result.body.should.be.a('object');
    should.equal(result.body.error, null);
    result.body.result.csrfToken.should.be.a('string');
    const {csrfToken, ...u} = result.body.result;
    u.should.deep.equal(user);
  };

  const shareLogin = async (srv: Server, sharingKey: string, password?: string): Promise<any> => {
    return (chai.request(srv.App) as SuperAgentStatic)
      .post('/api/share/login?' + QueryParams.gallery.sharingKey_query + '=' + sharingKey)
      .send({password});

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

    shouldBeValidUser(result, expectedUser);
    return result;
  };


  describe('/POST share/login', () => {

    beforeEach(setUp);
    afterEach(tearDown);

    it('should login with passworded share', async () => {
      const sharing = await RouteTestingHelper.createSharing(testUser, 'secret_pass');
      const res = await shareLogin(server, sharing.sharingKey, sharing.password);
      shouldBeValidUser(res, RouteTestingHelper.getExpectedSharingUser(sharing));
    });

    it('should not login with passworded share without password', async () => {
      const sharing = await RouteTestingHelper.createSharing(testUser, 'secret_pass');
      const result = await shareLogin(server, sharing.sharingKey);

      result.should.have.status(401);
      result.body.should.be.a('object');
      result.body.error.should.be.a('object');
      should.equal(result.body.error.code, ErrorCodes.CREDENTIAL_NOT_FOUND);
    });

    it('should login with no-password share', async () => {
      const sharing = await RouteTestingHelper.createSharing(testUser);
      const res = await shareLogin(server, sharing.sharingKey, sharing.password);
      shouldBeValidUser(res, RouteTestingHelper.getExpectedSharingUser(sharing));
    });


  });


});
