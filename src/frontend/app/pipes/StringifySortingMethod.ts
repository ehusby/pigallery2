import {Pipe, PipeTransform} from '@angular/core';
import {SortingMethods} from '../../../common/entities/SortingMethods';


@Pipe({name: 'stringifySorting'})
export class StringifySortingMethod implements PipeTransform {
  constructor() {
  }

  transform(method: SortingMethods): string {
    switch (method) {
      case SortingMethods.ascRating:
        return $localize`ascending rating`;
      case SortingMethods.descRating:
        return $localize`descending rating`;
      case SortingMethods.ascName:
        return $localize`ascending name`;
      case SortingMethods.descName:
        return $localize`descending name`;
      case SortingMethods.ascDate:
        return $localize`ascending date`;
      case SortingMethods.descDate:
        return $localize`descending date`;
      case SortingMethods.random:
        return $localize`random`;
    }
  }
}

