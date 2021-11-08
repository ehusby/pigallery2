import {PersonDTO} from '../../../../common/entities/PersonDTO';
import {Config} from '../../../../common/config/public/Config';
import {Utils} from '../../../../common/Utils';

export class Person implements PersonDTO {
  isFavourite: boolean;
  count: number;
  id: number;
  name: string;


  constructor() {
  }

  public static getThumbnailUrl(that: PersonDTO): string {
    return Utils.concatUrls(Config.Client.urlBase, '/api/person/', encodeURIComponent(that.name), '/thumbnail');
  }
}
