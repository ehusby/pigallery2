import {AutoCompleteItem, SearchTypes} from '../../../../common/entities/AutoCompleteItem';
import {ISearchManager} from '../interfaces/ISearchManager';
import {SearchResultDTO} from '../../../../common/entities/SearchResultDTO';
import {SQLConnection} from './SQLConnection';
import {PhotoEntity} from './enitites/PhotoEntity';
import {DirectoryEntity} from './enitites/DirectoryEntity';
import {MediaEntity} from './enitites/MediaEntity';
import {VideoEntity} from './enitites/VideoEntity';
import {PersonEntry} from './enitites/PersonEntry';
import {FaceRegionEntry} from './enitites/FaceRegionEntry';
import {SelectQueryBuilder} from 'typeorm';
import {Config} from '../../../../common/config/private/Config';

export class SearchManager implements ISearchManager {

  private static autoCompleteItemsUnique(array: Array<AutoCompleteItem>): Array<AutoCompleteItem> {
    const a = array.concat();
    for (let i = 0; i < a.length; ++i) {
      for (let j = i + 1; j < a.length; ++j) {
        if (a[i].equals(a[j])) {
          a.splice(j--, 1);
        }
      }
    }

    return a;
  }

  async autocomplete(text: string): Promise<AutoCompleteItem[]> {

    const connection = await SQLConnection.getConnection();

    let result: AutoCompleteItem[] = [];
    const photoRepository = connection.getRepository(PhotoEntity);
    const videoRepository = connection.getRepository(VideoEntity);
    const personRepository = connection.getRepository(PersonEntry);
    const directoryRepository = connection.getRepository(DirectoryEntity);


    (await photoRepository
      .createQueryBuilder('photo')
      .select('DISTINCT(photo.metadata.keywords)')
      .where('photo.metadata.keywords LIKE :text COLLATE utf8_general_ci', {text: '%' + text + '%'})
      .limit(Config.Client.Search.AutoComplete.maxItemsPerCategory)
      .getRawMany())
      .map(r => <Array<string>>(<string>r.metadataKeywords).split(','))
      .forEach(keywords => {
        result = result.concat(this.encapsulateAutoComplete(keywords
          .filter(k => k.toLowerCase().indexOf(text.toLowerCase()) !== -1), SearchTypes.keyword));
      });

    result = result.concat(this.encapsulateAutoComplete((await personRepository
      .createQueryBuilder('person')
      .select('DISTINCT(person.name)')
      .where('person.name LIKE :text COLLATE utf8_general_ci', {text: '%' + text + '%'})
      .limit(Config.Client.Search.AutoComplete.maxItemsPerCategory)
      .orderBy('person.name')
      .getRawMany())
      .map(r => r.name), SearchTypes.person));

    (await photoRepository
      .createQueryBuilder('photo')
      .select('photo.metadata.positionData.country as country, ' +
        'photo.metadata.positionData.state as state, photo.metadata.positionData.city as city')
      .where('photo.metadata.positionData.country LIKE :text COLLATE utf8_general_ci', {text: '%' + text + '%'})
      .orWhere('photo.metadata.positionData.state LIKE :text COLLATE utf8_general_ci', {text: '%' + text + '%'})
      .orWhere('photo.metadata.positionData.city LIKE :text COLLATE utf8_general_ci', {text: '%' + text + '%'})
      .groupBy('photo.metadata.positionData.country, photo.metadata.positionData.state, photo.metadata.positionData.city')
      .limit(Config.Client.Search.AutoComplete.maxItemsPerCategory)
      .getRawMany())
      .filter(pm => !!pm)
      .map(pm => <Array<string>>[pm.city || '', pm.country || '', pm.state || ''])
      .forEach(positions => {
        result = result.concat(this.encapsulateAutoComplete(positions
          .filter(p => p.toLowerCase().indexOf(text.toLowerCase()) !== -1), SearchTypes.position));
      });

    result = result.concat(this.encapsulateAutoComplete((await photoRepository
      .createQueryBuilder('media')
      .select('DISTINCT(media.name)')
      .where('media.name LIKE :text COLLATE utf8_general_ci', {text: '%' + text + '%'})
      .limit(Config.Client.Search.AutoComplete.maxItemsPerCategory)
      .getRawMany())
      .map(r => r.name), SearchTypes.photo));


    result = result.concat(this.encapsulateAutoComplete((await photoRepository
      .createQueryBuilder('media')
      .select('DISTINCT(media.metadata.caption) as caption')
      .where('media.metadata.caption LIKE :text COLLATE utf8_general_ci', {text: '%' + text + '%'})
      .limit(Config.Client.Search.AutoComplete.maxItemsPerCategory)
      .getRawMany())
      .map(r => r.caption), SearchTypes.photo));


    result = result.concat(this.encapsulateAutoComplete((await videoRepository
      .createQueryBuilder('media')
      .select('DISTINCT(media.name)')
      .where('media.name LIKE :text COLLATE utf8_general_ci', {text: '%' + text + '%'})
      .limit(Config.Client.Search.AutoComplete.maxItemsPerCategory)
      .getRawMany())
      .map(r => r.name), SearchTypes.video));

    result = result.concat(this.encapsulateAutoComplete((await directoryRepository
      .createQueryBuilder('dir')
      .select('DISTINCT(dir.name)')
      .where('dir.name LIKE :text COLLATE utf8_general_ci', {text: '%' + text + '%'})
      .limit(Config.Client.Search.AutoComplete.maxItemsPerCategory)
      .getRawMany())
      .map(r => r.name), SearchTypes.directory));


    return SearchManager.autoCompleteItemsUnique(result);
  }

  async search(text: string, searchType: SearchTypes): Promise<SearchResultDTO> {
    const connection = await SQLConnection.getConnection();

    const result: SearchResultDTO = {
      searchText: text,
      searchType: searchType,
      directories: [],
      media: [],
      metaFile: [],
      resultOverflow: false
    };

    let usedEntity = MediaEntity;

    if (searchType === SearchTypes.photo) {
      usedEntity = PhotoEntity;
    } else if (searchType === SearchTypes.video) {
      usedEntity = VideoEntity;
    }

    const query = await connection.getRepository(usedEntity).createQueryBuilder('media')
      .innerJoin(q => {
          const subQuery = q.from(usedEntity, 'media')
            .select('distinct media.id')
            .limit(Config.Client.Search.maxMediaResult + 1);


          if (!searchType || searchType === SearchTypes.directory) {
            subQuery.leftJoin('media.directory', 'directory')
              .orWhere('directory.name LIKE :text COLLATE utf8_general_ci', {text: '%' + text + '%'});
          }

          if (!searchType || searchType === SearchTypes.photo || searchType === SearchTypes.video) {
            subQuery.orWhere('media.name LIKE :text COLLATE utf8_general_ci', {text: '%' + text + '%'});
          }

          if (!searchType || searchType === SearchTypes.photo) {
            subQuery.orWhere('media.metadata.caption LIKE :text COLLATE utf8_general_ci', {text: '%' + text + '%'});
          }
          if (!searchType || searchType === SearchTypes.person) {
            subQuery
              .leftJoin('media.metadata.faces', 'faces')
              .leftJoin('faces.person', 'person')
              .orWhere('person.name LIKE :text COLLATE utf8_general_ci', {text: '%' + text + '%'});
          }

          if (!searchType || searchType === SearchTypes.position) {
            subQuery.orWhere('media.metadata.positionData.country LIKE :text COLLATE utf8_general_ci', {text: '%' + text + '%'})
              .orWhere('media.metadata.positionData.state LIKE :text COLLATE utf8_general_ci', {text: '%' + text + '%'})
              .orWhere('media.metadata.positionData.city LIKE :text COLLATE utf8_general_ci', {text: '%' + text + '%'});

          }
          if (!searchType || searchType === SearchTypes.keyword) {
            subQuery.orWhere('media.metadata.keywords LIKE :text COLLATE utf8_general_ci', {text: '%' + text + '%'});
          }

          return subQuery;
        },
        'innerMedia',
        'media.id=innerMedia.id')
      .leftJoinAndSelect('media.directory', 'directory')
      .leftJoinAndSelect('media.metadata.faces', 'faces')
      .leftJoinAndSelect('faces.person', 'person');


    result.media = await this.loadMediaWithFaces(query);

    if (result.media.length > Config.Client.Search.maxMediaResult) {
      result.resultOverflow = true;
    }

    result.directories = await connection
      .getRepository(DirectoryEntity)
      .createQueryBuilder('dir')
      .where('dir.name LIKE :text COLLATE utf8_general_ci', {text: '%' + text + '%'})
      .limit(Config.Client.Search.maxMediaResult + 1)
      .getMany();

    if (result.directories.length > Config.Client.Search.maxDirectoryResult) {
      result.resultOverflow = true;
    }

    return result;
  }

  async instantSearch(text: string): Promise<SearchResultDTO> {
    const connection = await SQLConnection.getConnection();

    const result: SearchResultDTO = {
      searchText: text,
      // searchType:undefined, not adding this
      directories: [],
      media: [],
      metaFile: [],
      resultOverflow: false
    };

    const query = await connection.getRepository(MediaEntity).createQueryBuilder('media')
      .innerJoin(q => q.from(MediaEntity, 'media')
          .select('distinct media.id')
          .limit(10)
          .leftJoin('media.directory', 'directory')
          .leftJoin('media.metadata.faces', 'faces')
          .leftJoin('faces.person', 'person')
          .where('media.metadata.keywords LIKE :text COLLATE utf8_general_ci', {text: '%' + text + '%'})
          .orWhere('media.metadata.positionData.country LIKE :text COLLATE utf8_general_ci', {text: '%' + text + '%'})
          .orWhere('media.metadata.positionData.state LIKE :text COLLATE utf8_general_ci', {text: '%' + text + '%'})
          .orWhere('media.metadata.positionData.city LIKE :text COLLATE utf8_general_ci', {text: '%' + text + '%'})
          .orWhere('media.name LIKE :text COLLATE utf8_general_ci', {text: '%' + text + '%'})
          .orWhere('media.metadata.caption LIKE :text COLLATE utf8_general_ci', {text: '%' + text + '%'})
          .orWhere('person.name LIKE :text COLLATE utf8_general_ci', {text: '%' + text + '%'})
        ,
        'innerMedia',
        'media.id=innerMedia.id')
      .leftJoinAndSelect('media.directory', 'directory')
      .leftJoinAndSelect('media.metadata.faces', 'faces')
      .leftJoinAndSelect('faces.person', 'person');


    result.media = await this.loadMediaWithFaces(query);


    result.directories = await connection
      .getRepository(DirectoryEntity)
      .createQueryBuilder('dir')
      .where('dir.name LIKE :text COLLATE utf8_general_ci', {text: '%' + text + '%'})
      .limit(10)
      .getMany();

    return result;
  }

  private encapsulateAutoComplete(values: string[], type: SearchTypes): Array<AutoCompleteItem> {
    const res: AutoCompleteItem[] = [];
    values.forEach((value) => {
      res.push(new AutoCompleteItem(value, type));
    });
    return res;
  }

  private async loadMediaWithFaces(query: SelectQueryBuilder<MediaEntity>) {
    const rawAndEntities = await query.orderBy('media.id').getRawAndEntities();
    const media: MediaEntity[] = rawAndEntities.entities;

    let rawIndex = 0;
    for (let i = 0; i < media.length; i++) {
      if (rawAndEntities.raw[rawIndex].faces_id === null ||
        rawAndEntities.raw[rawIndex].media_id !== media[i].id) {
        delete media[i].metadata.faces;
        continue;
      }
      media[i].metadata.faces = [];

      while (rawAndEntities.raw[rawIndex].media_id === media[i].id) {
        media[i].metadata.faces.push(<any>FaceRegionEntry.fromRawToDTO(rawAndEntities.raw[rawIndex]));
        rawIndex++;
        if (rawIndex >= rawAndEntities.raw.length) {
          return media;
        }
      }
    }
    return media;
  }
}
