import test from "ava";
import { BitbucketProvider } from "../src/bitbucket-provider.mjs";

test("api url undefined", t => {
  const provider = new BitbucketProvider();
  t.is(provider.analyseURL(undefined), undefined);
});

test("api url https://bitbucket.org", t => {
  const provider = new BitbucketProvider();
  t.deepEqual(
    {
      group: "arlac77",
      repository: "sync-test-repository",
      branch: "aBranch"
    },
    provider.analyseURL(
      "https://user:pass@bitbucket.org/arlac77/sync-test-repository.git#aBranch"
    )
  );
});

test("analyse url project only", t => {
  const provider = new BitbucketProvider();

  t.deepEqual(
    {
      group: "arlac77"
    },
    provider.analyseURL("arlac77")
  );

  t.deepEqual(
    {
      group: "arlac77"
    },
    provider.analyseURL("arlac77", { part: "project" })
  );
});

test.skip("api url given config", t => {
  const provider = new BitbucketProvider({
    api: "https://api.mydomain.org/api/2.0"
  });
  t.deepEqual(
    {
      group: "arlac77",
      repository: "sync-test-repository",
      branch: "aBranch"
    },
    provider.analyseURL(
      "https://user:pass@mydomain.org/arlac77/sync-test-repository.git#aBranch"
    )
  );
});

test("api url git@bitbucket.org", t => {
  const provider = new BitbucketProvider();
  t.deepEqual(
    {
      group: "arlac77",
      repository: "sync-test-repository",
      branch: "aBranch"
    },
    provider.analyseURL(
      "git@bitbucket.org/arlac77/sync-test-repository.git#aBranch"
    )
  );
});

test("api url git+https@mybitbucket.org", t => {
  const provider = new BitbucketProvider();
  t.deepEqual(
    {
      group: "arlac77",
      repository: "sync-test-repository",
      branch: "aBranch"
    },
    provider.analyseURL(
      "git+https://arlac77@mybitbucket.org/arlac77/sync-test-repository.git#aBranch"
    )
  );
});

test("api url git+ssh@bitbucket.org:", t => {
  const provider = new BitbucketProvider();
  t.deepEqual(
    {
      group: "arlac77",
      repository: "sync-test-repository",
      branch: "aBranch"
    },
    provider.analyseURL(
      "git+ssh@bitbucket.org:arlac77/sync-test-repository.git#aBranch"
    )
  );
});

test("api url git+ssh@bitbucket.org/", t => {
  const provider = new BitbucketProvider();
  t.deepEqual(
    {
      group: "arlac77",
      repository: "sync-test-repository",
      branch: ""
    },
    // TODO may be incorrect
    provider.analyseURL("git@bitbucket.org/arlac77/sync-test-repository.git")
  );
});

test("api url stash", t => {
  const provider = new BitbucketProvider();
  t.deepEqual(
    {
      group: "proj1",
      repository: "repo1",
      branch: "aBranch"
    },
    provider.analyseURL(
      "https://user:pass@stash.mydomain.com/something/proj1/repo1#aBranch"
    )
  );
});
