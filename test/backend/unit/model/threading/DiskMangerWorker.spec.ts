import {expect} from 'chai';
import {DiskMangerWorker} from '../../../../../src/backend/model/threading/DiskMangerWorker';
import * as path from 'path';
import {Config} from '../../../../../src/common/config/private/Config';
import {ProjectPath} from '../../../../../src/backend/ProjectPath';
import {Utils} from '../../../../../src/common/Utils';

describe('DiskMangerWorker', () => {

  it('should parse metadata', async () => {
    Config.Server.Media.folder = path.join(__dirname, '/../../../assets');
    ProjectPath.ImageFolder = path.join(__dirname, '/../../../assets');
    const dir = await DiskMangerWorker.scanDirectory('/');
    expect(dir.media.length).to.be.equals(6);
    const expected = require(path.join(__dirname, '/../../../assets/test image öüóőúéáű-.,.json'));
    expect(Utils.clone(dir.media[2].name)).to.be.deep.equal('test image öüóőúéáű-.,.jpg');
    expect(Utils.clone(dir.media[2].metadata)).to.be.deep.equal(expected);
  });

});
