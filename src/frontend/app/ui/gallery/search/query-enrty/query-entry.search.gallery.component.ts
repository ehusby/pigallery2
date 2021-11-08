import {Component, EventEmitter, forwardRef, Output} from '@angular/core';
import {
  DistanceSearch,
  ListSearchQueryTypes,
  OrientationSearch,
  RangeSearch,
  SearchListQuery,
  SearchQueryDTO,
  SearchQueryTypes,
  SomeOfSearchQuery,
  TextSearch,
  TextSearchQueryMatchTypes,
  TextSearchQueryTypes
} from '../../../../../../common/entities/SearchQueryDTO';
import {Utils} from '../../../../../../common/Utils';
import {ControlValueAccessor, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator} from '@angular/forms';


@Component({
  selector: 'app-gallery-search-query-entry',
  templateUrl: './query-entry.search.gallery.component.html',
  styleUrls: ['./query-entry.search.gallery.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GallerySearchQueryEntryComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => GallerySearchQueryEntryComponent),
      multi: true
    }
  ]
})
export class GallerySearchQueryEntryComponent implements ControlValueAccessor, Validator {
  public queryEntry: SearchQueryDTO;
  public SearchQueryTypesEnum: { value: string; key: SearchQueryTypes }[];
  public SearchQueryTypes = SearchQueryTypes;
  public TextSearchQueryMatchTypes = TextSearchQueryMatchTypes;
  @Output() delete = new EventEmitter<void>();

  constructor() {
    this.SearchQueryTypesEnum = Utils.enumToArray(SearchQueryTypes);
    // Range queries need to be added as AND with min and max sub entry
    this.SearchQueryTypesEnum =
      this.SearchQueryTypesEnum.filter((e): boolean => e.key !== SearchQueryTypes.UNKNOWN_RELATION);
  }

  get IsTextQuery(): boolean {
    return this.queryEntry && TextSearchQueryTypes.includes(this.queryEntry.type);
  }


  get IsListQuery(): boolean {
    return this.queryEntry && ListSearchQueryTypes.includes(this.queryEntry.type);
  }

  get AsListQuery(): SearchListQuery {
    return this.queryEntry as any;
  }

  public get AsRangeQuery(): RangeSearch {
    return this.queryEntry as any;
  }


  get AsOrientationQuery(): OrientationSearch {
    return this.queryEntry as any;
  }

  get AsDistanceQuery(): DistanceSearch {
    return this.queryEntry as any;
  }


  get AsSomeOfQuery(): SomeOfSearchQuery {
    return this.queryEntry as any;
  }

  get AsTextQuery(): TextSearch {
    return this.queryEntry as any;
  }

  validate(control: FormControl): ValidationErrors {
    return {required: true};
  }

  addQuery(): void {
    if (!this.IsListQuery) {
      return;
    }
    this.AsListQuery.list.push({type: SearchQueryTypes.any_text, text: ''} as TextSearch);
  }

  onChangeType(): void {
    if (this.IsListQuery) {
      delete this.AsTextQuery.text;
      this.AsListQuery.list = this.AsListQuery.list || [
        {type: SearchQueryTypes.any_text, text: ''} as TextSearch,
        {type: SearchQueryTypes.any_text, text: ''} as TextSearch
      ];
    } else {
      delete this.AsListQuery.list;
    }
    if (this.queryEntry.type === SearchQueryTypes.distance) {
      this.AsDistanceQuery.from = {text: ''};
      this.AsDistanceQuery.distance = 1;
    } else {
      delete this.AsDistanceQuery.from;
      delete this.AsDistanceQuery.distance;
    }

    if (this.queryEntry.type === SearchQueryTypes.orientation) {
      this.AsOrientationQuery.landscape = true;
    } else {
      delete this.AsOrientationQuery.landscape;
    }
    this.onChange();
  }

  deleteItem(): void {
    this.delete.emit();
  }

  itemDeleted(i: number): void {
    this.AsListQuery.list.splice(i, 1);
  }


  public onTouched(): void {
  }

  public writeValue(obj: any): void {
    this.queryEntry = obj;
  }

  registerOnChange(fn: (_: any) => void): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.propagateTouch = fn;
  }

  public onChange(): void {
    this.propagateChange(this.queryEntry);
  }

  public toggleMatchType(): void {
    this.AsTextQuery.matchType = this.AsTextQuery.matchType === TextSearchQueryMatchTypes.exact_match ?
      TextSearchQueryMatchTypes.like : TextSearchQueryMatchTypes.exact_match;
    this.onChange();
  }

  private propagateChange = (_: any): void => {
  };

  private propagateTouch = (_: any): void => {
  };
}

