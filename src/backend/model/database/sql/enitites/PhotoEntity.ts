import {ChildEntity, Column} from 'typeorm';
import {CameraMetadata, GPSMetadata, PhotoDTO, PhotoMetadata, PositionMetaData} from '../../../../../common/entities/PhotoDTO';
import {MediaEntity, MediaMetadataEntity} from './MediaEntity';
import {columnCharsetCS} from './EntityUtils';




export class PhotoMetadataEntity extends MediaMetadataEntity implements PhotoMetadata {
  /*
    @Column('simple-array')
    keywords: string[];

    @Column(type => CameraMetadataEntity)
    cameraData: CameraMetadataEntity;

    @Column(type => PositionMetaDataEntity)
    positionData: PositionMetaDataEntity;

    @Column('tinyint', {default: OrientationTypes.TOP_LEFT})
    orientation: OrientationTypes;
  */
}


@ChildEntity()
export class PhotoEntity extends MediaEntity implements PhotoDTO {
  @Column(type => PhotoMetadataEntity)
  metadata: PhotoMetadataEntity;
}
