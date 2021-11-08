import {SQLConnection} from './SQLConnection';
import {PersonEntry} from './enitites/PersonEntry';
import {FaceRegionEntry} from './enitites/FaceRegionEntry';
import {PersonDTO} from '../../../../common/entities/PersonDTO';
import {ISQLPersonManager} from './IPersonManager';
import {Logger} from '../../../Logger';
import {FaceRegion} from '../../../../common/entities/PhotoDTO';


const LOG_TAG = '[PersonManager]';

export class PersonManager implements ISQLPersonManager {
  persons: PersonEntry[] = null;
  /**
   * Person table contains denormalized data that needs to update when isDBValid = false
   */
  private isDBValid = false;

  private static async updateCounts(): Promise<void> {
    const connection = await SQLConnection.getConnection();
    await connection.query('UPDATE person_entry SET count = ' +
      ' (SELECT COUNT(1) FROM face_region_entry WHERE face_region_entry.personId = person_entry.id)');

    // remove persons without photo
    await connection
      .createQueryBuilder()
      .delete()
      .from(PersonEntry)
      .where('count = 0')
      .execute();
  }

  private static async updateSamplePhotos(): Promise<void> {
    const connection = await SQLConnection.getConnection();
    await connection.query('update person_entry set sampleRegionId = ' +
      '(Select face_region_entry.id from  media_entity ' +
      'left join face_region_entry on media_entity.id = face_region_entry.mediaId ' +
      'where face_region_entry.personId=person_entry.id ' +
      'order by media_entity.metadataCreationdate desc ' +
      'limit 1)');

  }

  async updatePerson(name: string, partialPerson: PersonDTO): Promise<PersonEntry> {
    this.isDBValid = false;
    const connection = await SQLConnection.getConnection();
    const repository = connection.getRepository(PersonEntry);
    const person = await repository.createQueryBuilder('person')
      .limit(1)
      .where('person.name LIKE :name COLLATE utf8_general_ci', {name}).getOne();


    if (typeof partialPerson.name !== 'undefined') {
      person.name = partialPerson.name;
    }
    if (typeof partialPerson.isFavourite !== 'undefined') {
      person.isFavourite = partialPerson.isFavourite;
    }
    await repository.save(person);

    await this.loadAll();

    return person;
  }

  public async getAll(): Promise<PersonEntry[]> {
    if (this.persons === null) {
      await this.loadAll();
    }
    return this.persons;
  }

  /**
   * Used for statistic
   */
  public async countFaces(): Promise<number> {
    const connection = await SQLConnection.getConnection();
    return await connection.getRepository(FaceRegionEntry)
      .createQueryBuilder('faceRegion')
      .getCount();
  }

  public async get(name: string): Promise<PersonEntry> {
    if (this.persons === null) {
      await this.loadAll();
    }
    return this.persons.find((p): boolean => p.name === name);
  }

  public async saveAll(persons: { name: string, faceRegion: FaceRegion }[]): Promise<void> {
    const toSave: { name: string, faceRegion: FaceRegion }[] = [];
    const connection = await SQLConnection.getConnection();
    const personRepository = connection.getRepository(PersonEntry);
    const faceRegionRepository = connection.getRepository(FaceRegionEntry);

    const savedPersons =  await personRepository.find();
    // filter already existing persons
    for (const personToSave of persons) {

      const person = savedPersons.find((p): boolean => p.name === personToSave.name);
      if (!person) {
        toSave.push(personToSave);
      }
    }


    if (toSave.length > 0) {
      for (let i = 0; i < toSave.length / 200; i++) {
        const saving = toSave.slice(i * 200, (i + 1) * 200);
        const inserted = await personRepository.insert(saving.map(p => ({name: p.name})));
        // setting Person id
        inserted.identifiers.forEach((idObj: { id: number }, j: number) => {
          (saving[j].faceRegion as FaceRegionEntry).person = idObj as any;
        });
        await faceRegionRepository.insert(saving.map(p => p.faceRegion));
      }
    }
    this.isDBValid = false;

  }

  public async onNewDataVersion(): Promise<void> {
    this.persons = null;
    this.isDBValid = false;
  }

  private async loadAll(): Promise<void> {
    await this.updateDerivedValues();
    const connection = await SQLConnection.getConnection();
    const personRepository = connection.getRepository(PersonEntry);
    this.persons = await personRepository.find({
      relations: ['sampleRegion',
        'sampleRegion.media',
        'sampleRegion.media.directory']
    });
  }

  /**
   * Person table contains derived, denormalized data for faster select, this needs to be updated after data change
   * @private
   */
  private async updateDerivedValues(): Promise<void> {
    if (this.isDBValid === true) {
      return;
    }
    Logger.debug(LOG_TAG, 'Updating derived persons data');
    await PersonManager.updateCounts();
    await PersonManager.updateSamplePhotos();
    this.isDBValid = false;
  }

}
