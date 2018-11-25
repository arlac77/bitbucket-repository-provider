import test from "ava";
import { BitbucketProvider } from "../src/bitbucket-provider";

const REPOSITORY_URL =
  "https://arlac77@bitbucket.org/arlac77/sync-test-repository.git";
const REPOSITORY_NAME = "arlac77/sync-test-repository";

const config = BitbucketProvider.optionsFromEnvironment(process.env);

test("optionsFromEnvironment undefined", t => {
  t.is(BitbucketProvider.optionsFromEnvironment(undefined), undefined);
});

test("optionsFromEnvironment user", t => {
  t.deepEqual(
    BitbucketProvider.optionsFromEnvironment({
      BITBUCKET_USERNAME: "user",
      BITBUCKET_PASSWORD: "pass"
    }),
    { auth: { type: "basic", username: "user", password: "pass" } }
  );
});

test("optionsFromEnvironment token", t => {
  t.deepEqual(
    BitbucketProvider.optionsFromEnvironment({
      BB_TOKEN: "1234"
    }),
    { auth: { type: "token", token: "1234" } }
  );
  t.deepEqual(
    BitbucketProvider.optionsFromEnvironment({
      BITBUCKET_TOKEN: "1234"
    }),
    { auth: { type: "token", token: "1234" } }
  );
});

test("provider", async t => {
  const provider = new BitbucketProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME);

  t.is(repository.name, "sync-test-repository");
  t.is(
    repository.urls.find(u => u.startsWith("http")),
    "https://bitbucket.org/arlac77/sync-test-repository.git"
  );

  const branches = await repository.branches();
  t.is(branches.get("master").name, "master");
  /*
  const branch = await repository.branch("master");
  t.is(branch.name, "master");
  */
});

test("provider repository undefined", async t => {
  const provider = new BitbucketProvider(config);
  const repository = await provider.repository(undefined);

  t.is(repository, undefined);
});

test("provider url git+https mybitbucket.org", async t => {
  const provider = new BitbucketProvider({ url: "https://mybitbucket.org" });

  const repository = await provider.repository(
    "git+https://arlac77@mybitbucket.org/arlac77/sync-test-repository.git"
  );

  t.is(repository.name, "sync-test-repository");
  //t.is(repository.project.name, "arlac77");

  const branch = await repository.branch("master");
  t.is(branch.name, "master");
});

test("provider url git+https", async t => {
  const provider = new BitbucketProvider(config);
  const repository = await provider.repository(
    "git+https://arlac77@bitbucket.org/arlac77/sync-test-repository.git"
  );

  t.is(repository.name, "sync-test-repository");
  //t.is(repository.user, "arlac77");

  const branch = await repository.branch("master");
  t.is(branch.name, "master");
});

test("provider url https with user", async t => {
  const provider = new BitbucketProvider(config);
  const repository = await provider.repository(
    "https://arlac77@bitbucket.org/arlac77/sync-test-repository.git"
  );

  t.is(repository.name, "sync-test-repository");
  //t.is(repository.user, "arlac77");

  const branch = await repository.branch("master");
  t.is(branch.name, "master");
});

test("provider url https with user and password", async t => {
  const provider = new BitbucketProvider(config);
  const repository = await provider.repository(
    "https://arlac77:aSecret@bitbucket.org/arlac77/sync-test-repository.git"
  );

  t.is(repository.name, "sync-test-repository");
  //t.is(repository.user, "arlac77");

  const branch = await repository.branch("master");
  t.is(branch.name, "master");
});

test("provider url ssh://git@bitbucket.org/arlac77...", async t => {
  const provider = new BitbucketProvider(config);
  const repository = await provider.repository(
    "ssh://git@bitbucket.org/arlac77/sync-test-repository.git"
  );

  t.is(repository.name, "sync-test-repository");
  //t.is(repository.user, "arlac77");

  const branch = await repository.branch("master");
  t.is(branch.name, "master");
});

test("provider url git@ :", async t => {
  const provider = new BitbucketProvider(config);
  const repository = await provider.repository(
    "git@bitbucket.org:arlac77/sync-test-repository.git"
  );

  t.is(repository.name, "sync-test-repository");
  //t.is(repository.user, "arlac77");

  const branch = await repository.branch("master");
  t.is(branch.name, "master");
});

test("provider url git@ / ", async t => {
  const provider = new BitbucketProvider(config);
  t.is(
    (await provider.repository(
      "git@bitbucket.org/arlac77/sync-test-repository.git"
    )).name,
    'sync-test-repository'
  );
});

test("provider url git+ssh@", async t => {
  const provider = new BitbucketProvider(config);
  const repository = await provider.repository(
    "git+ssh@bitbucket.org:arlac77/sync-test-repository.git"
  );

  t.is(repository.name, "sync-test-repository");
  //t.is(repository.user, "arlac77");

  const branch = await repository.branch("master");
  t.is(branch.name, "master");
});

test("provider url https://user:pass@stash.mydomain.com", async t => {
  const provider = new BitbucketProvider();
  const repository = await provider.repository(
    "https://user:pass@stash.mydomain.com/something/proj1/repo1"
  );

  t.is(repository.name, "repo1");
  //t.is(repository.owner.name, "proj1");
});

test("provider repo with branch name", async t => {
  const provider = new BitbucketProvider(config);

  const branch = await provider.branch(REPOSITORY_NAME + "#master");

  t.is(branch.provider, provider);
  t.is(branch.name, "master");
  //t.is(branch.user, 'arlac77');
});
