import { mocked } from '../../../../test/util';
import * as _branchify from '../updates/branchify';
import { extract, update } from './extract-update';

jest.mock('./write');
jest.mock('./sort');
jest.mock('./fetch');
jest.mock('../updates/branchify');
jest.mock('../extract');

const branchify = mocked(_branchify);

branchify.branchifyUpgrades.mockResolvedValueOnce({
  branches: [],
  branchList: [],
});

describe('workers/repository/process/extract-update', () => {
  describe('extract()', () => {
    it('runs', async () => {
      const config = {
        repoIsOnboarded: true,
        suppressNotifications: ['deprecationWarningIssues'],
      };
      const res = await extract(config);
      await update(config, res.branches, res.branchList, res.packageFiles);
    });
  });
});
