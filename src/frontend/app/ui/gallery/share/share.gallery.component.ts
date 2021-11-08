import {Component, OnDestroy, OnInit, TemplateRef} from '@angular/core';
import {Utils} from '../../../../../common/Utils';
import {ShareService} from '../share.service';
import {GalleryService} from '../gallery.service';
import {ContentWrapper} from '../../../../../common/entities/ConentWrapper';
import {SharingDTO} from '../../../../../common/entities/SharingDTO';
import {Config} from '../../../../../common/config/public/Config';
import {NotificationService} from '../../../model/notification.service';
import {} from '../../../../../common/entities/DirectoryDTO';
import {BsModalService} from 'ngx-bootstrap/modal';
import {BsModalRef} from 'ngx-bootstrap/modal/bs-modal-ref.service';
import {Subscription} from 'rxjs';


@Component({
  selector: 'app-gallery-share',
  templateUrl: './share.gallery.component.html',
  styleUrls: ['./share.gallery.component.css'],
})
export class GalleryShareComponent implements OnInit, OnDestroy {

  enabled = true;
  url = '';

  input = {
    includeSubfolders: true,
    valid: {
      amount: 30,
      type: ValidityTypes.Days as ValidityTypes
    },
    password: null as string
  };
  currentDir = '';
  sharing: SharingDTO = null;
  contentSubscription: Subscription = null;
  readonly passwordProtection = Config.Client.Sharing.passwordProtected;
  readonly ValidityTypes = ValidityTypes;

  modalRef: BsModalRef;

  text = {
    Yes: 'Yes',
    No: 'No'
  };

  constructor(private sharingService: ShareService,
              public galleryService: GalleryService,
              private  notification: NotificationService,
              private modalService: BsModalService) {

    this.text.Yes = $localize`Yes`;
    this.text.No = $localize`No`;
  }


  ngOnInit(): void {
    this.contentSubscription = this.galleryService.content.subscribe((content: ContentWrapper) => {
      this.enabled = !!content.directory;
      if (!this.enabled) {
        return;
      }
      this.currentDir = Utils.concatUrls((content.directory).path, (content.directory).name);
    });
  }

  ngOnDestroy(): void {
    if (this.contentSubscription !== null) {
      this.contentSubscription.unsubscribe();
    }
  }

  calcValidity(): number {
    switch (parseInt(this.input.valid.type.toString(), 10)) {
      case ValidityTypes.Minutes:
        return this.input.valid.amount * 1000 * 60;
      case ValidityTypes.Hours:
        return this.input.valid.amount * 1000 * 60 * 60;
      case ValidityTypes.Days:
        return this.input.valid.amount * 1000 * 60 * 60 * 24;
      case ValidityTypes.Months:
        return this.input.valid.amount * 1000 * 60 * 60 * 24 * 30;
      case ValidityTypes.Forever:
        return -1;
    }
    throw new Error('unknown type: ' + this.input.valid.type);
  }

  async update(): Promise<void> {
    if (this.sharing == null) {
      return;
    }
    this.url = $localize`loading..`;
    this.sharing = await this.sharingService.updateSharing(this.currentDir,
      this.sharing.id, this.input.includeSubfolders, this.input.password, this.calcValidity());
    this.url = Config.Client.publicUrl + '/share/' + this.sharing.sharingKey;
  }

  async get(): Promise<void> {
    this.url = $localize`loading..`;
    this.sharing = await this.sharingService.createSharing(this.currentDir, this.input.includeSubfolders, this.calcValidity());
    this.url = Config.Client.publicUrl + '/share/' + this.sharing.sharingKey;
  }

  async openModal(template: TemplateRef<any>): Promise<void> {
    await this.get();
    this.input.password = '';
    if (this.modalRef) {
      this.modalRef.hide();
    }
    this.modalRef = this.modalService.show(template);
    document.body.style.paddingRight = '0px';
  }

  onCopy(): void {
    this.notification.success($localize`Url has been copied to clipboard`);
  }

  public hideModal(): void {
    this.modalRef.hide();
    this.modalRef = null;
    this.sharing = null;
  }


}


export enum ValidityTypes {
  Minutes = 1, Hours = 2, Days = 3, Months = 4, Forever = 99
}
