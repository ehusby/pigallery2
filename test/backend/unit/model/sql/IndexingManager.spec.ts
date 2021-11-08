import * as fs from 'fs';
import {Config} from '../../../../../src/common/config/private/Config';
import {SQLConnection} from '../../../../../src/backend/model/database/sql/SQLConnection';
import {GalleryManager} from '../../../../../src/backend/model/database/sql/GalleryManager';
import {DirectoryBaseDTO, DirectoryDTOUtils, ParentDirectoryDTO} from '../../../../../src/common/entities/DirectoryDTO';
import {TestHelper} from './TestHelper';
import {Connection} from 'typeorm';
import {DirectoryEntity} from '../../../../../src/backend/model/database/sql/enitites/DirectoryEntity';
import {Utils} from '../../../../../src/common/Utils';
import {MediaDTO} from '../../../../../src/common/entities/MediaDTO';
import {FileDTO} from '../../../../../src/common/entities/FileDTO';
import {IndexingManager} from '../../../../../src/backend/model/database/sql/IndexingManager';
import {ObjectManagers} from '../../../../../src/backend/model/ObjectManagers';
import {DBTestHelper} from '../../../DBTestHelper';
import {DiskMangerWorker} from '../../../../../src/backend/model/threading/DiskMangerWorker';
import {ReIndexingSensitivity} from '../../../../../src/common/config/private/PrivateConfig';
import {SearchQueryTypes, TextSearch, TextSearchQueryMatchTypes} from '../../../../../src/common/entities/SearchQueryDTO';
import {ProjectPath} from '../../../../../src/backend/ProjectPath';
import * as path from 'path';
import {DiskManager} from '../../../../../src/backend/model/DiskManger';
import {AlbumManager} from '../../../../../src/backend/model/database/sql/AlbumManager';
import {SortingMethods} from '../../../../../src/common/entities/SortingMethods';

const deepEqualInAnyOrder = require('deep-equal-in-any-order');
const chai = require('chai');

chai.use(deepEqualInAnyOrder);
const {expect} = chai;

class GalleryManagerTest extends GalleryManager {


  public async selectParentDir(connection: Connection, directoryName: string, directoryParent: string): Promise<ParentDirectoryDTO> {
    return super.selectParentDir(connection, directoryName, directoryParent);
  }

  public async fillParentDir(connection: Connection, dir: ParentDirectoryDTO): Promise<void> {
    return super.fillParentDir(connection, dir);
  }

}

class IndexingManagerTest extends IndexingManager {


  public async queueForSave(scannedDirectory: ParentDirectoryDTO): Promise<void> {
    return super.queueForSave(scannedDirectory);
  }

  public async saveToDB(scannedDirectory: ParentDirectoryDTO): Promise<void> {
    return await super.saveToDB(scannedDirectory);
  }
}

// to help WebStorm to handle the test cases
declare let describe: any;
declare const after: any;
declare const it: any;
describe = DBTestHelper.describe();

describe('IndexingManager', (sqlHelper: DBTestHelper) => {


  beforeEach(async () => {
    await sqlHelper.initDB();
    //  ObjectManagers.getInstance().PersonManager = new PersonManager();
    // ObjectManagers.getInstance().VersionManager = new VersionManager();
  });


  afterEach(async () => {
    Config.loadSync();
    Config.Server.Preview.Sorting = [SortingMethods.descRating];
    await sqlHelper.clearDB();
  });

  const setPartial = (dir: DirectoryBaseDTO) => {
    if (!dir.preview && dir.media && dir.media.length > 0) {
      dir.preview = dir.media[0];
    }
    dir.isPartial = true;
    delete dir.directories;
    delete dir.metaFile;
    delete dir.media;
  };

  const makePreview = (m: MediaDTO) => {
    delete (m.directory as ParentDirectoryDTO).id;
    delete m.metadata;
    return m;
  };

  const indexifyReturn = (dir: DirectoryBaseDTO): DirectoryBaseDTO => {
    const d = Utils.clone(dir);

    delete d.preview;
    if (d.directories) {
      for (const subD of d.directories) {
        if (subD.preview) {
          delete subD.preview.metadata;
        }
      }
    }

    return d;
  };

  const removeIds = (dir: DirectoryBaseDTO): DirectoryBaseDTO => {
    delete dir.id;
    dir.media.forEach((media: MediaDTO) => {
      delete media.id;
    });
    if (dir.preview) {
      delete dir.preview.id;
    }
    if (dir.metaFile) {
      if (dir.metaFile.length === 0) {
        delete dir.metaFile;
      } else {
        dir.metaFile.forEach((file: FileDTO) => {
          delete file.id;
        });
      }
    }
    if (dir.directories) {
      dir.directories.forEach((directory: DirectoryBaseDTO) => {
        removeIds(directory);
      });
    }

    return dir;
  };

  it('should support case sensitive file names', async () => {
    const gm = new GalleryManagerTest();
    const im = new IndexingManagerTest();

    const parent = TestHelper.getRandomizedDirectoryEntry();
    const p1 = TestHelper.getRandomizedPhotoEntry(parent, 'Photo1');
    const p2 = TestHelper.getRandomizedPhotoEntry(parent, 'Photo2');
    p1.name = 'test.jpg';
    p2.name = 'Test.jpg';

    DirectoryDTOUtils.packDirectory(parent);
    await im.saveToDB(Utils.clone(parent) as ParentDirectoryDTO);

    const conn = await SQLConnection.getConnection();
    const selected = await gm.selectParentDir(conn, parent.name, parent.path);
    await gm.fillParentDir(conn, selected);

    DirectoryDTOUtils.packDirectory(selected);

    expect(Utils.clone(Utils.removeNullOrEmptyObj(removeIds(selected))))
      .to.deep.equalInAnyOrder(Utils.removeNullOrEmptyObj(indexifyReturn(parent)));
  });


  it('should support case sensitive directory', async () => {
    const gm = new GalleryManagerTest();
    const im = new IndexingManagerTest();

    const parent = TestHelper.getRandomizedDirectoryEntry(null, 'parent');
    const subDir1 = TestHelper.getRandomizedDirectoryEntry(parent, 'subDir');
    const p1 = TestHelper.getRandomizedPhotoEntry(subDir1, 'subPhoto1', 0);
    const subDir2 = TestHelper.getRandomizedDirectoryEntry(parent, 'SUBDIR');
    const p2 = TestHelper.getRandomizedPhotoEntry(subDir2, 'subPhoto2', 0);


    DirectoryDTOUtils.packDirectory(parent);
    await im.saveToDB(Utils.clone(parent) as ParentDirectoryDTO);

    const conn = await SQLConnection.getConnection();
    const selected = await gm.selectParentDir(conn, parent.name, parent.path);
    await gm.fillParentDir(conn, selected);

    DirectoryDTOUtils.packDirectory(selected);
    removeIds(selected);
    setPartial(subDir1);
    setPartial(subDir2);
    expect(Utils.clone(Utils.removeNullOrEmptyObj(selected)))
      .to.deep.equalInAnyOrder(Utils.removeNullOrEmptyObj(indexifyReturn(parent)));
  });

  it('should support case sensitive directory path', async () => {
    const gm = new GalleryManagerTest();
    const im = new IndexingManagerTest();

    const parent1 = TestHelper.getRandomizedDirectoryEntry(null, 'parent');
    const parent2 = TestHelper.getRandomizedDirectoryEntry(null, 'PARENT');
    const subDir1 = TestHelper.getRandomizedDirectoryEntry(parent1, 'subDir');
    const p1 = TestHelper.getRandomizedPhotoEntry(subDir1, 'subPhoto1', 0);
    const subDir2 = TestHelper.getRandomizedDirectoryEntry(parent2, 'subDir2');
    const p2 = TestHelper.getRandomizedPhotoEntry(subDir2, 'subPhoto2', 0);


    DirectoryDTOUtils.packDirectory(parent1);
    await im.saveToDB(Utils.clone(parent1) as ParentDirectoryDTO);
    DirectoryDTOUtils.packDirectory(parent2);
    await im.saveToDB(Utils.clone(parent2) as ParentDirectoryDTO);

    const conn = await SQLConnection.getConnection();
    {
      const selected = await gm.selectParentDir(conn, parent1.name, parent1.path);
      await gm.fillParentDir(conn, selected);

      DirectoryDTOUtils.packDirectory(selected);
      removeIds(selected);
      setPartial(subDir1);
      expect(Utils.clone(Utils.removeNullOrEmptyObj(selected)))
        .to.deep.equalInAnyOrder(Utils.removeNullOrEmptyObj(indexifyReturn(parent1)));
    }
    {
      const selected = await gm.selectParentDir(conn, parent2.name, parent2.path);
      await gm.fillParentDir(conn, selected);

      DirectoryDTOUtils.packDirectory(selected);
      removeIds(selected);
      setPartial(subDir2);
      expect(Utils.clone(Utils.removeNullOrEmptyObj(selected)))
        .to.deep.equalInAnyOrder(Utils.removeNullOrEmptyObj(indexifyReturn(parent2)));
    }
  });


  it('should select preview', async () => {
    const selectDirectory = async (gmTest: GalleryManagerTest, dir: DirectoryBaseDTO): Promise<ParentDirectoryDTO> => {
      const conn = await SQLConnection.getConnection();
      const selected = await gmTest.selectParentDir(conn, dir.name, dir.path);
      await gmTest.fillParentDir(conn, selected);

      DirectoryDTOUtils.packDirectory(selected);
      removeIds(selected);
      return selected;
    };

    const gm = new GalleryManagerTest();
    const im = new IndexingManagerTest();


    const parent = TestHelper.getRandomizedDirectoryEntry(null, 'parent');


    const checkParent = async () => {
      const selected = await selectDirectory(gm, parent);
      const cloned = Utils.removeNullOrEmptyObj(indexifyReturn(parent));
      if (cloned.directories) {
        cloned.directories.forEach(d => setPartial(d));
      }
      expect(Utils.clone(Utils.removeNullOrEmptyObj(selected)))
        .to.deep.equalInAnyOrder(cloned);
    };

    const saveToDBAndCheck = async (dir: DirectoryBaseDTO) => {
      DirectoryDTOUtils.packDirectory(parent);
      await im.saveToDB(Utils.clone(dir) as ParentDirectoryDTO);
      await checkParent();
      DirectoryDTOUtils.unpackDirectory(parent);
    };

    await saveToDBAndCheck(parent);

    const subDir1 = TestHelper.getRandomizedDirectoryEntry(parent, 'subDir');
    await saveToDBAndCheck(parent);

    const p1 = TestHelper.getRandomizedPhotoEntry(subDir1, 'subPhoto1', 0);
    await saveToDBAndCheck(subDir1);

    const subDir2 = TestHelper.getRandomizedDirectoryEntry(parent, 'subDir2');
    await saveToDBAndCheck(parent);

    const p2 = TestHelper.getRandomizedPhotoEntry(subDir2, 'subPhoto2', 0);
    await saveToDBAndCheck(subDir2);

    const p = TestHelper.getRandomizedPhotoEntry(parent, 'photo', 0);
    await saveToDBAndCheck(parent);


  });


  it('should save parent after child', async () => {
    const gm = new GalleryManagerTest();
    const im = new IndexingManagerTest();

    const parent = TestHelper.getRandomizedDirectoryEntry(null, 'parentDir');
    const p1 = TestHelper.getRandomizedPhotoEntry(parent, 'Photo1');

    const subDir = TestHelper.getRandomizedDirectoryEntry(null, 'subDir');
    subDir.path = DiskMangerWorker.pathFromParent(parent);
    const sp1 = TestHelper.getRandomizedPhotoEntry(subDir, 'subPhoto1', 0);
    sp1.metadata.rating = 5;
    const sp2 = TestHelper.getRandomizedPhotoEntry(subDir, 'subPhoto2', 0);
    sp2.metadata.rating = 3;
    subDir.preview = sp1;
    Config.Server.Preview.Sorting = [SortingMethods.descRating];

    DirectoryDTOUtils.packDirectory(subDir);
    await im.saveToDB(Utils.clone(subDir) as ParentDirectoryDTO);

    parent.directories.push(subDir);


    DirectoryDTOUtils.packDirectory(parent);
    await im.saveToDB(Utils.clone(parent) as ParentDirectoryDTO);

    const conn = await SQLConnection.getConnection();
    const selected = await gm.selectParentDir(conn, parent.name, parent.path);
    await gm.fillParentDir(conn, selected);

    DirectoryDTOUtils.packDirectory(selected);
    removeIds(selected);
    setPartial(subDir);
    expect(Utils.clone(Utils.removeNullOrEmptyObj(selected)))
      .to.deep.equalInAnyOrder(Utils.removeNullOrEmptyObj(indexifyReturn(parent)));
  });


  it('should save root parent after child', async () => {
    const gm = new GalleryManagerTest();
    const im = new IndexingManagerTest();

    const parent = TestHelper.getRandomizedDirectoryEntry(null, '.');
    const p1 = TestHelper.getRandomizedPhotoEntry(parent, 'Photo1');

    const subDir = TestHelper.getRandomizedDirectoryEntry(null, 'subDir');
    subDir.path = DiskMangerWorker.pathFromParent(parent);
    const sp1 = TestHelper.getRandomizedPhotoEntry(subDir, 'subPhoto1', 0);
    sp1.metadata.rating = 5;
    const sp2 = TestHelper.getRandomizedPhotoEntry(subDir, 'subPhoto2', 0);
    sp2.metadata.rating = 3;
    subDir.preview = sp1;
    Config.Server.Preview.Sorting = [SortingMethods.descRating];


    DirectoryDTOUtils.packDirectory(subDir);
    await im.saveToDB(Utils.clone(subDir) as ParentDirectoryDTO);

    parent.directories.push(subDir);


    DirectoryDTOUtils.packDirectory(parent);
    await im.saveToDB(Utils.clone(parent) as ParentDirectoryDTO);

    const conn = await SQLConnection.getConnection();
    const selected = await gm.selectParentDir(conn, parent.name, parent.path);
    await gm.fillParentDir(conn, selected);

    DirectoryDTOUtils.packDirectory(selected);
    removeIds(selected);
    setPartial(subDir);
    expect(Utils.clone(Utils.removeNullOrEmptyObj(selected)))
      .to.deep.equalInAnyOrder(Utils.removeNullOrEmptyObj(indexifyReturn(parent)));
  });

  it('should save parent directory', async () => {
    const gm = new GalleryManagerTest();
    const im = new IndexingManagerTest();

    const parent = TestHelper.getRandomizedDirectoryEntry();
    const p1 = TestHelper.getRandomizedPhotoEntry(parent, 'Photo1');
    const p2 = TestHelper.getRandomizedPhotoEntry(parent, 'Photo2');
    const gpx = TestHelper.getRandomizedGPXEntry(parent, 'GPX1');
    const subDir = TestHelper.getRandomizedDirectoryEntry(parent, 'subDir');
    const sp1 = TestHelper.getRandomizedPhotoEntry(subDir, 'subPhoto1', 0);
    sp1.metadata.rating = 5;
    const sp2 = TestHelper.getRandomizedPhotoEntry(subDir, 'subPhoto2', 0);
    sp2.metadata.rating = 3;
    subDir.preview = sp1;
    Config.Server.Preview.Sorting = [SortingMethods.descRating];

    DirectoryDTOUtils.packDirectory(parent);
    await im.saveToDB(Utils.clone(parent) as ParentDirectoryDTO);

    const conn = await SQLConnection.getConnection();
    const selected = await gm.selectParentDir(conn, parent.name, parent.path);
    await gm.fillParentDir(conn, selected);

    DirectoryDTOUtils.packDirectory(selected);
    removeIds(selected);
    setPartial(subDir);
    expect(Utils.clone(Utils.removeNullOrEmptyObj(selected)))
      .to.deep.equalInAnyOrder(Utils.removeNullOrEmptyObj(indexifyReturn(parent)));
  });


  it('should save photos with extreme parameters', async () => {
    const gm = new GalleryManagerTest();
    const im = new IndexingManagerTest();

    const parent = TestHelper.getRandomizedDirectoryEntry();
    const p1 = TestHelper.getRandomizedPhotoEntry(parent, 'Photo1');
    const p2 = TestHelper.getRandomizedPhotoEntry(parent, 'Photo2');
    const minFloat = 1.1 * Math.pow(10, -38);
    const maxFloat = 3.4 * Math.pow(10, +38);
    p1.metadata.cameraData.fStop = minFloat;
    p2.metadata.cameraData.fStop = maxFloat;
    p1.metadata.cameraData.exposure = minFloat;
    p2.metadata.cameraData.exposure = maxFloat;
    p1.metadata.cameraData.focalLength = minFloat;
    p2.metadata.cameraData.focalLength = maxFloat;
    p1.metadata.positionData.GPSData.altitude = -2147483647;
    p2.metadata.positionData.GPSData.altitude = 2147483646;
    p1.metadata.positionData.GPSData.latitude = maxFloat;
    p2.metadata.positionData.GPSData.latitude = minFloat;
    p1.metadata.positionData.GPSData.longitude = maxFloat;
    p2.metadata.positionData.GPSData.longitude = minFloat;


    DirectoryDTOUtils.packDirectory(parent);
    await im.saveToDB(Utils.clone(parent) as ParentDirectoryDTO);

    const conn = await SQLConnection.getConnection();
    const selected = await gm.selectParentDir(conn, parent.name, parent.path);
    await gm.fillParentDir(conn, selected);

    DirectoryDTOUtils.packDirectory(selected);
    removeIds(selected);
    expect(Utils.clone(Utils.removeNullOrEmptyObj(selected)))
      .to.deep.equalInAnyOrder(Utils.removeNullOrEmptyObj(indexifyReturn(parent)));
  });

  it('should skip meta files', async () => {
    const gm = new GalleryManagerTest();
    const im = new IndexingManagerTest();
    const parent = TestHelper.getRandomizedDirectoryEntry();
    const p1 = TestHelper.getRandomizedPhotoEntry(parent, 'Photo1');
    const p2 = TestHelper.getRandomizedPhotoEntry(parent, 'Photo2');
    const gpx = TestHelper.getRandomizedGPXEntry(parent, 'GPX1');
    DirectoryDTOUtils.packDirectory(parent);
    Config.Client.MetaFile.enabled = true;
    await im.saveToDB(Utils.clone(parent) as ParentDirectoryDTO);

    Config.Client.MetaFile.enabled = false;
    const conn = await SQLConnection.getConnection();
    const selected = await gm.selectParentDir(conn, parent.name, parent.path);
    await gm.fillParentDir(conn, selected);

    delete parent.metaFile;
    DirectoryDTOUtils.packDirectory(selected);
    removeIds(selected);
    expect(Utils.clone(Utils.removeNullOrEmptyObj(selected)))
      .to.deep.equalInAnyOrder(Utils.removeNullOrEmptyObj(indexifyReturn(parent)));
  });

  it('should update sub directory', async () => {
    const gm = new GalleryManagerTest();
    const im = new IndexingManagerTest();

    const parent = TestHelper.getRandomizedDirectoryEntry();
    parent.name = 'parent';
    const p1 = TestHelper.getRandomizedPhotoEntry(parent);
    const subDir = TestHelper.getRandomizedDirectoryEntry(parent, 'subDir');
    subDir.name = 'subDir';
    const sp1 = TestHelper.getRandomizedPhotoEntry(subDir, 'subPhoto1');

    DirectoryDTOUtils.packDirectory(parent);
    await im.saveToDB(Utils.clone(parent) as ParentDirectoryDTO);

    const sp2 = TestHelper.getRandomizedPhotoEntry(subDir, 'subPhoto2');
    const sp3 = TestHelper.getRandomizedPhotoEntry(subDir, 'subPhoto3');

    DirectoryDTOUtils.packDirectory(subDir);
    await im.saveToDB(Utils.clone(subDir) as ParentDirectoryDTO);

    const conn = await SQLConnection.getConnection();
    const selected = await gm.selectParentDir(conn, subDir.name, subDir.path);
    await gm.fillParentDir(conn, selected);

    // subDir.isPartial = true;
    //  delete subDir.directories;
    DirectoryDTOUtils.packDirectory(selected);
    delete subDir.parent;
    delete subDir.metaFile;
    removeIds(selected);
    // selected.directories[0].parent = selected;
    expect(Utils.clone(Utils.removeNullOrEmptyObj(selected)))
      .to.deep.equalInAnyOrder(Utils.removeNullOrEmptyObj(indexifyReturn(subDir)));
  });

  it('should avoid race condition', async () => {
    const conn = await SQLConnection.getConnection();
    const gm = new GalleryManagerTest();
    const im = new IndexingManagerTest();
    Config.Client.MetaFile.enabled = true;
    const parent = TestHelper.getRandomizedDirectoryEntry();
    const p1 = TestHelper.getRandomizedPhotoEntry(parent, 'Photo1');
    const p2 = TestHelper.getRandomizedPhotoEntry(parent, 'Photo2');
    const gpx = TestHelper.getRandomizedGPXEntry(parent, 'GPX1');
    const subDir = TestHelper.getRandomizedDirectoryEntry(parent, 'subDir');
    const sp1 = TestHelper.getRandomizedPhotoEntry(subDir, 'subPhoto1', 1);
    sp1.metadata.rating = 5;
    const sp2 = TestHelper.getRandomizedPhotoEntry(subDir, 'subPhoto2', 1);
    sp2.metadata.rating = 3;
    subDir.preview = sp1;
    Config.Server.Preview.Sorting = [SortingMethods.descRating];

    DirectoryDTOUtils.packDirectory(parent);
    const s1 = im.queueForSave(Utils.clone(parent) as ParentDirectoryDTO);
    const s2 = im.queueForSave(Utils.clone(parent) as ParentDirectoryDTO);
    const s3 = im.queueForSave(Utils.clone(parent) as ParentDirectoryDTO);

    await Promise.all([s1, s2, s3]);

    const selected = await gm.selectParentDir(conn, parent.name, parent.path);
    await gm.fillParentDir(conn, selected);

    DirectoryDTOUtils.packDirectory(selected);
    removeIds(selected);
    setPartial(subDir);
    parent.directories.forEach(d => delete (d.preview.metadata as any).faces);
    delete sp1.metadata.faces;
    delete sp2.metadata.faces;
    expect(Utils.clone(Utils.removeNullOrEmptyObj(selected)))
      .to.deep.equalInAnyOrder(Utils.removeNullOrEmptyObj(indexifyReturn(parent)));
  });

  it('should reset DB', async () => {
    const gm = new GalleryManagerTest();
    const im = new IndexingManagerTest();

    const parent = TestHelper.getRandomizedDirectoryEntry();
    const p1 = TestHelper.getRandomizedPhotoEntry(parent, 'Photo1');
    const p2 = TestHelper.getRandomizedPhotoEntry(parent, 'Photo2');

    DirectoryDTOUtils.packDirectory(parent);
    await im.saveToDB(Utils.clone(parent) as ParentDirectoryDTO);

    const conn = await SQLConnection.getConnection();
    const selected = await gm.selectParentDir(conn, parent.name, parent.path);
    await gm.fillParentDir(conn, selected);

    DirectoryDTOUtils.packDirectory(selected);
    removeIds(selected);
    expect(Utils.clone(Utils.removeNullOrEmptyObj(selected)))
      .to.deep.equal(Utils.removeNullOrEmptyObj(indexifyReturn(parent)));

    await im.resetDB();
    const selectReset = await gm.selectParentDir(conn, parent.name, parent.path);
    expect(selectReset).to.deep.equal(undefined);
  });


  (it('should save 1500 photos', async () => {
    const conn = await SQLConnection.getConnection();
    const gm = new GalleryManagerTest();
    const im = new IndexingManagerTest();
    Config.Client.MetaFile.enabled = true;
    const parent = TestHelper.getRandomizedDirectoryEntry();
    DirectoryDTOUtils.packDirectory(parent);
    await im.saveToDB(Utils.clone(parent) as ParentDirectoryDTO);
    const subDir = TestHelper.getRandomizedDirectoryEntry(parent, 'subDir');
    for (let i = 0; i < 1500; i++) {
      TestHelper.getRandomizedPhotoEntry(subDir, 'p' + i);
    }

    DirectoryDTOUtils.packDirectory(parent);
    await im.saveToDB(subDir as ParentDirectoryDTO);


    const selected = await gm.selectParentDir(conn, subDir.name, subDir.path);
    expect(selected.media.length).to.equal(subDir.media.length);
  }) as any).timeout(40000);

  DBTestHelper.savedDescribe('Test listDirectory', () => {
    const statSync = fs.statSync;
    let dirTime = 0;
    const indexedTime = {
      lastScanned: 0,
      lastModified: 0
    };

    beforeEach(() => {
      dirTime = 0;

      ObjectManagers.getInstance().IndexingManager = new IndexingManagerTest();
      indexedTime.lastModified = 0;
      indexedTime.lastScanned = 0;
    });

    afterEach(() => {
      // @ts-ignore
      fs.statSync = statSync;
    });

    it('with re indexing severity low', async () => {
      Config.Server.Indexing.reIndexingSensitivity = ReIndexingSensitivity.low;

      // @ts-ignore
      fs.statSync = () => ({ctime: new Date(dirTime), mtime: new Date(dirTime)});
      const gm = new GalleryManagerTest();
      gm.selectParentDir = (connection: Connection, directoryName: string, directoryParent: string) => {
        return Promise.resolve(indexedTime as any);
      };
      gm.fillParentDir = (connection: Connection, dir: DirectoryEntity) => {
        return Promise.resolve();
      };

      ObjectManagers.getInstance().IndexingManager.indexDirectory = (...args) => {
        return Promise.resolve('indexing') as any;
      };

      indexedTime.lastScanned = null;
      expect(await gm.listDirectory('./')).to.be.equal('indexing');
      indexedTime.lastModified = 0;
      dirTime = 1;
      expect(await gm.listDirectory('./')).to.be.equal('indexing');
      indexedTime.lastScanned = 10;
      indexedTime.lastModified = 1;
      dirTime = 1;
      expect(await gm.listDirectory('./')).to.be.equal(indexedTime);
      expect(await gm.listDirectory('./', 1, 10))
        .to.be.equal(null);


    });
  });


  DBTestHelper.savedDescribe('should index .pg2conf', () => {


    it('.saved_searches.pg2conf', async () => {
      Config.Server.Threading.enabled = false;
      Config.Client.Album.enabled = true;
      Config.Client.Faces.enabled = true;

      Config.Server.Media.folder = path.join(__dirname, '/../../../assets');
      ProjectPath.ImageFolder = path.join(__dirname, '/../../../assets');
      const im = new IndexingManagerTest();
      const am = new AlbumManager();

      const dir = await DiskManager.scanDirectory('/');

      await im.saveToDB(dir);

      const albums = await am.getAlbums();
      expect(albums[0].preview).to.be.an('object');
      delete albums[0].preview;
      expect(albums).to.be.equalInAnyOrder([
        {
          id: 1,
          name: 'Alvin',
          locked: true,
          count: 1,
          searchQuery: {
            type: SearchQueryTypes.person,
            text: 'Alvin',
            matchType: TextSearchQueryMatchTypes.like
          } as TextSearch
        }
      ]);
    });
  });
});
