import {Config} from '../../../../common/config/private/Config';
import {Brackets, SelectQueryBuilder, WhereExpression} from 'typeorm';
import {MediaEntity} from './enitites/MediaEntity';
import {DiskMangerWorker} from '../../threading/DiskMangerWorker';
import {ObjectManagers} from '../../ObjectManagers';
import {DatabaseType} from '../../../../common/config/private/PrivateConfig';
import {SortingMethods} from '../../../../common/entities/SortingMethods';
import {ISQLSearchManager} from './ISearchManager';
import {IPreviewManager, PreviewPhotoDTOWithID} from '../interfaces/IPreviewManager';
import {SQLConnection} from './SQLConnection';
import {SavedSearchDTO} from '../../../../common/entities/album/SavedSearchDTO';
import {SearchQueryDTO} from '../../../../common/entities/SearchQueryDTO';


const LOG_TAG = '[PreviewManager]';

export class PreviewManager implements IPreviewManager {
  private static DIRECTORY_SELECT = ['directory.name', 'directory.path'];

  private static setSorting<T>(query: SelectQueryBuilder<T>): SelectQueryBuilder<T> {

    for (const sort of Config.Server.Preview.Sorting) {
      switch (sort) {
        case SortingMethods.descDate:
          query.addOrderBy('media.creationDate', 'DESC');
          break;
        case SortingMethods.ascDate:
          query.addOrderBy('media.creationDate', 'ASC');
          break;
        case SortingMethods.descRating:
          query.addOrderBy('media.rating', 'DESC');
          break;
        case SortingMethods.ascRating:
          query.addOrderBy('media.rating', 'ASC');
          break;
        case SortingMethods.descName:
          query.addOrderBy('media.name', 'ASC');
          break;
        case SortingMethods.ascName:
          query.addOrderBy('media.name', 'ASC');
          break;

      }
    }

    return query;
  }

  public async getAlbumPreview(album: { searchQuery: SearchQueryDTO }): Promise<PreviewPhotoDTOWithID> {

    const albumQuery = await (ObjectManagers.getInstance().SearchManager as ISQLSearchManager).prepareAndBuildWhereQuery(album.searchQuery);
    const connection = await SQLConnection.getConnection();

    const previewQuery = async (): Promise<SelectQueryBuilder<MediaEntity>> => {
      const query = connection
        .getRepository(MediaEntity)
        .createQueryBuilder('media')
        .innerJoin('media.directory', 'directory')
        .select(['media.name', 'media.id', ...PreviewManager.DIRECTORY_SELECT])
        .where(albumQuery);
      PreviewManager.setSorting(query);
      return query;
    };

    let previewMedia = null;
    if (Config.Server.Preview.SearchQuery) {
      previewMedia = await (await previewQuery())
        .andWhere(await (ObjectManagers.getInstance().SearchManager as ISQLSearchManager)
          .prepareAndBuildWhereQuery(Config.Server.Preview.SearchQuery))
        .limit(1)
        .getOne();
    }

    if (!previewMedia) {
      previewMedia = await (await previewQuery())
        .limit(1)
        .getOne();
    }
    return previewMedia || null;
  }

  public async getPreviewForDirectory(dir: { id: number, name: string, path: string }): Promise<PreviewPhotoDTOWithID> {
    const connection = await SQLConnection.getConnection();
    const previewQuery = (): SelectQueryBuilder<MediaEntity> => {
      const query = connection
        .getRepository(MediaEntity)
        .createQueryBuilder('media')
        .innerJoin('media.directory', 'directory')
        .select(['media.name', 'media.id', ...PreviewManager.DIRECTORY_SELECT])
        .where(new Brackets((q: WhereExpression) => {
          q.where('media.directory = :dir', {
            dir: dir.id
          });
          if (Config.Server.Database.type === DatabaseType.mysql) {
            q.orWhere('directory.path like :path || \'%\'', {
              path: (DiskMangerWorker.pathFromParent(dir))
            });
          } else {
            q.orWhere('directory.path GLOB :path', {
              path: DiskMangerWorker.pathFromParent(dir) + '*'
            });
          }
        }));
      if (Config.Server.Database.type === DatabaseType.mysql) {
        query.orderBy('CHAR_LENGTH(directory.path)', 'DESC'); // shorter the path, its higher up in the hierarchy
      } else {
        query.orderBy('LENGTH(directory.path)', 'DESC'); // shorter the path, its higher up in the hierarchy
      }


      PreviewManager.setSorting(query);
      return query;
    };

    let previewMedia = null;
    if (Config.Server.Preview.SearchQuery) {
      previewMedia = await previewQuery()
        .andWhere(await (ObjectManagers.getInstance().SearchManager as ISQLSearchManager)
          .prepareAndBuildWhereQuery(Config.Server.Preview.SearchQuery))
        .limit(1)
        .getOne();
    }

    if (!previewMedia) {
      previewMedia = await previewQuery()
        .limit(1)
        .getOne();
    }
    return previewMedia || null;
  }

}
