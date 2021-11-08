import {IPersonManager} from '../interfaces/IPersonManager';
import {PersonDTO} from '../../../../common/entities/PersonDTO';
import {FaceRegion} from '../../../../common/entities/PhotoDTO';

export class PersonManager implements IPersonManager {
  saveAll(person: { name: string; faceRegion: FaceRegion }[]): Promise<void> {
    throw new Error('not supported by memory DB');
  }

  getAll(): Promise<any[]> {
    throw new Error('not supported by memory DB');
  }

  get(name: string): Promise<any> {
    throw new Error('not supported by memory DB');
  }


  onGalleryIndexUpdate(): Promise<void> {
    throw new Error('not supported by memory DB');
  }

  updatePerson(name: string, partialPerson: PersonDTO): Promise<any> {
    throw new Error('not supported by memory DB');
  }
}
