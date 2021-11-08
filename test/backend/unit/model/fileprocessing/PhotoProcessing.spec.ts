import {expect} from 'chai';
import {Config} from '../../../../../src/common/config/private/Config';
import {ProjectPath} from '../../../../../src/backend/ProjectPath';
import * as path from 'path';
import {PhotoProcessing} from '../../../../../src/backend/model/fileprocessing/PhotoProcessing';


describe('PhotoProcessing', () => {

  // tslint:disable:no-unused-expression
  it('should generate converted file path', async () => {

    Config.load();
    Config.Client.Media.Thumbnail.thumbnailSizes = [];
    ProjectPath.ImageFolder = path.join(__dirname, './../../../assets');
    const photoPath = path.join(ProjectPath.ImageFolder, 'test_png.png');

    expect(await PhotoProcessing
      .isValidConvertedPath(PhotoProcessing.generateConvertedPath(photoPath,
        Config.Server.Media.Photo.Converting.resolution)))
      .to.be.true;

    expect(await PhotoProcessing
      .isValidConvertedPath(PhotoProcessing.generateConvertedPath(photoPath + 'noPath',
        Config.Server.Media.Photo.Converting.resolution)))
      .to.be.false;

    {
      const convertedPath = PhotoProcessing.generateConvertedPath(photoPath,
        Config.Server.Media.Photo.Converting.resolution);
      Config.Server.Media.Photo.Converting.resolution = (1 as any);
      expect(await PhotoProcessing.isValidConvertedPath(convertedPath)).to.be.false;
    }
  });

  // tslint:disable:no-unused-expression
  it('should generate converted thumbnail path', async () => {

    Config.load();
    Config.Server.Media.Photo.Converting.resolution = (null as any);
    Config.Client.Media.Thumbnail.thumbnailSizes = [10, 20];
    ProjectPath.ImageFolder = path.join(__dirname, './../../../assets');
    const photoPath = path.join(ProjectPath.ImageFolder, 'test_png.png');

    for (const thSize of Config.Client.Media.Thumbnail.thumbnailSizes) {
      expect(await PhotoProcessing
        .isValidConvertedPath(PhotoProcessing.generateConvertedPath(photoPath, thSize)))
        .to.be.true;


      expect(await PhotoProcessing
        .isValidConvertedPath(PhotoProcessing.generateConvertedPath(photoPath + 'noPath', thSize)))
        .to.be.false;
    }


    expect(await PhotoProcessing
      .isValidConvertedPath(PhotoProcessing.generateConvertedPath(photoPath, 30)))
      .to.be.false;

  });

});
