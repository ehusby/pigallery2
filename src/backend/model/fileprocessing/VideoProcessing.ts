import * as path from 'path';
import {constants as fsConstants, promises as fsp} from 'fs';
import {ITaskExecuter, TaskExecuter} from '../threading/TaskExecuter';
import {VideoConverterInput, VideoConverterWorker} from '../threading/VideoConverterWorker';
import {MetadataLoader} from '../threading/MetadataLoader';
import {Config} from '../../../common/config/private/Config';
import {ProjectPath} from '../../ProjectPath';
import {SupportedFormats} from '../../../common/SupportedFormats';


export class VideoProcessing {
  private static taskQue: ITaskExecuter<VideoConverterInput, void> =
    new TaskExecuter(1, ((input): Promise<void> => VideoConverterWorker.convert(input)));

  public static generateConvertedFilePath(videoPath: string): string {
    return path.join(ProjectPath.TranscodedFolder,
      ProjectPath.getRelativePathToImages(path.dirname(videoPath)),
      path.basename(videoPath) + '_' + this.getConvertedFilePostFix());
  }

  public static async isValidConvertedPath(convertedPath: string): Promise<boolean> {

    const origFilePath = path.join(ProjectPath.ImageFolder,
      path.relative(ProjectPath.TranscodedFolder,
        convertedPath.substring(0, convertedPath.lastIndexOf('_'))));

    const postfix = convertedPath.substring(convertedPath.lastIndexOf('_') + 1, convertedPath.length);

    if (postfix !== this.getConvertedFilePostFix()) {
      return false;
    }

    try {
      await fsp.access(origFilePath, fsConstants.R_OK);
    } catch (e) {
      return false;
    }


    return true;
  }


  static async convertedVideoExist(videoPath: string): Promise<boolean> {
    const outPath = this.generateConvertedFilePath(videoPath);

    try {
      await fsp.access(outPath, fsConstants.R_OK);
      return true;
    } catch (e) {
    }

    return false;
  }

  public static async convertVideo(videoPath: string): Promise<void> {


    const outPath = this.generateConvertedFilePath(videoPath);

    try {
      await fsp.access(outPath, fsConstants.R_OK);
      return;
    } catch (e) {
    }

    const metaData = await MetadataLoader.loadVideoMetadata(videoPath);

    const renderInput: VideoConverterInput = {
      videoPath,
      output: {
        path: outPath,
        codec: Config.Server.Media.Video.transcoding.codec,
        format: Config.Server.Media.Video.transcoding.format,
        crf: Config.Server.Media.Video.transcoding.crf,
        preset: Config.Server.Media.Video.transcoding.preset,
        customOptions: Config.Server.Media.Video.transcoding.customOptions,
      }
    };

    if (metaData.bitRate > Config.Server.Media.Video.transcoding.bitRate) {
      renderInput.output.bitRate = Config.Server.Media.Video.transcoding.bitRate;
    }
    if (metaData.fps > Config.Server.Media.Video.transcoding.fps) {
      renderInput.output.fps = Config.Server.Media.Video.transcoding.fps;
    }

    if (Config.Server.Media.Video.transcoding.resolution < metaData.size.height) {
      renderInput.output.resolution = Config.Server.Media.Video.transcoding.resolution;
    }

    const outDir = path.dirname(renderInput.output.path);

    await fsp.mkdir(outDir, {recursive: true});
    await VideoProcessing.taskQue.execute(renderInput);

  }

  public static isVideo(fullPath: string): boolean {
    const extension = path.extname(fullPath).toLowerCase();
    return SupportedFormats.WithDots.Videos.indexOf(extension) !== -1;
  }

  protected static getConvertedFilePostFix(): string {
    return Math.round(Config.Server.Media.Video.transcoding.bitRate / 1024) + 'k' +
      Config.Server.Media.Video.transcoding.codec.toString().toLowerCase() +
      Config.Server.Media.Video.transcoding.resolution +
      '.' + Config.Server.Media.Video.transcoding.format.toLowerCase();
  }

}

