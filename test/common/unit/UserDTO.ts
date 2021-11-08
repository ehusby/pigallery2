import {expect} from 'chai';
import {UserDTO, UserDTOUtils} from '../../../src/common/entities/UserDTO';

describe('UserDTO', () => {


  it('should check available path', () => {
    expect(UserDTOUtils.isDirectoryPathAvailable('/', ['/'])).to.be.equals(true);
    expect(UserDTOUtils.isDirectoryPathAvailable('/', ['/subfolder', '/'])).to.be.equals(true);
    expect(UserDTOUtils.isDirectoryPathAvailable('/abc', ['/subfolder', '/'])).to.be.equals(false);
    expect(UserDTOUtils.isDirectoryPathAvailable('/abc', ['/subfolder', '/*'])).to.be.equals(true);
    expect(UserDTOUtils.isDirectoryPathAvailable('/abc', ['/subfolder'])).to.be.equals(false);
    expect(UserDTOUtils.isDirectoryPathAvailable('/abc/two', ['/subfolder'])).to.be.equals(false);
    expect(UserDTOUtils.isDirectoryPathAvailable('/abc/two', ['/'])).to.be.equals(false);
    expect(UserDTOUtils.isDirectoryPathAvailable('/abc/two', ['/*'])).to.be.equals(true);
  });

  it('should check directory', () => {
    expect(UserDTOUtils.isDirectoryAvailable({path: '/', name: 'abc'} as any, ['/*'])).to.be.equals(true);
    expect(UserDTOUtils.isDirectoryAvailable({path: '/', name: 'abc'} as any, ['/'])).to.be.equals(false);
    expect(UserDTOUtils.isDirectoryAvailable({path: '.\\', name: '.'} as any, ['/'])).to.be.equals(true);
    expect(UserDTOUtils.isDirectoryAvailable({path: '/', name: 'abc'} as any, ['/*', '/asdad'])).to.be.equals(true);
  });


});
