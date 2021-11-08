import {FaceRegion, FaceRegionBox} from '../../../../../common/entities/PhotoDTO';
import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {PersonEntry} from './PersonEntry';
import {MediaEntity} from './MediaEntity';

export class FaceRegionBoxEntry implements FaceRegionBox {
  @Column('int')
  height: number;
  @Column('int')
  width: number;
  @Column('int')
  left: number;
  @Column('int')
  top: number;
}

/**
 * This is a switching table between media and persons
 */
@Entity()
export class FaceRegionEntry {

  @PrimaryGeneratedColumn({unsigned: true})
  id: number;

  @Column(type => FaceRegionBoxEntry)
  box: FaceRegionBoxEntry;

  @ManyToOne(type => MediaEntity, media => media.metadata.faces, {onDelete: 'CASCADE', nullable: false})
  media: MediaEntity;

  @ManyToOne(type => PersonEntry, person => person.faces, {onDelete: 'CASCADE', nullable: false})
  person: PersonEntry;

  name: string;

}
