import test from "ava";
import { BitbucketProvider } from "bitbucket-repository-provider";

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
    { authentication: { type: "basic", username: "user", password: "pass" } }
  );
});

test("optionsFromEnvironment api", t => {
  t.deepEqual(
    BitbucketProvider.optionsFromEnvironment({
      BITBUCKET_API: "https://stash.myserver.mydomain:1234/api/2.0"
    }),
    { api: "https://stash.myserver.mydomain:1234/api/2.0" }
  );
});

test("optionsFromEnvironment token", t => {
  t.deepEqual(
    BitbucketProvider.optionsFromEnvironment({
      BB_TOKEN: "1234"
    }),
    { authentication: { type: "token", token: "1234" } }
  );
  t.deepEqual(
    BitbucketProvider.optionsFromEnvironment({
      BITBUCKET_TOKEN: "1234"
    }),
    { authentication: { type: "token", token: "1234" } }
  );
});

test("provider branches", async t => {
  const provider = new BitbucketProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME);

  t.is(repository.name, "sync-test-repository");
  t.is(
    repository.urls.find(u => u.startsWith("http")),
    "https://bitbucket.org/arlac77/sync-test-repository.git"
  );

  for await(const branch of repository.branches('master')) {
    t.is(branch.name, "master");
  }
});

test("provider repository undefined", async t => {
  const provider = new BitbucketProvider(config);
  const repository = await provider.repository(undefined);

  t.is(repository, undefined);
});

test("provider url git@ / ", async t => {
  const provider = new BitbucketProvider(config);
  t.is(
    (await provider.repository(
      "git@bitbucket.org/arlac77/sync-test-repository.git"
    )).name,
    "sync-test-repository"
  );
});

test("provider repo with branch name", async t => {
  const provider = new BitbucketProvider(config);
  const branch = await provider.branch(REPOSITORY_NAME + "#master");

  t.is(branch.provider, provider);
  t.is(branch.name, "master");
});
