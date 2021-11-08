import {AutoCompleteItem} from '../../../../common/entities/AutoCompleteItem';
import {SearchResultDTO} from '../../../../common/entities/SearchResultDTO';
import {SearchQueryDTO, SearchQueryTypes} from '../../../../common/entities/SearchQueryDTO';
import {PhotoDTO} from '../../../../common/entities/PhotoDTO';
import {IObjectManager} from './IObjectManager';

export interface ISearchManager  extends IObjectManager{
  autocomplete(text: string, type: SearchQueryTypes): Promise<AutoCompleteItem[]>;

  search(query: SearchQueryDTO): Promise<SearchResultDTO>;

  getRandomPhoto(queryFilter: SearchQueryDTO): Promise<PhotoDTO>;
}
