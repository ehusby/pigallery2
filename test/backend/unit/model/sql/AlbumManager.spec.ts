import {DBTestHelper} from '../../../DBTestHelper';
import {ParentDirectoryDTO, SubDirectoryDTO} from '../../../../../src/common/entities/DirectoryDTO';
import {TestHelper} from './TestHelper';
import {ObjectManagers} from '../../../../../src/backend/model/ObjectManagers';
import {PhotoDTO} from '../../../../../src/common/entities/PhotoDTO';
import {VideoDTO} from '../../../../../src/common/entities/VideoDTO';
import {AlbumManager} from '../../../../../src/backend/model/database/sql/AlbumManager';
import {SearchQueryTypes, TextSearch} from '../../../../../src/common/entities/SearchQueryDTO';
import {SQLConnection} from '../../../../../src/backend/model/database/sql/SQLConnection';
import {AlbumBaseEntity} from '../../../../../src/backend/model/database/sql/enitites/album/AlbumBaseEntity';
import {Utils} from '../../../../../src/common/Utils';
import {MediaDTO} from '../../../../../src/common/entities/MediaDTO';
import {SavedSearchDTO} from '../../../../../src/common/entities/album/SavedSearchDTO';


const deepEqualInAnyOrder = require('deep-equal-in-any-order');
const chai = require('chai');

chai.use(deepEqualInAnyOrder);
const {expect} = chai;

// to help WebStorm to handle the test cases
declare let describe: any;
declare const after: any;
declare const before: any;
const tmpDescribe = describe;
describe = DBTestHelper.describe(); // fake it os IDE plays nicely (recognize the test)


describe('AlbumManager', (sqlHelper: DBTestHelper) => {
  describe = tmpDescribe;
  /**
   * dir
   * |- v
   * |- p
   * |- p2
   * |-> subDir
   *     |- p3
   * |-> subDir2
   *     |- p4
   */

  let dir: ParentDirectoryDTO;
  let subDir: SubDirectoryDTO;
  let subDir2: SubDirectoryDTO;
  let v: VideoDTO;
  let p: PhotoDTO;
  let p2: PhotoDTO;
  let p3: PhotoDTO;
  let p4: PhotoDTO;


  const setUpTestGallery = async (): Promise<void> => {
    const directory: ParentDirectoryDTO = TestHelper.getDirectoryEntry();
    subDir = TestHelper.getDirectoryEntry(directory, 'The Phantom Menace');
    subDir2 = TestHelper.getDirectoryEntry(directory, 'Return of the Jedi');
    p = TestHelper.getRandomizedPhotoEntry(directory, 'Photo1');
    p2 = TestHelper.getRandomizedPhotoEntry(directory, 'Photo2');
    p3 = TestHelper.getRandomizedPhotoEntry(subDir, 'Photo3');
    p4 = TestHelper.getRandomizedPhotoEntry(subDir2, 'Photo4');
    v = TestHelper.getVideoEntry1(directory);

    dir = await DBTestHelper.persistTestDir(directory);
    subDir = dir.directories[0];
    subDir2 = dir.directories[1];
    p = (dir.media.filter(m => m.name === p.name)[0] as any);
    p2 = (dir.media.filter(m => m.name === p2.name)[0] as any);
    v = (dir.media.filter(m => m.name === v.name)[0] as any);
    p3 = (dir.directories[0].media[0] as any);
    p4 = (dir.directories[1].media[0] as any);
  };

  const setUpSqlDB = async () => {
    await sqlHelper.initDB();
    await setUpTestGallery();
    await ObjectManagers.InitSQLManagers();
  };


  const toAlbumPreview = (m: MediaDTO): MediaDTO => {
    // generated dirs for test contain everything, not like return values from the server.
    const tmpDir: ParentDirectoryDTO = m.directory as ParentDirectoryDTO;
    const tmpM = tmpDir.media;
    const tmpD = tmpDir.directories;
    const tmpP = tmpDir.preview;
    const tmpMT = tmpDir.metaFile;
    delete tmpDir.directories;
    delete tmpDir.media;
    delete tmpDir.preview;
    delete tmpDir.metaFile;
    const ret = Utils.clone(m);
    delete ret.id;
    ret.directory = {path: ret.directory.path, name: ret.directory.name};
    delete ret.metadata;
    tmpDir.directories = tmpD;
    tmpDir.media = tmpM;
    tmpDir.preview = tmpP;
    tmpDir.metaFile = tmpMT;
    return ret;
  };


  before(setUpSqlDB);
  after(sqlHelper.clearDB);

  describe('Saved search', () => {


    beforeEach(setUpSqlDB);
    afterEach(sqlHelper.clearDB);

    it('should add album', async () => {
      const am = new AlbumManager();
      const connection = await SQLConnection.getConnection();

      const query: TextSearch = {text: 'test', type: SearchQueryTypes.any_text};

      expect(await connection.getRepository(AlbumBaseEntity).find()).to.deep.equalInAnyOrder([]);

      await am.addSavedSearch('Test Album', Utils.clone(query));

      expect(await connection.getRepository(AlbumBaseEntity).find()).to.deep.equalInAnyOrder([{
        id: 1,
        name: 'Test Album',
        locked: false,
        count: 0,
        searchQuery: query
      } as SavedSearchDTO]);
    });

    it('should delete album', async () => {
      const am = new AlbumManager();
      const connection = await SQLConnection.getConnection();

      const query: TextSearch = {text: 'test', type: SearchQueryTypes.any_text};


      await am.addSavedSearch('Test Album', Utils.clone(query));
      await am.addSavedSearch('Test Album2', Utils.clone(query), true);

      expect(await connection.getRepository(AlbumBaseEntity).find()).to.deep.equalInAnyOrder([
        {
          id: 1,
          name: 'Test Album',
          locked: false,
          count: 0,
          searchQuery: query
        } as SavedSearchDTO,
        {
          id: 2,
          name: 'Test Album2',
          locked: true,
          count: 0,
          searchQuery: query
        } as SavedSearchDTO]);

      await am.deleteAlbum(1);
      expect(await connection.getRepository(AlbumBaseEntity).find()).to.deep.equalInAnyOrder([{
        id: 2,
        name: 'Test Album2',
        locked: true,
        count: 0,
        searchQuery: query
      } as SavedSearchDTO]);

      try {
        await am.deleteAlbum(2);
        expect(false).to.be.equal(true); // should not reach
      } catch (e) {
        expect(e.message).to.equal('Could not delete album, id:2');
      }
      expect(await connection.getRepository(AlbumBaseEntity).find()).to.deep.equalInAnyOrder([{
        id: 2,
        name: 'Test Album2',
        locked: true,
        count: 0,
        searchQuery: query
      } as SavedSearchDTO]);
    });
  });

  it('should list album', async () => {
    const am = new AlbumManager();

    const query: TextSearch = {text: 'photo1', type: SearchQueryTypes.any_text};

    await am.addSavedSearch('Test Album', Utils.clone(query));

    expect(await am.getAlbums()).to.deep.equalInAnyOrder(([{
      id: 1,
      name: 'Test Album',
      searchQuery: query,
      locked: false,
      count: 1,
      preview: toAlbumPreview(p)
    } as SavedSearchDTO]));


  });


});
