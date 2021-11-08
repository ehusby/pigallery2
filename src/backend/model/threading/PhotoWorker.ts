import {Metadata, Sharp} from 'sharp';
import {Logger} from '../../Logger';
import {FfmpegCommand, FfprobeData} from 'fluent-ffmpeg';
import {FFmpegFactory} from '../FFmpegFactory';

export class PhotoWorker {

  private static imageRenderer: (input: RendererInput) => Promise<void> = null;
  private static videoRenderer: (input: RendererInput) => Promise<void> = null;

  public static render(input: RendererInput): Promise<void> {
    if (input.type === ThumbnailSourceType.Photo) {
      return this.renderFromImage(input);
    }
    if (input.type === ThumbnailSourceType.Video) {
      return this.renderFromVideo(input);
    }
    throw new Error('Unsupported media type to render thumbnail:' + input.type);
  }

  public static renderFromImage(input: RendererInput): Promise<void> {
    if (PhotoWorker.imageRenderer === null) {
      PhotoWorker.imageRenderer = ImageRendererFactory.build();
    }
    return PhotoWorker.imageRenderer(input);
  }


  public static renderFromVideo(input: RendererInput): Promise<void> {
    if (PhotoWorker.videoRenderer === null) {
      PhotoWorker.videoRenderer = VideoRendererFactory.build();
    }
    return PhotoWorker.videoRenderer(input);
  }

}

export enum ThumbnailSourceType {
  Photo = 1, Video = 2
}

export interface RendererInput {
  type: ThumbnailSourceType;
  mediaPath: string;
  size: number;
  makeSquare: boolean;
  outPath: string;
  qualityPriority: boolean;
  cut?: {
    left: number,
    top: number,
    width: number,
    height: number
  };
}

export class VideoRendererFactory {
  public static build(): (input: RendererInput) => Promise<void> {
    const ffmpeg = FFmpegFactory.get();
    const path = require('path');
    return (input: RendererInput): Promise<void> => {
      return new Promise((resolve, reject): void => {

        Logger.silly('[FFmpeg] rendering thumbnail: ' + input.mediaPath);

        ffmpeg(input.mediaPath).ffprobe((err: any, data: FfprobeData): void => {
          if (!!err || data === null) {
            return reject('[FFmpeg] ' + err.toString());
          }

          let width = null;
          let height = null;
          for (const stream of data.streams) {
            if (stream.width) {
              width = stream.width;
              height = stream.height;
              break;
            }
          }
          if (!width || !height) {
            return reject('[FFmpeg] Can not read video dimension');
          }
          const command: FfmpegCommand = ffmpeg(input.mediaPath);
          const fileName = path.basename(input.outPath);
          const folder = path.dirname(input.outPath);
          let executedCmd = '';
          command
            .on('start', (cmd): void => {
              executedCmd = cmd;
            })
            .on('end', (): void => {
              resolve();
            })
            .on('error', (e): void => {
              reject('[FFmpeg] ' + e.toString() + ' executed: ' + executedCmd);
            })
            .outputOptions(['-qscale:v 4']);
          if (input.makeSquare === false) {
            const newSize = width < height ? Math.min(input.size, width) + 'x?' : '?x' + Math.min(input.size, height);
            command.takeScreenshots({
              timemarks: ['10%'], size: newSize, filename: fileName, folder
            });


          } else {
            command.takeScreenshots({
              timemarks: ['10%'], size: input.size + 'x' + input.size, filename: fileName, folder
            });
          }
        });
      });
    };
  }
}

export class ImageRendererFactory {

  public static build(): (input: RendererInput) => Promise<void> {
    return ImageRendererFactory.Sharp();
  }

  public static Sharp(): (input: RendererInput) => Promise<void> {
    const sharp = require('sharp');
    sharp.cache(false);
    return async (input: RendererInput): Promise<void> => {
      Logger.silly('[SharpRenderer] rendering photo:' + input.mediaPath + ', size:' + input.size);
      const image: Sharp = sharp(input.mediaPath, {failOnError: false});
      const metadata: Metadata = await image.metadata();


      const kernel = input.qualityPriority === true ? sharp.kernel.lanczos3 : sharp.kernel.nearest;

      if (input.cut) {
        image.extract(input.cut);
      }
      if (input.makeSquare === false) {
        if (metadata.height > metadata.width) {
          image.resize(Math.min(input.size, metadata.width), null, {
            kernel
          });
        } else {
          image.resize(null, Math.min(input.size, metadata.height), {
            kernel
          });
        }


      } else {
        image
          .resize(input.size, input.size, {
            kernel,
            position: sharp.gravity.centre,
            fit: 'cover'
          });
      }
      await image.withMetadata().jpeg().toFile(input.outPath);
    };
  }


}
