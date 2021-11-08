import {ParentDirectoryDTO} from './DirectoryDTO';
import {SearchResultDTO} from './SearchResultDTO';

export class ContentWrapper {
  constructor(public directory: ParentDirectoryDTO = null,
              public searchResult: SearchResultDTO = null,
              public notModified?: boolean) {
  }
}
