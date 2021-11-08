import {UserDTO, UserRoles} from '../../../../common/entities/UserDTO';
import {IUserManager} from '../interfaces/IUserManager';
import {UserEntity} from './enitites/UserEntity';
import {SQLConnection} from './SQLConnection';
import {PasswordHelper} from '../../PasswordHelper';


export class UserManager implements IUserManager {

  constructor() {
  }


  public async findOne(filter: any): Promise<any> {
    const connection = await SQLConnection.getConnection();
    const pass = filter.password;
    delete filter.password;
    const user = (await connection.getRepository(UserEntity).findOne(filter));

    if (pass && !PasswordHelper.comparePassword(pass, user.password)) {
      throw new Error('No entry found');
    }
    return user;

  }

  public async find(filter: any): Promise<any> {
    const connection = await SQLConnection.getConnection();
    return await connection.getRepository(UserEntity).find(filter);
  }

  public async createUser(user: UserDTO): Promise<any> {
    const connection = await SQLConnection.getConnection();
    user.password = PasswordHelper.cryptPassword(user.password);
    return connection.getRepository(UserEntity).save(user);
  }

  public async deleteUser(id: number): Promise<any> {
    const connection = await SQLConnection.getConnection();
    const user = await connection.getRepository(UserEntity).findOne({id});
    return await connection.getRepository(UserEntity).remove(user);
  }

  public async changeRole(id: number, newRole: UserRoles): Promise<any> {

    const connection = await SQLConnection.getConnection();
    const userRepository = connection.getRepository(UserEntity);
    const user = await userRepository.findOne({id});
    user.role = newRole;
    return userRepository.save(user);

  }

  public async changePassword(request: any): Promise<void> {
    throw new Error('not implemented'); // TODO: implement
  }

}
