import test from 'ava';
import { BitbucketProvider } from '../src/bitbucket-repository-provider';

const REPOSITORY_URL =
  'https://arlac77@bitbucket.org/arlac77/sync-test-repository.git';
const REPOSITORY_NAME = 'arlac77/sync-test-repository';

const config = BitbucketProvider.optionsFromEnvironment(process.env);

test('optionsFromEnvironment undefined', async t => {
  t.is(BitbucketProvider.optionsFromEnvironment(undefined), undefined);
});

test('optionsFromEnvironment defined', async t => {
  t.deepEqual(
    BitbucketProvider.optionsFromEnvironment({
      BITBUCKET_USERNAME: 'user',
      BITBUCKET_PASSWORD: 'pass'
    }),
    { auth: { type: 'basic', username: 'user', password: 'pass' } }
  );
});

test('provider', async t => {
  const provider = new BitbucketProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME);

  t.is(repository.name, REPOSITORY_NAME);
  t.is(
    repository.urls.find(u => u.startsWith('http')),
    'https://bitbucket.org/arlac77/sync-test-repository.git'
  );

  const branches = await repository.branches();
  t.is(branches.get('master').name, 'master');

  const branch = await repository.branch('master');
  t.is(branch.name, 'master');
});

test('provider repository undefined', async t => {
  const provider = new BitbucketProvider(config);
  const repository = await provider.repository(undefined);

  t.is(repository, undefined);
});

test('provider url git+https', async t => {
  const provider = new BitbucketProvider(config);
  const repository = await provider.repository(
    'git+https://arlac77@bitbucket.org/arlac77/sync-test-repository.git'
  );

  t.is(repository.name, 'arlac77/sync-test-repository');
  t.is(repository.user, 'arlac77');

  const branch = await repository.branch('master');
  t.is(branch.name, 'master');
});

test('provider url https with user', async t => {
  const provider = new BitbucketProvider(config);
  const repository = await provider.repository(
    'https://arlac77@bitbucket.org/arlac77/sync-test-repository.git'
  );

  t.is(repository.name, 'arlac77/sync-test-repository');
  t.is(repository.user, 'arlac77');

  const branch = await repository.branch('master');
  t.is(branch.name, 'master');
});

test('provider url https with user and password', async t => {
  const provider = new BitbucketProvider(config);
  const repository = await provider.repository(
    'https://arlac77:aSecret@bitbucket.org/arlac77/sync-test-repository.git'
  );

  t.is(repository.name, 'arlac77/sync-test-repository');
  t.is(repository.user, 'arlac77');

  const branch = await repository.branch('master');
  t.is(branch.name, 'master');
});

test('provider url ssh://git@bitbucket.org/arlac77...', async t => {
  const provider = new BitbucketProvider(config);
  const repository = await provider.repository(
    'ssh://git@bitbucket.org/arlac77/sync-test-repository.git'
  );

  t.is(repository.name, 'arlac77/sync-test-repository');
  t.is(repository.user, 'arlac77');

  const branch = await repository.branch('master');
  t.is(branch.name, 'master');
});

test('provider url git@', async t => {
  const provider = new BitbucketProvider(config);
  const repository = await provider.repository(
    'git@bitbucket.org:arlac77/sync-test-repository.git'
  );

  t.is(repository.name, 'arlac77/sync-test-repository');
  t.is(repository.user, 'arlac77');

  const branch = await repository.branch('master');
  t.is(branch.name, 'master');
});

test('provider url git@ invalid', async t => {
  const provider = new BitbucketProvider(config);
  t.is(
    await provider.repository(
      'git@bitbucket.org/arlac77/sync-test-repository.git'
    ),
    undefined
  );
});

test('provider url git+ssh@', async t => {
  const provider = new BitbucketProvider(config);
  const repository = await provider.repository(
    'git+ssh@bitbucket.org:arlac77/sync-test-repository.git'
  );

  t.is(repository.name, 'arlac77/sync-test-repository');
  t.is(repository.user, 'arlac77');

  const branch = await repository.branch('master');
  t.is(branch.name, 'master');
});

test('provider repo with branch name', async t => {
  const provider = new BitbucketProvider(config);

  const branch = await provider.branch(REPOSITORY_NAME + '#master');

  t.is(branch.provider, provider);
  t.is(branch.name, 'master');
  //t.is(branch.user, 'arlac77');
});

test('create branch', async t => {
  const provider = new BitbucketProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME);
  const newName = `test-${new Date().getTime()}`;
  const branch = await repository.createBranch(newName);

  t.is(branch.name, newName);

  //await branch.delete();
});

test.skip('create branch', async t => {
  const provider = new BitbucketProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME);
  await repository.deleteBranch('test-2');
  t.is(await repository.branch('test-2'), undefined);
});

test('list', async t => {
  const provider = new BitbucketProvider(config);
  const branch = await provider.branch(REPOSITORY_NAME);

  t.deepEqual(await branch.list(), [{ path: 'README.md' }]);
});

test('content', async t => {
  const provider = new BitbucketProvider(config);
  const branch = await provider.branch(REPOSITORY_NAME);

  const c = await branch.content('README.md');

  t.is(c.path, 'README.md');
  t.is(c.content.startsWith('# README'), true);
});
