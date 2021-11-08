import {expect} from 'chai';
import {PersonManager} from '../../../../../src/backend/model/database/sql/PersonManager';
import {DBTestHelper} from '../../../DBTestHelper';
import {TestHelper} from './TestHelper';
import {PhotoDTO} from '../../../../../src/common/entities/PhotoDTO';
import {Utils} from '../../../../../src/common/Utils';
import {PersonWithSampleRegion} from '../../../../../src/common/entities/PersonDTO';
import {ParentDirectoryDTO} from '../../../../../src/common/entities/DirectoryDTO';
import {VideoDTO} from '../../../../../src/common/entities/VideoDTO';
import {SQLConnection} from '../../../../../src/backend/model/database/sql/SQLConnection';
import {PersonEntry} from '../../../../../src/backend/model/database/sql/enitites/PersonEntry';


// to help WebStorm to handle the test cases
declare let describe: any;
declare const after: any;
declare const before: any;
declare const it: any;


describe = DBTestHelper.describe();

describe('PersonManager', (sqlHelper: DBTestHelper) => {


  let dir: ParentDirectoryDTO;

  let v: VideoDTO;
  let p: PhotoDTO;
  let p2: PhotoDTO;
  let pFaceLess: PhotoDTO;

  let savedPerson: PersonWithSampleRegion[] = [];

  const setUpSqlDB = async () => {
    await sqlHelper.initDB();
    const directory: ParentDirectoryDTO = TestHelper.getDirectoryEntry();
    p = TestHelper.getPhotoEntry1(directory);
    p2 = TestHelper.getPhotoEntry2(directory);
    const pFaceLessTmp = TestHelper.getPhotoEntry3(directory);
    delete pFaceLessTmp.metadata.faces;
    v = TestHelper.getVideoEntry1(directory);

    dir = await DBTestHelper.persistTestDir(directory);
    p = (dir.media.filter(m => m.name === p.name)[0] as any);
    p2 = (dir.media.filter(m => m.name === p2.name)[0] as any);
    pFaceLess = (dir.media[2] as any);
    v = (dir.media.filter(m => m.name === v.name)[0] as any);
    savedPerson = await (await SQLConnection.getConnection()).getRepository(PersonEntry).find({
      relations: ['sampleRegion',
        'sampleRegion.media',
        'sampleRegion.media.directory']
    });
  };


  before(async () => {
    await setUpSqlDB();
  });

  after(async () => {
    await sqlHelper.clearDB();
  });


  it('should get person', async () => {
    const pm = new PersonManager();
    const person = Utils.clone(savedPerson[0]);

    const selected = Utils.clone(await pm.get('Boba Fett'));
    delete selected.sampleRegion;
    delete person.sampleRegion;
    person.count = 1;
    expect(selected).to.deep.equal(person);

    expect((await pm.get('Boba Fett') as PersonWithSampleRegion).sampleRegion.media.name).to.deep.equal(p.name);
  });


});
