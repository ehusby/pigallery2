import {Metadata, Sharp} from 'sharp';
import {Logger} from '../../Logger';
import {FfmpegCommand, FfprobeData} from 'fluent-ffmpeg';
import {FFmpegFactory} from '../FFmpegFactory';
import {ServerConfig} from '../../../common/config/private/PrivateConfig';

export class PhotoWorker {

  private static imageRenderer: (input: RendererInput) => Promise<void> = null;
  private static videoRenderer: (input: RendererInput) => Promise<void> = null;
  private static rendererType: ServerConfig.PhotoProcessingLib = null;

  public static render(input: RendererInput, renderer: ServerConfig.PhotoProcessingLib): Promise<void> {
    if (input.type === ThumbnailSourceType.Photo) {
      return this.renderFromImage(input, renderer);
    }
    if (input.type === ThumbnailSourceType.Video) {
      return this.renderFromVideo(input);
    }
    throw new Error('Unsupported media type to render thumbnail:' + input.type);
  }

  public static renderFromImage(input: RendererInput, renderer: ServerConfig.PhotoProcessingLib): Promise<void> {
    if (PhotoWorker.rendererType !== renderer) {
      PhotoWorker.imageRenderer = ImageRendererFactory.build(renderer);
      PhotoWorker.rendererType = renderer;
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
      return new Promise((resolve, reject) => {

        Logger.silly('[FFmpeg] rendering thumbnail: ' + input.mediaPath);

        ffmpeg(input.mediaPath).ffprobe((err: any, data: FfprobeData) => {
          if (!!err || data === null) {
            return reject('[FFmpeg] ' + err.toString());
          }
          /// console.log(data);
          let width = null;
          let height = null;
          for (let i = 0; i < data.streams.length; i++) {
            if (data.streams[i].width) {
              width = data.streams[i].width;
              height = data.streams[i].height;
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
            .on('start', (cmd) => {
              executedCmd = cmd;
            })
            .on('end', () => {
              resolve();
            })
            .on('error', (e) => {
              reject('[FFmpeg] ' + e.toString() + ' executed: ' + executedCmd);
            })
            .outputOptions(['-qscale:v 4']);
          if (input.makeSquare === false) {
            const newSize = width < height ? Math.min(input.size, width) + 'x?' : '?x' + Math.min(input.size, height);
            command.takeScreenshots({
              timemarks: ['10%'], size: newSize, filename: fileName, folder: folder
            });


          } else {
            command.takeScreenshots({
              timemarks: ['10%'], size: input.size + 'x' + input.size, filename: fileName, folder: folder
            });
          }
        });
      });
    };
  }
}

export class ImageRendererFactory {

  public static build(renderer: ServerConfig.PhotoProcessingLib): (input: RendererInput) => Promise<void> {
    switch (renderer) {
      case ServerConfig.PhotoProcessingLib.Jimp:
        return ImageRendererFactory.Jimp();
      case ServerConfig.PhotoProcessingLib.sharp:
        return ImageRendererFactory.Sharp();
    }
    throw new Error('unknown renderer');
  }

  public static Jimp() {
    const Jimp = require('jimp');
    return async (input: RendererInput): Promise<void> => {
      // generate thumbnail
      Logger.silly('[JimpThRenderer] rendering thumbnail:' + input.mediaPath);
      const image = await Jimp.read(input.mediaPath);
      /**
       * newWidth * newHeight = size*size
       * newHeight/newWidth = height/width
       *
       * newHeight = (height/width)*newWidth
       * newWidth * newWidth = (size*size) / (height/width)
       *
       * @type {number}
       */
      const ratio = image.bitmap.height / image.bitmap.width;
      const algo = input.qualityPriority === true ? Jimp.RESIZE_BEZIER : Jimp.RESIZE_NEAREST_NEIGHBOR;

      if (input.cut) {
        image.crop(
          input.cut.left,
          input.cut.top,
          input.cut.width,
          input.cut.height
        );
      }
      if (input.makeSquare === false) {
        if (image.bitmap.width < image.bitmap.height) {
          image.resize(Math.min(input.size, image.bitmap.width), Jimp.AUTO, algo);
        } else {
          image.resize(Jimp.AUTO, Math.min(image.size, image.bitmap.height), algo);
        }

      } else {
        image.resize(input.size / Math.min(ratio, 1), Jimp.AUTO, algo);
        image.crop(0, 0, input.size, input.size);
      }
      image.quality(60);        // set JPEG quality

      await new Promise((resolve, reject) => {
        image.write(input.outPath, (err: Error | null) => { // save
          if (err) {
            return reject('[JimpThRenderer] ' + err.toString());
          }
          resolve();
        });
      });

    };
  }


  public static Sharp() {
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
            kernel: kernel
          });
        } else {
          image.resize(null, Math.min(input.size, metadata.height), {
            kernel: kernel
          });
        }


      } else {
        image
          .resize(input.size, input.size, {
            kernel: kernel,
            position: sharp.gravity.centre,
            fit: 'cover'
          });
      }
      await image.withMetadata().jpeg().toFile(input.outPath);
    };
  }


}
