import {Component, forwardRef, Input, OnChanges} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {ControlValueAccessor, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator} from '@angular/forms';
import {Utils} from '../../../../../../common/Utils';
import {propertyTypes} from 'typeconfig/common';

@Component({
  selector: 'app-settings-entry',
  templateUrl: './settings-entry.component.html',
  styleUrls: ['./settings-entry.settings.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SettingsEntryComponent),
      multi: true
    },

    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => SettingsEntryComponent),
      multi: true
    }
  ]
})
export class SettingsEntryComponent implements ControlValueAccessor, Validator, OnChanges {

  @Input() name: string;
  @Input() required: boolean;
  @Input() dockerWarning: boolean;
  @Input() optionMap: (v: { key: number, value: string }) => { key: number, value: string };
  @Input() placeholder: string;
  @Input() options: { key: number | string, value: number | string }[];
  @Input() simplifiedMode = false;
  @Input() allowSpaces = false;
  @Input() description: boolean;
  state: {
    isEnumType: boolean,
    isConfigType: boolean,
    default: any, value: any, min?: number, max?: number,
    type: propertyTypes, arrayType: propertyTypes,
    original: any, readonly?: boolean
  };
  isNumberArray = false;
  isNumber = false;
  type = 'text';
  _options: { key: number | string; value: string | number; }[] = [];
  title: string;
  idName: string;
  _disabled: boolean;
  private readonly GUID = Utils.GUID();


  // value: { default: any, setting: any, original: any, readonly?: boolean, onChange: () => void };

  constructor(private i18n: I18n) {
  }

  get changed(): boolean {
    if (this._disabled) {
      return false;
    }
    if (this.state.type === 'array') {
      return !Utils.equalsFilter(this.state.value, this.state.default);
    }
    return this.state.value !== this.state.default;
  }

  get shouldHide(): boolean {
    if (Array.isArray(this.state.value)) {
      return this.simplifiedMode && Utils.equalsFilter(this.state.value, this.state.default)
        && Utils.equalsFilter(this.state.original, this.state.default);
    }
    return this.simplifiedMode && this.state.value === this.state.default && this.state.original === this.state.default;
  }


  get PlaceHolder(): string {
    return this.placeholder || this.state.default;
  }

  get defaultStr(): string {

    if (this.state.type === 'array' && this.state.arrayType === 'string') {
      return (this.state.default || []).join(';');
    }

    return this.state.default;
  }

  get value(): any {
    if (this.state.type === 'array' &&
      (this.state.arrayType === 'string' || this.isNumberArray)) {
      return this.state.value.join(';');
    }

    return this.state.value;
  }

  set value(value: any) {
    if (this.state.type === 'array' &&
      (this.state.arrayType === 'string' || this.isNumberArray)) {
      value = value.replace(new RegExp(',', 'g'), ';');
      if (this.allowSpaces === false) {
        value = value.replace(new RegExp(' ', 'g'), ';');
      }
      this.state.value = value.split(';').filter((v: string) => v !== '');
      if (this.isNumberArray) {
        this.state.value = this.state.value.map((v: string) => parseFloat(v)).filter((v: number) => !isNaN(v));
      }
      return;
    }
    this.state.value = value;
    if (this.isNumber) {
      this.state.value = parseFloat(value);
    }
  }

  setDisabledState?(isDisabled: boolean): void {
    this._disabled = isDisabled;
  }

  ngOnChanges(): void {
    if (!this.state) {
      return;
    }
    if (this.options) {
      this.state.isEnumType = true;
    }
    this.title = '';
    if (this.state.readonly) {
      this.title = this.i18n('readonly') + ', ';
    }
    this.title += this.i18n('default value') + ': ' + this.defaultStr;
    if (this.name) {
      this.idName = this.GUID + this.name.toLowerCase().replace(new RegExp(' ', 'gm'), '-');
    }
    this.isNumberArray = this.state.arrayType === 'unsignedInt' ||
      this.state.arrayType === 'integer' || this.state.arrayType === 'float' || this.state.arrayType === 'positiveFloat';
    this.isNumber = this.state.type === 'unsignedInt' ||
      this.state.type === 'integer' || this.state.type === 'float' || this.state.type === 'positiveFloat';
    if (this.state.isEnumType) {
      if (this.options) {
        this._options = this.options;
      } else {
        if (this.optionMap) {
          this._options = Utils.enumToArray(this.state.type).map(this.optionMap);
        } else {
          this._options = Utils.enumToArray(this.state.type);
        }
      }
    }

    if (this.isNumber) {
      this.type = 'number';
    } else if (this.state.type === 'password') {
      this.type = 'password';
    } else {
      this.type = 'text';
    }
  }

  validate(control: FormControl): ValidationErrors {
    if (!this.required || (this.state &&
      typeof this.state.value !== 'undefined' &&
      this.state.value !== null &&
      this.state.value !== '')) {
      return null;
    }
    return {required: true};
  }

  public onChange(value: any): void {
  }

  public onTouched(): void {
  }

  public writeValue(obj: any): void {
    this.state = obj;
    this.ngOnChanges();
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

}



