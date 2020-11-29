import {VideoMetadata} from '../../../common/entities/VideoDTO';
import {FaceRegion, PhotoMetadata} from '../../../common/entities/PhotoDTO';
import {Config} from '../../../common/config/private/Config';
import {Logger} from '../../Logger';
import * as fs from 'fs';
import {imageSize} from 'image-size';
// @ts-ignore
import * as ExifReader from 'exifreader';
import {ExifParserFactory, OrientationTypes} from 'ts-exif-parser';
import {IptcParser} from 'ts-node-iptc';
import {FFmpegFactory} from '../FFmpegFactory';
import {FfprobeData} from 'fluent-ffmpeg';
import {Utils} from '../../../common/Utils';


const LOG_TAG = '[MetadataLoader]';
const ffmpeg = FFmpegFactory.get();

export class MetadataLoader {

  public static loadVideoMetadata(fullPath: string): Promise<VideoMetadata> {
    return new Promise<VideoMetadata>((resolve) => {
      const metadata: VideoMetadata = {
        size: {
          width: 1,
          height: 1
        },
        bitRate: 0,
        duration: 0,
        creationDate: 0,
        fileSize: 0,
        fps: 0
      };
      try {
        const stat = fs.statSync(fullPath);
        metadata.fileSize = stat.size;
        metadata.creationDate = stat.mtime.getTime();
      } catch (err) {
      }
      try {
        ffmpeg(fullPath).ffprobe((err: any, data: FfprobeData) => {
          if (!!err || data === null || !data.streams[0]) {
            return resolve(metadata);
          }


          try {
            for (let i = 0; i < data.streams.length; i++) {
              if (data.streams[i].width) {
                metadata.size.width = data.streams[i].width;
                metadata.size.height = data.streams[i].height;

                if (Utils.isInt32(parseInt(data.streams[i].rotation, 10)) &&
                  (Math.abs(parseInt(data.streams[i].rotation, 10)) / 90) % 2 === 1) {
                  // noinspection JSSuspiciousNameCombination
                  metadata.size.width = data.streams[i].height;
                  // noinspection JSSuspiciousNameCombination
                  metadata.size.height = data.streams[i].width;
                }

                if (Utils.isInt32(Math.floor(parseFloat(data.streams[i].duration) * 1000))) {
                  metadata.duration = Math.floor(parseFloat(data.streams[i].duration) * 1000);
                }

                if (Utils.isInt32(parseInt(data.streams[i].bit_rate, 10))) {
                  metadata.bitRate = parseInt(data.streams[i].bit_rate, 10) || null;
                }
                if (Utils.isInt32(parseInt(data.streams[i].avg_frame_rate, 10))) {
                  metadata.fps = parseInt(data.streams[i].avg_frame_rate, 10) || null;
                }
                metadata.creationDate = Date.parse(data.streams[i].tags.creation_time) || metadata.creationDate;
                break;
              }
            }

          } catch (err) {
          }
          metadata.creationDate = metadata.creationDate || 0;

          return resolve(metadata);
        });
      } catch (e) {
        return resolve(metadata);
      }
    });
  }

  public static loadPhotoMetadata(fullPath: string): Promise<PhotoMetadata> {
    return new Promise<PhotoMetadata>((resolve, reject) => {
        const fd = fs.openSync(fullPath, 'r');

        const data = Buffer.allocUnsafe(Config.Server.photoMetadataSize);
        fs.read(fd, data, 0, Config.Server.photoMetadataSize, 0, (err) => {
          fs.closeSync(fd);
          if (err) {
            return reject({file: fullPath, error: err});
          }
          const metadata: PhotoMetadata = {
            size: {width: 1, height: 1},
            orientation: OrientationTypes.TOP_LEFT,
            creationDate: 0,
            fileSize: 0
          };
          try {

            try {
              const stat = fs.statSync(fullPath);
              metadata.fileSize = stat.size;
              metadata.creationDate = stat.mtime.getTime();
            } catch (err) {
            }

            try {
              const exif = ExifParserFactory.create(data).parse();
              if (exif.tags.ISO || exif.tags.Model ||
                exif.tags.Make || exif.tags.FNumber ||
                exif.tags.ExposureTime || exif.tags.FocalLength ||
                exif.tags.LensModel) {
                metadata.cameraData = {
                  model: exif.tags.Model,
                  make: exif.tags.Make,
                  lens: exif.tags.LensModel
                };
                if (Utils.isUInt32(exif.tags.ISO)) {
                  metadata.cameraData.ISO = exif.tags.ISO;
                }
                if (Utils.isFloat32(exif.tags.ISO)) {
                  metadata.cameraData.focalLength = exif.tags.FocalLength;
                }
                if (Utils.isFloat32(exif.tags.ExposureTime)) {
                  metadata.cameraData.exposure = exif.tags.ExposureTime;
                }
                if (Utils.isFloat32(exif.tags.FNumber)) {
                  metadata.cameraData.fStop = exif.tags.FNumber;
                }
              }
              if (!isNaN(exif.tags.GPSLatitude) || exif.tags.GPSLongitude || exif.tags.GPSAltitude) {
                metadata.positionData = metadata.positionData || {};
                metadata.positionData.GPSData = {};

                if (Utils.isFloat32(exif.tags.GPSLongitude)) {
                  metadata.positionData.GPSData.longitude = exif.tags.GPSLongitude;
                }
                if (Utils.isFloat32(exif.tags.GPSLatitude)) {
                  metadata.positionData.GPSData.latitude = exif.tags.GPSLatitude;
                }
                if (Utils.isInt32(exif.tags.GPSAltitude)) {
                  metadata.positionData.GPSData.altitude = exif.tags.GPSAltitude;
                }
              }

              if (exif.tags.CreateDate || exif.tags.DateTimeOriginal || exif.tags.ModifyDate) {
                metadata.creationDate = (exif.tags.DateTimeOriginal || exif.tags.CreateDate || exif.tags.ModifyDate) * 1000;

              }

              if (exif.tags.Orientation) {
                metadata.orientation = exif.tags.Orientation;
              }

              if (exif.imageSize) {
                metadata.size = {width: exif.imageSize.width, height: exif.imageSize.height};
              } else if (exif.tags.RelatedImageWidth && exif.tags.RelatedImageHeight) {
                metadata.size = {width: exif.tags.RelatedImageWidth, height: exif.tags.RelatedImageHeight};
              } else {
                const info = imageSize(fullPath);
                metadata.size = {width: info.width, height: info.height};
              }
            } catch (err) {
              Logger.debug(LOG_TAG, 'Error parsing exif', fullPath, err);
              try {
                const info = imageSize(fullPath);
                metadata.size = {width: info.width, height: info.height};
              } catch (e) {
                metadata.size = {width: 1, height: 1};
              }
            }

            try {
              const iptcData = IptcParser.parse(data);
              if (iptcData.country_or_primary_location_name) {
                metadata.positionData = metadata.positionData || {};
                metadata.positionData.country = iptcData.country_or_primary_location_name.replace(/\0/g, '').trim();
              }
              if (iptcData.province_or_state) {
                metadata.positionData = metadata.positionData || {};
                metadata.positionData.state = iptcData.province_or_state.replace(/\0/g, '').trim();
              }
              if (iptcData.city) {
                metadata.positionData = metadata.positionData || {};
                metadata.positionData.city = iptcData.city.replace(/\0/g, '').trim();
              }
              if (iptcData.caption) {
                metadata.caption = iptcData.caption.replace(/\0/g, '').trim();
              }
              metadata.keywords = iptcData.keywords || [];

              metadata.creationDate = <number>(iptcData.date_time ? iptcData.date_time.getTime() : metadata.creationDate);

            } catch (err) {
              // Logger.debug(LOG_TAG, 'Error parsing iptc data', fullPath, err);
            }

            metadata.creationDate = metadata.creationDate || 0;

            if (Config.Client.Faces.enabled) {
              try {

                const ret = ExifReader.load(data);
                const faces: FaceRegion[] = [];
                if (ret.Regions && ret.Regions.value.RegionList && ret.Regions.value.RegionList.value) {
                  for (let i = 0; i < ret.Regions.value.RegionList.value.length; i++) {
                    if (!ret.Regions.value.RegionList.value[i].value ||
                      !ret.Regions.value.RegionList.value[i].value['rdf:Description'] ||
                      !ret.Regions.value.RegionList.value[i].value['rdf:Description'].value ||
                      !ret.Regions.value.RegionList.value[i].value['rdf:Description'].value['mwg-rs:Area']) {
                      continue;
                    }
                    const region = ret.Regions.value.RegionList.value[i].value['rdf:Description'];
                    const regionBox = ret.Regions.value.RegionList.value[i].value['rdf:Description'].value['mwg-rs:Area'].attributes;
                    if (region.attributes['mwg-rs:Type'] !== 'Face' ||
                      !region.attributes['mwg-rs:Name']) {
                      continue;
                    }
                    const name = region.attributes['mwg-rs:Name'];
                    const box = {
                      width: Math.round(parseFloat('' + regionBox['stArea:w']) * metadata.size.width),
                      height: Math.round(parseFloat('' + regionBox['stArea:h']) * metadata.size.height),
                      left: Math.round(parseFloat('' + regionBox['stArea:x']) * metadata.size.width),
                      top: Math.round(parseFloat('' + regionBox['stArea:y']) * metadata.size.height)
                    };
                    // convert center base box to corner based box
                    box.left = Math.max(0, box.left - box.width / 2);
                    box.top = Math.max(0, box.top - box.height / 2);
                    faces.push({name: name, box: box});
                  }
                }
                if (Config.Client.Faces.keywordsToPersons && faces.length > 0) {
                  metadata.faces = faces; // save faces
                  // remove faces from keywords
                  metadata.faces.forEach(f => {
                    const index = metadata.keywords.indexOf(f.name);
                    if (index !== -1) {
                      metadata.keywords.splice(index, 1);
                    }
                  });
                }
              } catch (err) {
              }
            }


            return resolve(metadata);
          } catch (err) {
            return reject({file: fullPath, error: err});
          }
        });
      }
    );
  }

}
