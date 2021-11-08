import {LocationManager} from '../../../../../src/backend/model/database/LocationManager';
import {SearchManager} from '../../../../../src/backend/model/database/sql/SearchManager';
import {SearchResultDTO} from '../../../../../src/common/entities/SearchResultDTO';
import {Utils} from '../../../../../src/common/Utils';
import {DBTestHelper} from '../../../DBTestHelper';
import {
  ANDSearchQuery,
  DistanceSearch,
  FromDateSearch,
  MaxRatingSearch,
  MaxResolutionSearch,
  MinRatingSearch,
  MinResolutionSearch,
  OrientationSearch,
  ORSearchQuery,
  SearchListQuery,
  SearchQueryDTO,
  SearchQueryTypes,
  SomeOfSearchQuery,
  TextSearch,
  TextSearchQueryMatchTypes,
  ToDateSearch
} from '../../../../../src/common/entities/SearchQueryDTO';
import {IndexingManager} from '../../../../../src/backend/model/database/sql/IndexingManager';
import {DirectoryBaseDTO, ParentDirectoryDTO, SubDirectoryDTO} from '../../../../../src/common/entities/DirectoryDTO';
import {TestHelper} from './TestHelper';
import {ObjectManagers} from '../../../../../src/backend/model/ObjectManagers';
import {GalleryManager} from '../../../../../src/backend/model/database/sql/GalleryManager';
import {Connection} from 'typeorm';
import {DirectoryEntity} from '../../../../../src/backend/model/database/sql/enitites/DirectoryEntity';
import {GPSMetadata, PhotoDTO, PhotoMetadata} from '../../../../../src/common/entities/PhotoDTO';
import {VideoDTO} from '../../../../../src/common/entities/VideoDTO';
import {AutoCompleteItem} from '../../../../../src/common/entities/AutoCompleteItem';
import {Config} from '../../../../../src/common/config/private/Config';
import {SearchQueryParser} from '../../../../../src/common/SearchQueryParser';
import {FileDTO} from '../../../../../src/common/entities/FileDTO';

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


class IndexingManagerTest extends IndexingManager {

  public async saveToDB(scannedDirectory: ParentDirectoryDTO): Promise<void> {
    return super.saveToDB(scannedDirectory);
  }
}

class SearchManagerTest extends SearchManager {

  public flattenSameOfQueries(query: SearchQueryDTO): SearchQueryDTO {
    return super.flattenSameOfQueries(query);
  }

}

class GalleryManagerTest extends GalleryManager {

  public async selectParentDir(connection: Connection, directoryName: string, directoryParent: string): Promise<ParentDirectoryDTO> {
    return super.selectParentDir(connection, directoryName, directoryParent);
  }

  public async fillParentDir(connection: Connection, dir: ParentDirectoryDTO): Promise<void> {
    return super.fillParentDir(connection, dir);
  }
}

describe('SearchManager', (sqlHelper: DBTestHelper) => {
  describe = tmpDescribe;
  /**
   * dir
   * |- v
   * |- p
   * |- p2
   * |- gpx
   * |-> subDir
   *     |- pFaceLess
   * |-> subDir2
   *     |- p4
   */

  let dir: ParentDirectoryDTO;
  let subDir: SubDirectoryDTO;
  let subDir2: SubDirectoryDTO;
  let v: VideoDTO;
  let p: PhotoDTO;
  let p2: PhotoDTO;
  let pFaceLess: PhotoDTO;
  let p4: PhotoDTO;
  let gpx: FileDTO;


  const setUpTestGallery = async (): Promise<void> => {
    const directory: ParentDirectoryDTO = TestHelper.getDirectoryEntry();
    subDir = TestHelper.getDirectoryEntry(directory, 'The Phantom Menace');
    subDir2 = TestHelper.getDirectoryEntry(directory, 'Return of the Jedi');
    p = TestHelper.getPhotoEntry1(directory);
    p2 = TestHelper.getPhotoEntry2(directory);
    v = TestHelper.getVideoEntry1(directory);
    gpx = TestHelper.getRandomizedGPXEntry(directory);
    p4 = TestHelper.getPhotoEntry4(subDir2);
    const pFaceLessTmp = TestHelper.getPhotoEntry3(subDir);
    delete pFaceLessTmp.metadata.faces;

    dir = await DBTestHelper.persistTestDir(directory);

    subDir = dir.directories[0];
    subDir2 = dir.directories[1];
    p = (dir.media.filter(m => m.name === p.name)[0] as any);
    p2 = (dir.media.filter(m => m.name === p2.name)[0] as any);
    gpx = (dir.metaFile[0] as any);
    v = (dir.media.filter(m => m.name === v.name)[0] as any);
    p4 = (dir.directories[1].media[0] as any);
    pFaceLess = (dir.directories[0].media[0] as any);
  };

  const setUpSqlDB = async () => {
    await sqlHelper.initDB();
    await setUpTestGallery();
    await ObjectManagers.InitSQLManagers();
  };


  before(async () => {
    await setUpSqlDB();
    Config.Client.Search.listDirectories = true;
    Config.Client.Search.listMetafiles = false;
  });


  after(async () => {
    await sqlHelper.clearDB();
    Config.Client.Search.listDirectories = false;
    Config.Client.Search.listMetafiles = false;
  });

  it('should get autocomplete', async () => {
    const sm = new SearchManager();

    const cmp = (a: AutoCompleteItem, b: AutoCompleteItem) => {
      if (a.text === b.text) {
        return a.type - b.type;
      }
      return a.text.localeCompare(b.text);
    };

    expect((await sm.autocomplete('tat', SearchQueryTypes.any_text))).to.deep.equalInAnyOrder([
      new AutoCompleteItem('Tatooine', SearchQueryTypes.position)]);
    expect((await sm.autocomplete('star', SearchQueryTypes.any_text))).to.deep.equalInAnyOrder([
      new AutoCompleteItem('star wars', SearchQueryTypes.keyword),
      new AutoCompleteItem('death star', SearchQueryTypes.keyword)]);

    expect((await sm.autocomplete('wars', SearchQueryTypes.any_text))).to.deep.equalInAnyOrder([
      new AutoCompleteItem('star wars', SearchQueryTypes.keyword),
      new AutoCompleteItem('wars dir', SearchQueryTypes.directory)]);

    expect((await sm.autocomplete('arch', SearchQueryTypes.any_text))).eql([
      new AutoCompleteItem('Research City', SearchQueryTypes.position)]);

    Config.Client.Search.AutoComplete.maxItemsPerCategory = 99999;
    expect((await sm.autocomplete('wa', SearchQueryTypes.any_text))).to.deep.equalInAnyOrder([
      new AutoCompleteItem('star wars', SearchQueryTypes.keyword),
      new AutoCompleteItem('Anakin Skywalker', SearchQueryTypes.person),
      new AutoCompleteItem('Luke Skywalker', SearchQueryTypes.person),
      new AutoCompleteItem('wars dir', SearchQueryTypes.directory)]);

    Config.Client.Search.AutoComplete.maxItemsPerCategory = 1;
    expect((await sm.autocomplete('a', SearchQueryTypes.any_text))).to.deep.equalInAnyOrder([
      new AutoCompleteItem('Ajan Kloss', SearchQueryTypes.position),
      new AutoCompleteItem('Amber stone', SearchQueryTypes.caption),
      new AutoCompleteItem('star wars', SearchQueryTypes.keyword),
      new AutoCompleteItem('Anakin Skywalker', SearchQueryTypes.person),
      new AutoCompleteItem('Castilon', SearchQueryTypes.position),
      new AutoCompleteItem('Devaron', SearchQueryTypes.position),
      new AutoCompleteItem('The Phantom Menace', SearchQueryTypes.directory)]);
    Config.Client.Search.AutoComplete.maxItemsPerCategory = 5;

    expect((await sm.autocomplete('sw', SearchQueryTypes.any_text))).to.deep.equalInAnyOrder([
      new AutoCompleteItem('sw1.jpg', SearchQueryTypes.file_name),
      new AutoCompleteItem('sw2.jpg', SearchQueryTypes.file_name),
      new AutoCompleteItem('sw3.jpg', SearchQueryTypes.file_name),
      new AutoCompleteItem('sw4.jpg', SearchQueryTypes.file_name),
      new AutoCompleteItem(v.name, SearchQueryTypes.file_name)]);

    expect((await sm.autocomplete(v.name, SearchQueryTypes.any_text))).to.deep.equalInAnyOrder(
      [new AutoCompleteItem(v.name, SearchQueryTypes.file_name)]);

  });

  const searchifyMedia = <T extends FileDTO | PhotoDTO>(m: T): T => {
    const tmpDir: DirectoryBaseDTO = m.directory as DirectoryBaseDTO;
    const tmpM = tmpDir.media;
    const tmpD = tmpDir.directories;
    const tmpP = tmpDir.preview;
    const tmpMT = tmpDir.metaFile;
    delete tmpDir.directories;
    delete tmpDir.media;
    delete tmpDir.preview;
    delete tmpDir.metaFile;
    const ret = Utils.clone(m);
    delete (ret.directory as DirectoryBaseDTO).lastScanned;
    delete (ret.directory as DirectoryBaseDTO).lastModified;
    delete (ret.directory as DirectoryBaseDTO).mediaCount;
    if ((ret as PhotoDTO).metadata &&
      ((ret as PhotoDTO).metadata as PhotoMetadata).faces && !((ret as PhotoDTO).metadata as PhotoMetadata).faces.length) {
      delete ((ret as PhotoDTO).metadata as PhotoMetadata).faces;
    }
    tmpDir.directories = tmpD;
    tmpDir.media = tmpM;
    tmpDir.preview = tmpP;
    tmpDir.metaFile = tmpMT;
    return ret;
  };

  const searchifyDir = (d: DirectoryBaseDTO): DirectoryBaseDTO => {
    const tmpM = d.media;
    const tmpD = d.directories;
    const tmpP = d.preview;
    const tmpMT = d.metaFile;
    delete d.directories;
    delete d.media;
    delete d.preview;
    delete d.metaFile;
    const ret = Utils.clone(d);
    d.directories = tmpD;
    d.media = tmpM;
    d.preview = tmpP;
    d.metaFile = tmpMT;
    ret.isPartial = true;
    return ret;
  };

  const removeDir = (result: SearchResultDTO) => {
    result.media = result.media.map(m => searchifyMedia(m));
    result.metaFile = result.metaFile.map(m => searchifyMedia(m));
    result.directories = result.directories.map(m => searchifyDir(m) as SubDirectoryDTO);
    return Utils.clone(result);
  };

  describe('advanced search', async () => {
    afterEach(async () => {
      Config.Client.Search.listDirectories = false;
      Config.Client.Search.listMetafiles = false;
    });
    afterEach(async () => {
      Config.Client.Search.listDirectories = false;
      Config.Client.Search.listMetafiles = false;
    });

    it('should AND', async () => {
      const sm = new SearchManager();

      let query: SearchQueryDTO = {
        type: SearchQueryTypes.AND,
        list: [{text: p.metadata.faces[0].name, type: SearchQueryTypes.person} as TextSearch,
          {text: p2.metadata.caption, type: SearchQueryTypes.caption} as TextSearch]
      } as ANDSearchQuery;

      expect(Utils.clone(await sm.search(query))).to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));
      query = ({
        type: SearchQueryTypes.AND,
        list: [{text: p.metadata.faces[0].name, type: SearchQueryTypes.person} as TextSearch,
          {text: p.metadata.caption, type: SearchQueryTypes.caption} as TextSearch]
      } as ANDSearchQuery);
      expect(await sm.search(query)).to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [p],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));

      // make sure that this shows both photos. We need this the the rest of the tests
      query = ({text: 'a', type: SearchQueryTypes.person} as TextSearch);
      expect(Utils.clone(await sm.search(query))).to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [p, p2, p4],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));

      query = ({
        type: SearchQueryTypes.AND,
        list: [{
          type: SearchQueryTypes.AND,
          list: [{text: 'a', type: SearchQueryTypes.person} as TextSearch,
            {text: p.metadata.keywords[0], type: SearchQueryTypes.keyword} as TextSearch]
        } as ANDSearchQuery,
          {text: p.metadata.caption, type: SearchQueryTypes.caption} as TextSearch
        ]
      } as ANDSearchQuery);

      expect(Utils.clone(await sm.search(query))).to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [p],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));

    });

    it('should OR', async () => {
      const sm = new SearchManager();

      let query: SearchQueryDTO = {
        type: SearchQueryTypes.OR,
        list: [{text: 'Not a person', type: SearchQueryTypes.person} as TextSearch,
          {text: 'Not a caption', type: SearchQueryTypes.caption} as TextSearch]
      } as ORSearchQuery;

      expect(Utils.clone(await sm.search(query))).to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));
      query = ({
        type: SearchQueryTypes.OR,
        list: [{text: p.metadata.faces[0].name, type: SearchQueryTypes.person} as TextSearch,
          {text: p2.metadata.caption, type: SearchQueryTypes.caption} as TextSearch]
      } as ORSearchQuery);
      expect(Utils.clone(await sm.search(query))).to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [p, p2],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));

      query = ({
        type: SearchQueryTypes.OR,
        list: [{text: p.metadata.faces[0].name, type: SearchQueryTypes.person} as TextSearch,
          {text: p.metadata.caption, type: SearchQueryTypes.caption} as TextSearch]
      } as ORSearchQuery);
      expect(Utils.clone(await sm.search(query))).to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [p],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));

      // make sure that this shows both photos. We need this the the rest of the tests
      query = ({text: 'a', type: SearchQueryTypes.person} as TextSearch);
      expect(Utils.clone(await sm.search(query))).to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [p, p2, p4],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));

      query = ({
        type: SearchQueryTypes.OR,
        list: [{
          type: SearchQueryTypes.OR,
          list: [{text: 'a', type: SearchQueryTypes.person} as TextSearch,
            {text: p.metadata.keywords[0], type: SearchQueryTypes.keyword} as TextSearch]
        } as ORSearchQuery,
          {text: p.metadata.caption, type: SearchQueryTypes.caption} as TextSearch
        ]
      } as ORSearchQuery);

      expect(Utils.clone(await sm.search(query))).to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [p, p2, p4],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));


      query = ({
        type: SearchQueryTypes.OR,
        list: [{
          type: SearchQueryTypes.OR,
          list: [{text: p.metadata.keywords[0], type: SearchQueryTypes.keyword} as TextSearch,
            {text: p2.metadata.keywords[0], type: SearchQueryTypes.keyword} as TextSearch]
        } as ORSearchQuery,
          {text: pFaceLess.metadata.caption, type: SearchQueryTypes.caption} as TextSearch
        ]
      } as ORSearchQuery);

      expect(Utils.clone(await sm.search(query))).to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [p, p2, pFaceLess],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));

    });


    it('should minimum of', async () => {
      const sm = new SearchManager();

      let query: SomeOfSearchQuery = {
        type: SearchQueryTypes.SOME_OF,
        list: [{text: 'jpg', type: SearchQueryTypes.file_name} as TextSearch,
          {text: 'mp4', type: SearchQueryTypes.file_name} as TextSearch]
      } as SomeOfSearchQuery;

      expect(Utils.clone(await sm.search(query))).to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [p, p2, pFaceLess, p4, v],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));

      query = ({
        type: SearchQueryTypes.SOME_OF,
        list: [{text: 'R2', type: SearchQueryTypes.person} as TextSearch,
          {text: 'Anakin', type: SearchQueryTypes.person} as TextSearch,
          {text: 'Luke', type: SearchQueryTypes.person} as TextSearch]
      } as SomeOfSearchQuery);

      expect(Utils.clone(await sm.search(query))).to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [p, p2, p4],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));


      query.min = 2;

      expect(Utils.clone(await sm.search(query))).to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [p, p2, p4],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));

      query.min = 3;

      expect(Utils.clone(await sm.search(query))).to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));

      query = ({
        type: SearchQueryTypes.SOME_OF,
        min: 3,
        list: [{text: 'sw', type: SearchQueryTypes.file_name} as TextSearch,
          {text: 'R2', type: SearchQueryTypes.person} as TextSearch,
          {text: 'Kamino', type: SearchQueryTypes.position} as TextSearch,
          {text: 'Han', type: SearchQueryTypes.person} as TextSearch]
      } as SomeOfSearchQuery);

      expect(Utils.clone(await sm.search(query))).to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [p, p2],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));

    });

    describe('should search text', async () => {
      it('as any', async () => {
        const sm = new SearchManager();

        let query = {text: 'sw', type: SearchQueryTypes.any_text} as TextSearch;
        expect(Utils.clone(await sm.search({text: 'sw', type: SearchQueryTypes.any_text} as TextSearch)))
          .to.deep.equalInAnyOrder(removeDir({
          searchQuery: query,
          directories: [],
          media: [p, p2, pFaceLess, v, p4],
          metaFile: [],
          resultOverflow: false
        } as SearchResultDTO), JSON.stringify(query));

        query = ({text: 'sw', negate: true, type: SearchQueryTypes.any_text} as TextSearch);

        expect(removeDir(await sm.search(query)))
          .to.deep.equalInAnyOrder(removeDir({
          searchQuery: query,
          directories: [],
          media: [],
          metaFile: [],
          resultOverflow: false
        } as SearchResultDTO), JSON.stringify(query));

        query = ({text: 'Boba', type: SearchQueryTypes.any_text} as TextSearch);

        expect(Utils.clone(await sm.search(query)))
          .to.deep.equalInAnyOrder(removeDir({
          searchQuery: query,
          directories: [],
          media: [p],
          metaFile: [],
          resultOverflow: false
        } as SearchResultDTO), JSON.stringify(query));

        query = ({text: 'Boba', negate: true, type: SearchQueryTypes.any_text} as TextSearch);
        expect(removeDir(await sm.search(query)))
          .to.deep.equalInAnyOrder(removeDir({
          searchQuery: query,
          directories: [],
          media: [p2, pFaceLess, p4],
          metaFile: [],
          resultOverflow: false
        } as SearchResultDTO), JSON.stringify(query));

        query = ({text: 'Boba', negate: true, type: SearchQueryTypes.any_text} as TextSearch);
        // all should have faces
        const sRet = await sm.search(query);
        for (const item of sRet.media) {
          if (item.id === pFaceLess.id) {
            continue;
          }

          expect((item as PhotoDTO).metadata.faces).to.be.not.an('undefined');
          expect((item as PhotoDTO).metadata.faces).to.be.lengthOf.above(1);
        }


        query = ({
          text: 'Boba',
          type: SearchQueryTypes.any_text,
          matchType: TextSearchQueryMatchTypes.exact_match
        } as TextSearch);
        expect(Utils.clone(await sm.search(query)))
          .to.deep.equalInAnyOrder(removeDir({
          searchQuery: query,
          directories: [],
          media: [],
          metaFile: [],
          resultOverflow: false
        } as SearchResultDTO), JSON.stringify(query));

        query = ({
          text: 'Boba Fett',
          type: SearchQueryTypes.any_text,
          matchType: TextSearchQueryMatchTypes.exact_match
        } as TextSearch);

        expect(Utils.clone(await sm.search(query)))
          .to.deep.equalInAnyOrder(removeDir({
          searchQuery: query,
          directories: [],
          media: [p],
          metaFile: [],
          resultOverflow: false
        } as SearchResultDTO), JSON.stringify(query));

      });

      it('as position', async () => {
        const sm = new SearchManager();


        const query = {text: 'Tatooine', type: SearchQueryTypes.position} as TextSearch;
        expect(Utils.clone(await sm.search(query)))
          .to.deep.equalInAnyOrder(removeDir({
          searchQuery: query,
          directories: [],
          media: [p],
          metaFile: [],
          resultOverflow: false
        } as SearchResultDTO));

      });


      it('as keyword', async () => {
        const sm = new SearchManager();


        let query = {
          text: 'kie',
          type: SearchQueryTypes.keyword
        } as TextSearch;
        expect(Utils.clone(await sm.search(query))).to.deep.equalInAnyOrder(removeDir({
          searchQuery: query,
          directories: [],
          media: [p2, pFaceLess],
          metaFile: [],
          resultOverflow: false
        } as SearchResultDTO));

        query = ({
          text: 'wa',
          type: SearchQueryTypes.keyword
        } as TextSearch);

        expect(Utils.clone(await sm.search(query))).to.deep.equalInAnyOrder(removeDir({
          searchQuery: query,
          directories: [],
          media: [p, p2, pFaceLess, p4],
          metaFile: [],
          resultOverflow: false
        } as SearchResultDTO));

        query = ({
          text: 'han',
          type: SearchQueryTypes.keyword
        } as TextSearch);

        expect(Utils.clone(await sm.search(query))).to.deep.equalInAnyOrder(removeDir({
          searchQuery: query,
          directories: [],
          media: [],
          metaFile: [],
          resultOverflow: false
        } as SearchResultDTO));

        query = ({
          text: 'star wars',
          matchType: TextSearchQueryMatchTypes.exact_match,
          type: SearchQueryTypes.keyword
        } as TextSearch);

        expect(Utils.clone(await sm.search(query))).to.deep.equalInAnyOrder(removeDir({
          searchQuery: query,
          directories: [],
          media: [p, p2, pFaceLess, p4],
          metaFile: [],
          resultOverflow: false
        } as SearchResultDTO));

        query = ({
          text: 'wookiees',
          matchType: TextSearchQueryMatchTypes.exact_match,
          type: SearchQueryTypes.keyword
        } as TextSearch);

        expect(Utils.clone(await sm.search(query))).to.deep.equalInAnyOrder(removeDir({
          searchQuery: query,
          directories: [],
          media: [pFaceLess],
          metaFile: [],
          resultOverflow: false
        } as SearchResultDTO));

      });


      it('as caption', async () => {
        const sm = new SearchManager();


        const query = {
          text: 'han',
          type: SearchQueryTypes.caption
        } as TextSearch;

        expect(Utils.clone(await sm.search(query))).to.deep.equalInAnyOrder(removeDir({
          searchQuery: query,
          directories: [],
          media: [p],
          metaFile: [],
          resultOverflow: false
        } as SearchResultDTO));
      });

      it('as file_name', async () => {
        const sm = new SearchManager();

        let query = {
          text: 'sw',
          type: SearchQueryTypes.file_name
        } as TextSearch;


        expect(Utils.clone(await sm.search(query))).to.deep.equalInAnyOrder(removeDir({
          searchQuery: query,
          directories: [],
          media: [p, p2, pFaceLess, v, p4],
          metaFile: [],
          resultOverflow: false
        } as SearchResultDTO));

        query = ({
          text: 'sw4',
          type: SearchQueryTypes.file_name
        } as TextSearch);

        expect(Utils.clone(await sm.search({
          text: 'sw4',
          type: SearchQueryTypes.file_name
        } as TextSearch))).to.deep.equalInAnyOrder(removeDir({
          searchQuery: query,
          directories: [],
          media: [p4],
          metaFile: [],
          resultOverflow: false
        } as SearchResultDTO));

      });

      it('as directory', async () => {
        const sm = new SearchManager();

        let query = {
          text: 'of the J',
          type: SearchQueryTypes.directory
        } as TextSearch;

        expect(removeDir(await sm.search(query))).to.deep.equalInAnyOrder(removeDir({
          searchQuery: query,
          directories: [],
          media: [p4],
          metaFile: [],
          resultOverflow: false
        } as SearchResultDTO), JSON.stringify(query));

        query = ({
          text: 'wars dir',
          type: SearchQueryTypes.directory
        } as TextSearch);

        expect(removeDir(await sm.search(query))).to.deep.equalInAnyOrder(removeDir({
          searchQuery: query,
          directories: [],
          media: [p, p2, v, pFaceLess, p4],
          metaFile: [],
          resultOverflow: false
        } as SearchResultDTO), JSON.stringify(query));

        query = ({
          text: '/wars dir',
          matchType: TextSearchQueryMatchTypes.exact_match,
          type: SearchQueryTypes.directory
        } as TextSearch);


        expect(removeDir(await sm.search({
          text: '/wars dir',
          matchType: TextSearchQueryMatchTypes.exact_match,
          type: SearchQueryTypes.directory
        } as TextSearch))).to.deep.equalInAnyOrder(removeDir({
          searchQuery: query,
          directories: [],
          media: [p, p2, v],
          metaFile: [],
          resultOverflow: false
        } as SearchResultDTO), JSON.stringify(query));


        query = ({
          text: '/wars dir/Return of the Jedi',
          //    matchType: TextSearchQueryMatchTypes.like,
          type: SearchQueryTypes.directory
        } as TextSearch);

        expect(removeDir(await sm.search(query))).to.deep.equalInAnyOrder(removeDir({
          searchQuery: query,
          directories: [],
          media: [p4],
          metaFile: [],
          resultOverflow: false
        } as SearchResultDTO), JSON.stringify(query));

        query = ({
          text: '/wars dir/Return of the Jedi',
          matchType: TextSearchQueryMatchTypes.exact_match,
          type: SearchQueryTypes.directory
        } as TextSearch);

        expect(removeDir(await sm.search(query))).to.deep.equalInAnyOrder(removeDir({
          searchQuery: query,
          directories: [],
          media: [p4],
          metaFile: [],
          resultOverflow: false
        } as SearchResultDTO), JSON.stringify(query));


      });

      it('as person', async () => {
        const sm = new SearchManager();

        let query = {
          text: 'Boba',
          type: SearchQueryTypes.person
        } as TextSearch;

        expect(Utils.clone(await sm.search(query))).to.deep.equalInAnyOrder(removeDir({
          searchQuery: query,
          directories: [],
          media: [p],
          metaFile: [],
          resultOverflow: false
        } as SearchResultDTO));

        query = ({
          text: 'Boba',
          type: SearchQueryTypes.person,
          matchType: TextSearchQueryMatchTypes.exact_match
        } as TextSearch);

        expect(Utils.clone(await sm.search(query))).to.deep.equalInAnyOrder(removeDir({
          searchQuery: query,
          directories: [],
          media: [],
          metaFile: [],
          resultOverflow: false
        } as SearchResultDTO));

        query = ({
          text: 'Boba Fett',
          type: SearchQueryTypes.person,
          matchType: TextSearchQueryMatchTypes.exact_match
        } as TextSearch);

        expect(Utils.clone(await sm.search({
          text: 'Boba Fett',
          type: SearchQueryTypes.person,
          matchType: TextSearchQueryMatchTypes.exact_match
        } as TextSearch))).to.deep.equalInAnyOrder(removeDir({
          searchQuery: query,
          directories: [],
          media: [p],
          metaFile: [],
          resultOverflow: false
        } as SearchResultDTO));

      });

    });


    it('should search date', async () => {
      const sm = new SearchManager();

      let query: any = {value: 0, type: SearchQueryTypes.to_date} as ToDateSearch;

      expect(Utils.clone(await sm.search(query)))
        .to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));

      query = ({
        value: p.metadata.creationDate, type: SearchQueryTypes.from_date
      } as FromDateSearch);

      expect(Utils.clone(await sm.search(query)))
        .to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [p, v],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));

      query = ({
        value: p.metadata.creationDate,
        negate: true,
        type: SearchQueryTypes.from_date
      } as FromDateSearch);

      expect(Utils.clone(await sm.search(query)))
        .to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [p2, pFaceLess, p4],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));

      query = ({
        value: p.metadata.creationDate + 1000000000,
        type: SearchQueryTypes.to_date
      } as ToDateSearch);

      expect(Utils.clone(await sm.search(query)))
        .to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [p, p2, pFaceLess, v, p4],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));

    });


    it('should search rating', async () => {
      const sm = new SearchManager();

      let query: MinRatingSearch | MaxRatingSearch = {value: 0, type: SearchQueryTypes.max_rating} as MaxRatingSearch;


      expect(Utils.clone(await sm.search(query)))
        .to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));

      query = ({value: 5, type: SearchQueryTypes.max_rating} as MaxRatingSearch);
      expect(Utils.clone(await sm.search(query)))
        .to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [p, p2, pFaceLess],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));

      query = ({value: 5, negate: true, type: SearchQueryTypes.max_rating} as MaxRatingSearch);
      expect(Utils.clone(await sm.search(query)))
        .to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));

      query = ({value: 2, type: SearchQueryTypes.min_rating} as MinRatingSearch);
      expect(Utils.clone(await sm.search(query)))
        .to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [p2, pFaceLess],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));

      query = ({value: 2, negate: true, type: SearchQueryTypes.min_rating} as MinRatingSearch);
      expect(Utils.clone(await sm.search(query)))
        .to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [p],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));
    });


    it('should search resolution', async () => {
      const sm = new SearchManager();

      let query: MinResolutionSearch | MaxResolutionSearch =
        {value: 0, type: SearchQueryTypes.max_resolution} as MaxResolutionSearch;

      expect(Utils.clone(await sm.search(query)))
        .to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));

      query = ({value: 1, type: SearchQueryTypes.max_resolution} as MaxResolutionSearch);
      expect(Utils.clone(await sm.search(query)))
        .to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [p, v],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));

      query = ({value: 3, type: SearchQueryTypes.min_resolution} as MinResolutionSearch);
      expect(Utils.clone(await sm.search(query)))
        .to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [p4],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));


      query = ({value: 3, negate: true, type: SearchQueryTypes.min_resolution} as MinResolutionSearch);
      expect(Utils.clone(await sm.search(query)))
        .to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [p, p2, pFaceLess, v],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));

      query = ({value: 3, negate: true, type: SearchQueryTypes.max_resolution} as MaxResolutionSearch);
      expect(Utils.clone(await sm.search(query)))
        .to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [p4],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));

    });


    it('should search orientation', async () => {
      const sm = new SearchManager();

      let query = {
        landscape: false,
        type: SearchQueryTypes.orientation
      } as OrientationSearch;
      expect(Utils.clone(await sm.search(query)))
        .to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [p, p2, p4, v],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));

      query = ({
        landscape: true,
        type: SearchQueryTypes.orientation
      } as OrientationSearch);
      expect(Utils.clone(await sm.search(query)))
        .to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [p, pFaceLess, v],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));


    });

    it('should search distance', async () => {
      ObjectManagers.getInstance().LocationManager = new LocationManager();
      const sm = new SearchManager();

      ObjectManagers.getInstance().LocationManager.getGPSData = async (): Promise<GPSMetadata> => {
        return {
          longitude: 10,
          latitude: 10,
          altitude: 0
        };
      };

      let query = {
        from: {text: 'Tatooine'},
        distance: 1,
        type: SearchQueryTypes.distance
      } as DistanceSearch;

      expect(Utils.clone(await sm.search(query)))
        .to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [p],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));

      query = ({
        from: {GPSData: {latitude: 0, longitude: 0}},
        distance: 112 * 10, // number of km per degree = ~111km
        type: SearchQueryTypes.distance
      } as DistanceSearch);

      expect(Utils.clone(await sm.search(query)))
        .to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [p, p2],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));

      query = ({
        from: {GPSData: {latitude: 0, longitude: 0}},
        distance: 112 * 10, // number of km per degree = ~111km
        negate: true,
        type: SearchQueryTypes.distance
      } as DistanceSearch);

      expect(Utils.clone(await sm.search(query)))
        .to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [pFaceLess, p4],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));
      query = ({
        from: {GPSData: {latitude: 10, longitude: 10}},
        distance: 1,
        type: SearchQueryTypes.distance
      } as DistanceSearch);

      expect(Utils.clone(await sm.search(query)))
        .to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [p],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));

      query = ({
        from: {GPSData: {latitude: 10, longitude: 10}},
        distance: 112 * 5, // number of km per degree = ~111km
        type: SearchQueryTypes.distance
      } as DistanceSearch);

      expect(Utils.clone(await sm.search(query)))
        .to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [p, pFaceLess, p4],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));

    });

    /**
     * flattenSameOfQueries converts converts some-of querries to AND and OR queries
     * E.g.:
     * 2-of:(A B C) to (A and (B or C)) or (B and C)
     * this tests makes sure that all queries has at least 2 constraints
     */
    (it('should flatter SOME_OF query', () => {
      const sm = new SearchManagerTest();
      const parser = new SearchQueryParser();
      const alphabet = 'abcdefghijklmnopqrstu';


      const shortestDepth = (q: SearchQueryDTO): number => {
        let depth = 0;
        if ((q as SearchListQuery).list) {
          if (q.type === SearchQueryTypes.AND) {
            for (const l of (q as SearchListQuery).list) {
              depth += shortestDepth(l);
            }
            return depth;
          }
          // its an or
          const lengths = (q as SearchListQuery).list.map(l => shortestDepth(l)).sort();

          if (lengths[0] !== lengths[lengths.length - 1]) {
            for (const l of (q as SearchListQuery).list) {
            }
          }
          return lengths[0];
        }
        return 1;
      };

      const checkBoolLogic = (q: SearchQueryDTO) => {
        if ((q as SearchListQuery).list) {
          expect((q as SearchListQuery).list).to.not.equal(1);
          for (const l of (q as SearchListQuery).list) {
            checkBoolLogic(l);
          }
        }
      };

      // tslint:disable-next-line:prefer-for-of
      for (let i = 1; i < alphabet.length / 2; ++i) {
        const query: SomeOfSearchQuery = {
          type: SearchQueryTypes.SOME_OF,
          min: i,
          //
          list: alphabet.split('').map(t => ({
            type: SearchQueryTypes.file_name,
            text: t
          } as TextSearch))
        };
        const q = sm.flattenSameOfQueries(query);
        expect(shortestDepth(q)).to.equal(i, parser.stringify(query) + '\n' + parser.stringify(q));
        checkBoolLogic(q);
      }
    }) as any).timeout(20000);

    (it('should execute complex SOME_OF query', async () => {
      const sm = new SearchManager();

      const query: SomeOfSearchQuery = {
        type: SearchQueryTypes.SOME_OF,
        min: 5,
        //
        list: 'abcdefghijklmnopqrstu'.split('').map(t => ({
          type: SearchQueryTypes.file_name,
          text: t
        } as TextSearch))
      };
      expect(removeDir(await sm.search(query)))
        .to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [v],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));
    }) as any).timeout(40000);

    it('search result should return directory', async () => {
      Config.Client.Search.listDirectories = true;
      const sm = new SearchManager();

      const query = {
        text: subDir.name,
        type: SearchQueryTypes.any_text
      } as TextSearch;
      expect(removeDir(await sm.search(query)))
        .to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [subDir],
        media: [pFaceLess],
        metaFile: [],
        resultOverflow: false
      } as SearchResultDTO));
    });
    it('search result should return meta files', async () => {
      Config.Client.Search.listMetafiles = true;
      const sm = new SearchManager();

      const query = {
        text: dir.name,
        type: SearchQueryTypes.any_text,
        matchType: TextSearchQueryMatchTypes.exact_match
      } as TextSearch;
      expect(removeDir(await sm.search(query)))
        .to.deep.equalInAnyOrder(removeDir({
        searchQuery: query,
        directories: [],
        media: [p, p2, v],
        metaFile: [gpx],
        resultOverflow: false
      } as SearchResultDTO));
    });

  });


  it('should get random photo', async () => {
    const sm = new SearchManager();

    let query = {
      text: 'xyz',
      type: SearchQueryTypes.keyword
    } as TextSearch;

    // tslint:disable-next-line
    expect(await sm.getRandomPhoto(query)).to.not.exist;

    query = ({
      text: 'wookiees',
      matchType: TextSearchQueryMatchTypes.exact_match,
      type: SearchQueryTypes.keyword
    } as TextSearch);
    expect(Utils.clone(await sm.getRandomPhoto(query))).to.deep.equalInAnyOrder(searchifyMedia(pFaceLess));
  });

});
