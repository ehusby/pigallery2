import {SharingDTO} from '../../../../src/common/entities/SharingDTO';
import {ObjectManagers} from '../../../../src/backend/model/ObjectManagers';
import {UserDTO, UserRoles} from '../../../../src/common/entities/UserDTO';
import {Utils} from '../../../../src/common/Utils';

export class RouteTestingHelper {


  static async createSharing(testUser: UserDTO, password: string = null): Promise<SharingDTO> {
    const sharing = {
      sharingKey: 'sharing_test_key_' + Date.now(),
      path: 'test',
      expires: Date.now() + 1000,
      timeStamp: Date.now(),
      includeSubfolders: false,
      creator: testUser
    } as SharingDTO;
    if (password) {
      sharing.password = password;
    }
    await ObjectManagers.getInstance().SharingManager.createSharing(Utils.clone(sharing)); // do not rewrite password
    return sharing;
  }

  public static getExpectedSharingUser(sharing: SharingDTO): UserDTO {
    return {
      name: 'Guest',
      role: UserRoles.LimitedGuest,
      permissions: [sharing.path],
      usedSharingKey: sharing.sharingKey
    } as UserDTO;
  }
}
