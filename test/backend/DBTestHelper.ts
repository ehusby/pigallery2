import {Config} from '../../src/common/config/private/Config';
import * as path from 'path';
import * as fs from 'fs';
import {SQLConnection} from '../../src/backend/model/database/sql/SQLConnection';
import {DatabaseType} from '../../src/common/config/private/PrivateConfig';
import {ProjectPath} from '../../src/backend/ProjectPath';
import {DirectoryBaseDTO, ParentDirectoryDTO} from '../../src/common/entities/DirectoryDTO';
import {ObjectManagers} from '../../src/backend/model/ObjectManagers';
import {DiskMangerWorker} from '../../src/backend/model/threading/DiskMangerWorker';
import {IndexingManager} from '../../src/backend/model/database/sql/IndexingManager';
import {GalleryManager} from '../../src/backend/model/database/sql/GalleryManager';
import {Connection} from 'typeorm';
import {Utils} from '../../src/common/Utils';

declare let describe: any;
const savedDescribe = describe;

class IndexingManagerTest extends IndexingManager {

  public async saveToDB(scannedDirectory: ParentDirectoryDTO): Promise<void> {
    return super.saveToDB(scannedDirectory);
  }
}

class GalleryManagerTest extends GalleryManager {

  public async selectParentDir(connection: Connection, directoryName: string, directoryParent: string): Promise<ParentDirectoryDTO> {
    return super.selectParentDir(connection, directoryName, directoryParent);
  }

  public async fillParentDir(connection: Connection, dir: ParentDirectoryDTO): Promise<void> {
    return super.fillParentDir(connection, dir);
  }
}

export class DBTestHelper {

  static enable = {
    memory: false,
    sqlite: process.env.TEST_SQLITE !== 'false',
    mysql: process.env.TEST_MYSQL !== 'false'
  };
  public static readonly savedDescribe = savedDescribe;
  tempDir: string;

  constructor(public dbType: DatabaseType) {
    this.tempDir = path.join(__dirname, './tmp');
  }

  static describe(settingsOverride: {
    memory?: boolean;
    sqlite?: boolean;
    mysql?: boolean;
  } = {}): (name: string, tests: (helper?: DBTestHelper) => void) => void {
    const settings = Utils.clone(DBTestHelper.enable);
    for (const key of Object.keys(settingsOverride)) {
      (settings as any)[key] = (settingsOverride as any)[key];
    }
    return (name: string, tests: (helper?: DBTestHelper) => void) => {
      savedDescribe(name, async () => {
        if (settings.sqlite) {
          const helper = new DBTestHelper(DatabaseType.sqlite);
          savedDescribe('sqlite', () => {
            return tests(helper);
          });
        }
        if (settings.mysql) {
          const helper = new DBTestHelper(DatabaseType.mysql);
          savedDescribe('mysql', function(): void {
            this.timeout(99999999); // hint for the test environment
            // @ts-ignore
            return tests(helper);
          });
        }
        if (settings.memory) {
          const helper = new DBTestHelper(DatabaseType.memory);
          savedDescribe('memory', () => {
            return tests(helper);
          });
        }
      });
    };
  }

  public static async persistTestDir(directory: DirectoryBaseDTO): Promise<ParentDirectoryDTO> {
    await ObjectManagers.InitSQLManagers();
    const connection = await SQLConnection.getConnection();
    ObjectManagers.getInstance().IndexingManager.indexDirectory = () => Promise.resolve(null);


    await ObjectManagers.getInstance().IndexingManager.saveToDB(directory as ParentDirectoryDTO);
    // not saving subdirs. saveToDB destroys data
    // await im.saveToDB(subDir);
    // await im.saveToDB(subDir2);

    if (ObjectManagers.getInstance().IndexingManager &&
      ObjectManagers.getInstance().IndexingManager.IsSavingInProgress) {
      await ObjectManagers.getInstance().IndexingManager.SavingReady;
    }

    const gm = new GalleryManagerTest();
    const dir = await gm.selectParentDir(connection, directory.name, path.join(path.dirname('.'), path.sep));
    await gm.fillParentDir(connection, dir);

    const populateDir = async (d: DirectoryBaseDTO) => {
      for (let i = 0; i < d.directories.length; i++) {
        d.directories[i] = await gm.selectParentDir(connection, d.directories[i].name,
          path.join(DiskMangerWorker.pathFromParent(d), path.sep));
        await gm.fillParentDir(connection, d.directories[i] as any);
        await populateDir(d.directories[i]);
      }
    };
    await populateDir(dir);

    await ObjectManagers.reset();
    return dir;
  }

  public async initDB(): Promise<void> {
    await Config.load();
    if (this.dbType === DatabaseType.sqlite) {
      await this.initSQLite();
    } else if (this.dbType === DatabaseType.mysql) {
      await this.initMySQL();
    } else if (this.dbType === DatabaseType.memory) {
      Config.Server.Database.type = DatabaseType.memory;
    }
  }


  public async clearDB(): Promise<void> {
    if (this.dbType === DatabaseType.sqlite) {
      await this.clearUpSQLite();
    } else if (this.dbType === DatabaseType.mysql) {
      await this.clearUpMysql();
    } else if (this.dbType === DatabaseType.memory) {
      await this.clearUpMemory();
    }
  }

  private async initMySQL(): Promise<void> {
    await this.resetMySQL();
  }

  private async resetMySQL(): Promise<void> {
    await ObjectManagers.reset();
    Config.Server.Database.type = DatabaseType.mysql;
    Config.Server.Database.mysql.database = 'pigallery2_test';
    const conn = await SQLConnection.getConnection();
    await conn.query('DROP DATABASE IF EXISTS ' + conn.options.database);
    await conn.query('CREATE DATABASE IF NOT EXISTS ' + conn.options.database);
    await SQLConnection.close();
    await ObjectManagers.InitSQLManagers();
  }

  private async clearUpMysql(): Promise<void> {
    await ObjectManagers.reset();
    Config.Server.Database.type = DatabaseType.mysql;
    Config.Server.Database.mysql.database = 'pigallery2_test';
    const conn = await SQLConnection.getConnection();
    await conn.query('DROP DATABASE IF EXISTS ' + conn.options.database);
    await SQLConnection.close();
  }

  private async initSQLite(): Promise<void> {
    await this.resetSQLite();
  }

  private async resetSQLite(): Promise<void> {
    Config.Server.Database.type = DatabaseType.sqlite;
    Config.Server.Database.dbFolder = this.tempDir;
    ProjectPath.reset();
    await ObjectManagers.reset();
    await fs.promises.rmdir(this.tempDir, {recursive: true});
    await ObjectManagers.InitSQLManagers();
  }

  private async clearUpSQLite(): Promise<void> {
    Config.Server.Database.type = DatabaseType.sqlite;
    Config.Server.Database.dbFolder = this.tempDir;
    ProjectPath.reset();
    await ObjectManagers.reset();
    await fs.promises.rmdir(this.tempDir, {recursive: true});
  }

  private async clearUpMemory(): Promise<void> {
    return this.resetSQLite();
  }
}
