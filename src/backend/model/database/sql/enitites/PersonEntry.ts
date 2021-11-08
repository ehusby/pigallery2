import {Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique} from 'typeorm';
import {FaceRegionEntry} from './FaceRegionEntry';
import {columnCharsetCS} from './EntityUtils';
import {PersonWithSampleRegion} from '../../../../../common/entities/PersonDTO';


@Entity()
@Unique(['name'])
export class PersonEntry implements PersonWithSampleRegion {

  @Index()
  @PrimaryGeneratedColumn({unsigned: true})
  id: number;

  @Column(columnCharsetCS)
  name: string;

  @Column('int', {unsigned: true, default: 0})
  count: number;

  @Column({default: false})
  isFavourite: boolean;

  @OneToMany(type => FaceRegionEntry, faceRegion => faceRegion.person)
  public faces: FaceRegionEntry[];

  @ManyToOne(type => FaceRegionEntry, {onDelete: 'SET NULL', nullable: true})
  sampleRegion: FaceRegionEntry;


}
