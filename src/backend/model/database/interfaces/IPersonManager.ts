import {PersonEntry} from '../sql/enitites/PersonEntry';
import {PersonDTO} from '../../../../common/entities/PersonDTO';
import {IObjectManager} from './IObjectManager';
import {FaceRegion} from '../../../../common/entities/PhotoDTO';

export interface IPersonManager extends IObjectManager {
  getAll(): Promise<PersonEntry[]>;

  get(name: string): Promise<PersonEntry>;

  // saving a Person with a sample region. Person entry cannot exist without a face region
  saveAll(person: { name: string, faceRegion: FaceRegion }[]): Promise<void>;

  updatePerson(name: string, partialPerson: PersonDTO): Promise<PersonEntry>;
}
