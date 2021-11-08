import {Injectable} from '@angular/core';
import {NetworkService} from '../../../model/network/network.service';
import {IAutoCompleteItem} from '../../../../../common/entities/AutoCompleteItem';
import {GalleryCacheService} from '../cache.gallery.service';
import {SearchQueryParserService} from './search-query-parser.service';
import {BehaviorSubject} from 'rxjs';
import {SearchQueryTypes, TextSearchQueryTypes} from '../../../../../common/entities/SearchQueryDTO';
import {QueryParams} from '../../../../../common/QueryParams';
import {SearchQueryParser} from '../../../../../common/SearchQueryParser';

@Injectable()
export class AutoCompleteService {

  private keywords: string[] = [];
  private textSearchKeywordsMap: { [key: string]: SearchQueryTypes } = {};

  constructor(private networkService: NetworkService,
              private searchQueryParserService: SearchQueryParserService,
              private galleryCacheService: GalleryCacheService) {
    this.keywords = Object.values(this.searchQueryParserService.keywords)
      .filter(k => k !== this.searchQueryParserService.keywords.or &&
        k !== this.searchQueryParserService.keywords.and &&
        k !== this.searchQueryParserService.keywords.portrait &&
        k !== this.searchQueryParserService.keywords.kmFrom &&
        k !== this.searchQueryParserService.keywords.NSomeOf)
      .map(k => k + ':');

    this.keywords.push(this.searchQueryParserService.keywords.and);
    this.keywords.push(this.searchQueryParserService.keywords.or);
    for (let i = 0; i < 10; i++) {
      this.keywords.push(i + '-' + this.searchQueryParserService.keywords.NSomeOf + ':( )');
    }

    for (let i = 0; i < 10; i++) {
      this.keywords.push(i + '-' + this.searchQueryParserService.keywords.kmFrom + ':');
    }

    this.keywords.push(this.searchQueryParserService.keywords.to + ':' +
      SearchQueryParser.stringifyText((new Date()).getFullYear().toString()));
    this.keywords.push(this.searchQueryParserService.keywords.to + ':' +
      SearchQueryParser.stringifyText(SearchQueryParser.stringifyDate(Date.now())));

    this.keywords.push(this.searchQueryParserService.keywords.from + ':' +
      SearchQueryParser.stringifyText((new Date()).getFullYear().toString()));
    this.keywords.push(this.searchQueryParserService.keywords.from + ':' +
      SearchQueryParser.stringifyText(SearchQueryParser.stringifyDate(Date.now())));

    TextSearchQueryTypes.forEach(t => {
      this.textSearchKeywordsMap[(this.searchQueryParserService.keywords as any)[SearchQueryTypes[t]]] = t;
    });
  }

  public autoComplete(text: { current: string, prev: string }): BehaviorSubject<RenderableAutoCompleteItem[]> {
    const items: BehaviorSubject<RenderableAutoCompleteItem[]> = new BehaviorSubject(
      this.sortResults(text.current, this.getQueryKeywords(text)));

    const type = this.getTypeFromPrefix(text.current);
    const searchText = this.getPrefixLessSearchText(text.current);
    if (searchText === '' || searchText === '.') {
      return items;
    }
    this.typedAutoComplete(searchText, text.current, type, items);
    return items;
  }

  public typedAutoComplete(text: string, fullText: string, type: SearchQueryTypes,
                           items?: BehaviorSubject<RenderableAutoCompleteItem[]>): BehaviorSubject<RenderableAutoCompleteItem[]> {
    items = items || new BehaviorSubject([]);

    const cached = this.galleryCacheService.getAutoComplete(text, type);
    try {
      if (cached == null) {
        const acParams: any = {};
        if (type) {
          acParams[QueryParams.gallery.search.type] = type;
        }
        this.networkService.getJson<IAutoCompleteItem[]>('/autocomplete/' + text, acParams).then(ret => {
          this.galleryCacheService.setAutoComplete(text, type, ret);
          items.next(this.sortResults(text, ret.map(i => this.ACItemToRenderable(i, fullText)).concat(items.value)));
        });
      } else {
        items.next(this.sortResults(text, cached.map(i => this.ACItemToRenderable(i, fullText)).concat(items.value)));
      }
    } catch (e) {
      console.error(e);
    }
    return items;
  }

  public getPrefixLessSearchText(text: string): string {
    const tokens = text.split(':');
    if (tokens.length !== 2) {
      return text;
    }
    // make sure autocomplete works for 'keyword:"' searches
    if (tokens[1].charAt(0) === '"' || tokens[1].charAt(0) === '(') {
      return tokens[1].substring(1);
    }
    return tokens[1];
  }


  private getTypeFromPrefix(text: string): SearchQueryTypes {
    const tokens = text.split(':');
    if (tokens.length !== 2) {
      return null;
    }
    if (new RegExp('^\\d*-' + this.searchQueryParserService.keywords.kmFrom).test(tokens[0])) {
      return SearchQueryTypes.distance;
    }
    return this.textSearchKeywordsMap[tokens[0]] || null;
  }

  private ACItemToRenderable(item: IAutoCompleteItem, searchToken: string): RenderableAutoCompleteItem {
    if (!item.type) {
      return {text: item.text, queryHint: item.text};
    }
    if ((TextSearchQueryTypes.includes(item.type) ||
      item.type === SearchQueryTypes.distance) &&
      item.type !== SearchQueryTypes.any_text) {
      let queryHint = (this.searchQueryParserService.keywords as any)[SearchQueryTypes[item.type]] + ':"' + item.text + '"';

      // if its a distance search, change hint text
      const tokens = searchToken.split(':');
      if (tokens.length === 2 &&
        new RegExp('^\\d*-' + this.searchQueryParserService.keywords.kmFrom).test(tokens[0])) {
        queryHint = tokens[0] + ':"' + item.text + '"';
      }

      return {
        text: item.text, type: item.type,
        queryHint
      };
    }
    return {
      text: item.text, type: item.type, queryHint: item.text
    };
  }

  private sortResults(text: string, items: RenderableAutoCompleteItem[]): RenderableAutoCompleteItem[] {
    return items.sort((a, b) => {
      // prioritize persons higher
      if (a.type !== b.type) {
        if (a.type === SearchQueryTypes.person) {
          return -1;
        } else if (b.type === SearchQueryTypes.person) {
          return 1;
        }
      }

      if ((a.text.startsWith(text) && b.text.startsWith(text)) ||
        (!a.text.startsWith(text) && !b.text.startsWith(text))) {
        return a.text.localeCompare(b.text);
      } else if (a.text.startsWith(text)) {
        return -1;
      }
      return 1;
    });

  }

  private getQueryKeywords(text: { current: string, prev: string }): RenderableAutoCompleteItem[] {
    // if empty, recommend "and"
    if (text.current === '') {
      if (text.prev !== this.searchQueryParserService.keywords.and) {
        return [{
          text: this.searchQueryParserService.keywords.and,
          queryHint: this.searchQueryParserService.keywords.and,
          notSearchable: true
        }];
      } else {
        return [];
      }
    }
    return this.keywords
      .filter(key => key.startsWith(text.current))
      .map(key => ({
        text: key,
        queryHint: key,
        notSearchable: true
      }));
  }
}

export interface RenderableAutoCompleteItem extends IAutoCompleteItem {
  queryHint: string;
  notSearchable?: boolean; // prevent triggering search if it is not a full search term
}
