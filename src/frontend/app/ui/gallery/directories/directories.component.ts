import {Component, ElementRef, Input, OnChanges} from '@angular/core';
import {DeviceDetectorService} from 'ngx-device-detector';
import {SubDirectoryDTO} from '../../../../../common/entities/DirectoryDTO';

@Component({
  selector: 'app-gallery-directories',
  templateUrl: './directories.component.html',
  styleUrls: ['./directories.component.css']
})
export class DirectoriesComponent implements OnChanges {

  @Input() directories: SubDirectoryDTO[];
  size: number;
  isDesktop: boolean;

  constructor(private container: ElementRef, private deviceService: DeviceDetectorService) {
    this.isDesktop = this.deviceService.isDesktop();
  }

  ngOnChanges(): void {
    this.updateSize();
  }

  private updateSize(): void {
    if (!this.isDesktop && window.innerWidth < window.innerHeight) {
      // On portrait mode, show 2 directories side by side with some padding
      this.size = Math.round(window.innerWidth / 2) - 25;
    } else {
      const size = 220 + 5;
      const containerWidth = this.container.nativeElement.parentElement.clientWidth;
      this.size = (containerWidth / Math.round((containerWidth / size))) - 5;
    }
  }
}
