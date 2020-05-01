import { RenovateConfig } from '../../../config';
import { addMeta, logger, removeMeta } from '../../../logger';
import { PackageFile } from '../../../manager/common';
import { AdditionalPackageFiles } from '../../../manager/npm/post-update';
import { processBranch } from '../../branch';
import { BranchConfig } from '../../common';
import { getLimitRemaining } from '../../global/limits';
import { getPrsRemaining } from './limits';

export type WriteUpdateResult = 'done' | 'automerged';

export async function writeUpdates(
  config: RenovateConfig,
  packageFiles: Record<string, PackageFile[]> | AdditionalPackageFiles,
  allBranches: BranchConfig[]
): Promise<WriteUpdateResult> {
  let branches = allBranches;
  logger.debug(
    `Processing ${branches.length} branch${
      branches.length !== 1 ? 'es' : ''
    }: ${branches
      .map((b) => b.branchName)
      .sort()
      .join(', ')}`
  );
  branches = branches.filter((branchConfig) => {
    if (branchConfig.blockedByPin) {
      logger.debug(`Branch ${branchConfig.branchName} is blocked by a Pin PR`);
      return false;
    }
    return true;
  });
  let prsRemaining = await getPrsRemaining(config, branches);
  for (const branch of branches) {
    addMeta({ branch: branch.branchName });
    const res = await processBranch(
      branch,
      prsRemaining <= 0 || getLimitRemaining('prCommitsPerRunLimit') <= 0,
      packageFiles
    );
    branch.res = res;
    if (res === 'automerged' && config.automergeType !== 'pr-comment') {
      // Stop procesing other branches because base branch has been changed
      return res;
    }
    prsRemaining -= res === 'pr-created' ? 1 : 0;
  }
  removeMeta(['branch']);
  return 'done';
}
