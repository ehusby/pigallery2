import {Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique} from 'typeorm';
import {ParentDirectoryDTO, SubDirectoryDTO} from '../../../../../common/entities/DirectoryDTO';
import {MediaEntity} from './MediaEntity';
import {FileEntity} from './FileEntity';
import {columnCharsetCS} from './EntityUtils';
import {MediaDTO} from '../../../../../common/entities/MediaDTO';

@Entity()
@Unique(['name', 'path'])
export class DirectoryEntity implements ParentDirectoryDTO<MediaDTO>, SubDirectoryDTO<MediaDTO> {

  @Index()
  @PrimaryGeneratedColumn({unsigned: true})
  id: number;

  @Index()
  @Column(columnCharsetCS)
  name: string;

  @Index()
  @Column(columnCharsetCS)
  path: string;

  /**
   * last time the directory was modified (from outside, eg.: a new media was added)
   */
  @Column('bigint', {
    unsigned: true, transformer: {
      from: v => parseInt(v, 10),
      to: v => v
    }
  })
  public lastModified: number;

  /**
   * Last time the directory was fully scanned, not only for a few media to create a preview
   */
  @Column({
    type: 'bigint', nullable: true, unsigned: true, transformer: {
      from: v => parseInt(v, 10) || null,
      to: v => v
    }
  })
  public lastScanned: number;

  isPartial?: boolean;

  @Column('smallint', {unsigned: true})
  mediaCount: number;

  @Index()
  @ManyToOne(type => DirectoryEntity, directory => directory.directories, {onDelete: 'CASCADE'})
  public parent: DirectoryEntity;

  @OneToMany(type => DirectoryEntity, dir => dir.parent)
  public directories: DirectoryEntity[];

  // not saving to database, it is only assigned when querying the DB
  public preview: MediaEntity;

  @OneToMany(type => MediaEntity, media => media.directory)
  public media: MediaEntity[];

  @OneToMany(type => FileEntity, file => file.directory)
  public metaFile: FileEntity[];

}
