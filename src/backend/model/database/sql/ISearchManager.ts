import {SearchQueryDTO, SearchQueryTypes} from '../../../../common/entities/SearchQueryDTO';
import {ISearchManager} from '../interfaces/ISearchManager';
import {AutoCompleteItem} from '../../../../common/entities/AutoCompleteItem';
import {SearchResultDTO} from '../../../../common/entities/SearchResultDTO';
import {PhotoDTO} from '../../../../common/entities/PhotoDTO';
import {Brackets} from 'typeorm';

export interface ISQLSearchManager extends ISearchManager {
  autocomplete(text: string, type: SearchQueryTypes): Promise<AutoCompleteItem[]>;

  search(query: SearchQueryDTO): Promise<SearchResultDTO>;

  getRandomPhoto(queryFilter: SearchQueryDTO): Promise<PhotoDTO>;

  // "Protected" functions. only called from other Managers, not from middlewares
  getCount(query: SearchQueryDTO): Promise<number>;

  prepareAndBuildWhereQuery(query: SearchQueryDTO, directoryOnly?: boolean): Promise<Brackets>;
}
