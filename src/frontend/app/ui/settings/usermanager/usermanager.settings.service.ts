import {Injectable} from '@angular/core';
import {UserDTO} from '../../../../../common/entities/UserDTO';
import {NetworkService} from '../../../model/network/network.service';

import {WebConfig} from '../../../../../common/config/private/WebConfig';


@Injectable()
export class UserManagerSettingsService {


  constructor(private networkService: NetworkService) {
  }

  public createUser(user: UserDTO): Promise<string> {
    return this.networkService.putJson('/user', {newUser: user});
  }

  public async getSettings(): Promise<boolean> {
    return (await this.networkService.getJson<Promise<WebConfig>>('/settings')).Client.authenticationRequired;
  }

  public updateSettings(settings: boolean): Promise<void> {
    return this.networkService.putJson('/settings/authentication', {settings});
  }

  public getUsers(): Promise<Array<UserDTO>> {
    return this.networkService.getJson('/user/list');
  }


  public deleteUser(user: UserDTO): Promise<void> {
    return this.networkService.deleteJson('/user/' + user.id);
  }

  public updateRole(user: UserDTO): Promise<void> {
    return this.networkService.postJson('/user/' + user.id + '/role', {newRole: user.role});
  }
}
