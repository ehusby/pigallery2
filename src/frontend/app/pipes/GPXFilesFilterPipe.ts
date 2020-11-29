import {Pipe, PipeTransform} from '@angular/core';
import {FileDTO} from '../../../common/entities/FileDTO';


@Pipe({name: 'gpxFiles'})
export class GPXFilesFilterPipe implements PipeTransform {
  transform(metaFiles: FileDTO[]) {
    return metaFiles.filter((f: FileDTO) => f.name.toLocaleLowerCase().endsWith('.gpx'));
  }
}
