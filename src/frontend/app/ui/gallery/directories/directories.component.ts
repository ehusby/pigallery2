import {Component, ElementRef, Input, OnChanges} from '@angular/core';
import {DirectoryDTO} from '../../../../../common/entities/DirectoryDTO';

@Component({
  selector: 'app-gallery-directories',
  templateUrl: './directories.component.html',
  styleUrls: ['./directories.component.css']
})
export class DirectoriesComponent implements OnChanges {

  @Input() directories: DirectoryDTO[];
  size: number;

  constructor(private container: ElementRef) {
  }

  ngOnChanges() {
    this.updateSize();
  }

  private updateSize() {
    if (window.innerWidth < window.innerHeight) {
      // On portrait mode, show 2 directories side by side with some padding
      this.size = Math.round(window.innerWidth / 2) - 25;
    } else {
      const size = 220 + 5;
      const containerWidth = this.container.nativeElement.parentElement.clientWidth;
      this.size = (containerWidth / Math.round((containerWidth / size))) - 5;
    }
  }
}
