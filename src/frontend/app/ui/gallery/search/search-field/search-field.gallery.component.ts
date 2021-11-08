import {Component, ElementRef, EventEmitter, forwardRef, OnDestroy, Output, ViewChild} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {BehaviorSubject, Subscription} from 'rxjs';
import {AutoCompleteService, RenderableAutoCompleteItem} from '../autocomplete.service';
import {MetadataSearchQueryTypes, SearchQueryTypes} from '../../../../../../common/entities/SearchQueryDTO';
import {Config} from '../../../../../../common/config/public/Config';
import {ControlValueAccessor, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator} from '@angular/forms';

@Component({
  selector: 'app-gallery-search-field',
  templateUrl: './search-field.gallery.component.html',
  styleUrls: ['./search-field.gallery.component.css'],
  providers: [
    AutoCompleteService, RouterLink,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GallerySearchFieldComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => GallerySearchFieldComponent),
      multi: true
    }
  ]
})
export class GallerySearchFieldComponent implements ControlValueAccessor, Validator, OnDestroy {

  @ViewChild('SearchField', {static: false}) searchField: ElementRef;
  @ViewChild('SearchHintField', {static: false}) searchHintField: ElementRef;
  @Output() search = new EventEmitter<void>();

  autoCompleteRenders: AutoCompleteRenderItem[] = [];
  public rawSearchText = '';
  mouseOverAutoComplete = false;
  readonly SearchQueryTypes: typeof SearchQueryTypes;
  public readonly MetadataSearchQueryTypes: { value: string; key: SearchQueryTypes }[];
  public highlightedAutoCompleteItem = -1;
  private cache = {
    lastAutocomplete: '',
    lastInstantSearch: ''
  };
  private autoCompleteItemsSubscription: Subscription = null;
  private autoCompleteItems: BehaviorSubject<RenderableAutoCompleteItem[]>;

  constructor(private autoCompleteService: AutoCompleteService,
              public router: Router) {

    this.SearchQueryTypes = SearchQueryTypes;
    this.MetadataSearchQueryTypes = MetadataSearchQueryTypes.map((v): { value: string; key: SearchQueryTypes } => ({
      key: v,
      value: SearchQueryTypes[v]
    }));

  }

  get SearchHint(): string {
    if (!this.rawSearchText) {
      return '';
    }
    if (!this.autoCompleteItems ||
      !this.autoCompleteItems.value || this.autoCompleteItems.value.length === 0) {
      return this.rawSearchText;
    }
    const itemIndex = this.highlightedAutoCompleteItem < 0 ? 0 : this.highlightedAutoCompleteItem;
    const searchText = this.getAutocompleteToken();
    if (searchText.current === '') {
      return this.rawSearchText + this.autoCompleteItems.value[itemIndex].queryHint;
    }
    if (this.autoCompleteItems.value[0].queryHint.startsWith(searchText.current)) {
      return this.rawSearchText + this.autoCompleteItems
        .value[itemIndex].queryHint.substr(searchText.current.length);
    }
    return this.rawSearchText;
  }


  ngOnDestroy(): void {
    if (this.autoCompleteItemsSubscription) {
      this.autoCompleteItemsSubscription.unsubscribe();
      this.autoCompleteItemsSubscription = null;
    }
  }

  getAutocompleteToken(): { current: string, prev: string } {
    if (this.rawSearchText.trim().length === 0) {
      return {current: '', prev: ''};
    }
    const tokens = this.rawSearchText.split(' ');
    return {
      current: tokens[tokens.length - 1],
      prev: (tokens.length > 2 ? tokens[tokens.length - 2] : '')
    };

  }

  onSearchChange(event: KeyboardEvent): void {
    const searchText = this.getAutocompleteToken();
    if (Config.Client.Search.AutoComplete.enabled &&
      this.cache.lastAutocomplete !== searchText.current) {
      this.cache.lastAutocomplete = searchText.current;
      this.autocomplete(searchText).catch(console.error);
    }

  }

  public setMouseOverAutoComplete(value: boolean): void {
    this.mouseOverAutoComplete = value;
  }

  public onFocusLost(): void {
    if (this.mouseOverAutoComplete === false) {
      this.autoCompleteRenders = [];
    }
  }


  applyHint($event: any): void {
    if ($event.target.selectionStart !== this.rawSearchText.length) {
      return;
    }
    // if no item selected, apply hint
    if (this.highlightedAutoCompleteItem < 0) {
      this.rawSearchText = this.SearchHint;
      this.onChange();
      return;
    }

    // force apply selected autocomplete item
    this.applyAutoComplete(this.autoCompleteRenders[this.highlightedAutoCompleteItem]);
  }

  applyAutoComplete(item: AutoCompleteRenderItem): void {
    const token = this.getAutocompleteToken();
    this.rawSearchText = this.rawSearchText.substr(0, this.rawSearchText.length - token.current.length)
      + item.queryHint;
    this.onChange();
    this.emptyAutoComplete();
  }

  searchAutoComplete(item: AutoCompleteRenderItem): void {
    this.applyAutoComplete(item);

    if (!item.notSearchable) {
      this.search.emit();
    }
  }

  setMouseOverAutoCompleteItem(i: number): void {
    this.highlightedAutoCompleteItem = i;
  }

  selectAutocompleteUp(): void {
    if (this.highlightedAutoCompleteItem > 0) {
      this.highlightedAutoCompleteItem--;
    }
  }

  selectAutocompleteDown(): void {
    if (this.autoCompleteItems &&
      this.highlightedAutoCompleteItem < this.autoCompleteItems.value.length - 1) {
      this.highlightedAutoCompleteItem++;
    }
  }

  OnEnter($event: any): void {
    // no autocomplete shown, just search whatever is there.
    if (this.autoCompleteRenders.length === 0 || this.highlightedAutoCompleteItem === -1) {
      this.search.emit();
      return;
    }
    // search selected autocomplete
    this.searchAutoComplete(this.autoCompleteRenders[this.highlightedAutoCompleteItem]);
  }

  public onTouched(): void {
  }

  public writeValue(obj: any): void {
    this.rawSearchText = obj;
  }

  registerOnChange(fn: (_: any) => void): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.propagateTouch = fn;
  }

  public onChange(): void {
    this.propagateChange(this.rawSearchText);
  }

  validate(control: FormControl): ValidationErrors {
    return {required: true};
  }

  Scrolled(): void {
    this.searchHintField.nativeElement.scrollLeft = this.searchField.nativeElement.scrollLeft;
  }

  private emptyAutoComplete(): void {
    this.highlightedAutoCompleteItem = -1;
    this.autoCompleteRenders = [];
  }

  private async autocomplete(searchText: { current: string, prev: string }): Promise<void> {
    if (!Config.Client.Search.AutoComplete.enabled) {
      return;
    }

    if (this.rawSearchText.trim().length > 0) { // are we searching for anything?
      try {
        if (this.autoCompleteItemsSubscription) {
          this.autoCompleteItemsSubscription.unsubscribe();
          this.autoCompleteItemsSubscription = null;
        }
        this.autoCompleteItems = this.autoCompleteService.autoComplete(searchText);
        this.autoCompleteItemsSubscription = this.autoCompleteItems.subscribe((): void => {
          this.showSuggestions(this.autoCompleteItems.value, searchText.current);
        });
      } catch (error) {
        console.error(error);
      }

    } else {
      this.emptyAutoComplete();
    }
  }

  private showSuggestions(suggestions: RenderableAutoCompleteItem[], searchText: string): void {
    this.emptyAutoComplete();
    suggestions.forEach((item: RenderableAutoCompleteItem): void => {
      const renderItem = new AutoCompleteRenderItem(item.text, this.autoCompleteService.getPrefixLessSearchText(searchText),
        item.type, item.queryHint, item.notSearchable);
      this.autoCompleteRenders.push(renderItem);
    });
  }

  private propagateChange = (_: any): void => {
  };

  private propagateTouch = (_: any): void => {
  };
}

class AutoCompleteRenderItem {
  public preText = '';
  public highLightText = '';
  public postText = '';
  public type: SearchQueryTypes;
  public queryHint: string;
  public notSearchable: boolean;

  constructor(public text: string, searchText: string, type: SearchQueryTypes, queryHint: string, notSearchable = false) {
    const preIndex = text.toLowerCase().indexOf(searchText.toLowerCase());
    if (preIndex > -1) {
      this.preText = text.substring(0, preIndex);
      this.highLightText = text.substring(preIndex, preIndex + searchText.length);
      this.postText = text.substring(preIndex + searchText.length);
    } else {
      this.postText = text;
    }
    this.type = type;
    this.queryHint = queryHint;
    this.notSearchable = notSearchable;
  }
}

