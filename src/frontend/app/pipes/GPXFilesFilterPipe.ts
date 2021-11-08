import {Pipe, PipeTransform} from '@angular/core';
import {FileDTO} from '../../../common/entities/FileDTO';


@Pipe({name: 'gpxFiles'})
export class GPXFilesFilterPipe implements PipeTransform {
  transform(metaFiles: FileDTO[]): FileDTO[] | null {
    if (!metaFiles) {
      return null;
    }
    return metaFiles.filter((f: FileDTO): boolean => f.name.toLocaleLowerCase().endsWith('.gpx'));
  }
}
