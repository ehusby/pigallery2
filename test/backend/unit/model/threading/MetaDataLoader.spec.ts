import {expect} from 'chai';
import {MetadataLoader} from '../../../../../src/backend/model/threading/MetadataLoader';
import {Utils} from '../../../../../src/common/Utils';
import * as path from 'path';

describe('MetadataLoader', () => {

  it('should load png', async () => {
    const data = await MetadataLoader.loadPhotoMetadata(path.join(__dirname, '/../../../assets/test_png.png'));
    delete data.creationDate; // creation time for png not supported
    const expected = require(path.join(__dirname, '/../../../assets/test_png.json'));
    expect(Utils.clone(data)).to.be.deep.equal(expected);
  });

  it('should load jpg', async () => {
    const data = await MetadataLoader.loadPhotoMetadata(path.join(__dirname, '/../../../assets/test image öüóőúéáű-.,.jpg'));
    const expected = require(path.join(__dirname, '/../../../assets/test image öüóőúéáű-.,.json'));
    expect(Utils.clone(data)).to.be.deep.equal(expected);
  });

  it('should load miss dated jpg', async () => {
    const data = await MetadataLoader.loadPhotoMetadata(path.join(__dirname, '/../../../assets/date_issue.jpg'));
    const expected = require(path.join(__dirname, '/../../../assets/date_issue.json'));
    expect(Utils.clone(data)).to.be.deep.equal(expected);
  });


  it('should load jpg 2', async () => {
    const data = await MetadataLoader.loadPhotoMetadata(path.join(__dirname, '/../../../assets/old_photo.jpg'));
    const expected = require(path.join(__dirname, '/../../../assets/old_photo.json'));
    expect(Utils.clone(data)).to.be.deep.equal(expected);
  });


  it('should load mp4', async () => {
    const data = await MetadataLoader.loadVideoMetadata(path.join(__dirname, '/../../../assets/video.mp4'));
    const expected = require(path.join(__dirname, '/../../../assets/video.json'));
    expect(Utils.clone(data)).to.be.deep.equal(expected);
  });

  it('should respect mp4 rotate transformation', async () => {
    const data = await MetadataLoader.loadVideoMetadata(path.join(__dirname, '/../../../assets/video_rotate.mp4'));
    const expected = require(path.join(__dirname, '/../../../assets/video_rotate.json'));
    expect(Utils.clone(data)).to.be.deep.equal(expected);
  });

});
