import test from "ava";
import { BitbucketProvider } from "../src/bitbucket-provider";

test("api url undefined", t => {
  t.is(BitbucketProvider.analyseURL(undefined), undefined);
});

test("api url https://bitbucket.org", t => {
  t.deepEqual(
    {
      api: { "2.0": "https://api.bitbucket.org/2.0" },
      project: "arlac77",
      repository: "sync-test-repository",
      branch: "aBranch"
    },
    BitbucketProvider.analyseURL(
      "https://user:pass@bitbucket.org/arlac77/sync-test-repository.git#aBranch"
    )
  );
});

test("api url git@bitbucket.org", t => {
  t.deepEqual(
    {
      api: { "2.0": "https://api.bitbucket.org/2.0" },
      project: "arlac77",
      repository: "sync-test-repository",
      branch: "aBranch"
    },
    BitbucketProvider.analyseURL(
      "git@bitbucket.org/arlac77/sync-test-repository.git#aBranch"
    )
  );
});

test("api url git+https@mybitbucket.org", t => {
  t.deepEqual(
    {
      api: { "2.0": "https://api.mybitbucket.org/2.0" },
      project: "arlac77",
      repository: "sync-test-repository",
      branch: "aBranch"
    },
    BitbucketProvider.analyseURL(
      "git+https://arlac77@mybitbucket.org/arlac77/sync-test-repository.git#aBranch"
    )
  );
});

test("api url git+ssh@bitbucket.org:", t => {
  t.deepEqual(
    {
      api: { "2.0": "https://api.bitbucket.org/2.0" },
      project: "arlac77",
      repository: "sync-test-repository",
      branch: "aBranch"
    },
    BitbucketProvider.analyseURL(
      "git+ssh@bitbucket.org:arlac77/sync-test-repository.git#aBranch"
    )
  );
});

test("api url git+ssh@bitbucket.org/", t => {
  t.deepEqual(
    {
      api: { "2.0": "https://api.bitbucket.org/2.0" },
      project: "arlac77",
      repository: "sync-test-repository",
      branch: ""
    },
    // TODO may be incorrect
    BitbucketProvider.analyseURL(
      "git@bitbucket.org/arlac77/sync-test-repository.git"
    )
  );
});

test("api url stash", t => {
  t.deepEqual(
    {
      api: { "1.0": "https://stash.mydomain.com/rest/api/1.0" },
      project: "proj1",
      repository: "repo1",
      branch: "aBranch"
    },
    BitbucketProvider.analyseURL(
      "https://user:pass@stash.mydomain.com/something/proj1/repo1#aBranch"
    )
  );
});
