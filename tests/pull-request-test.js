import test from 'ava';
import { BitbucketProvider } from '../src/bitbucket-provider';

const REPOSITORY_URL =
  'https://arlac77@bitbucket.org/arlac77/sync-test-repository.git';
const REPOSITORY_NAME = 'arlac77/sync-test-repository';

const config = {
  auth: {
    type: 'basic',
    password: process.env.BITBUCKET_PASSWORD,
    username: process.env.BITBUCKET_USERNAME
  }
};

test.skip('create pullRequest', async t => {
  const provider = new BitbucketProvider(config);
  const branch = await provider.branch(REPOSITORY_NAME);

  const pr = await branch.createPullRequest(branch, 'PR1');

  console.log(pr);

  t.is(pr.name, 'PR1');
});
