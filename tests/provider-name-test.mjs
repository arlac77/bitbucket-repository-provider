import test from "ava";
import { BitbucketProvider } from "../src/bitbucket-provider.mjs";

test("provider parseName", t => {
  const provider = new BitbucketProvider();
  const nameFixtures = {
    "https://user:pass@bitbucket.org/arlac77/sync-test-repository.git#aBranch": {
      group: "arlac77",
      repository: "sync-test-repository",
      branch: "aBranch"
    },
    "https://bitbucket.org/arlac77/sync-test-repository.git#aBranch": {
      group: "arlac77",
      repository: "sync-test-repository",
      branch: "aBranch"
    },
    "git@bitbucket.org/arlac77/sync-test-repository.git#aBranch": {
      group: "arlac77",
      repository: "sync-test-repository",
      branch: "aBranch"
    },
    "git@bitbucket.org/arlac77/sync-test-repository.git": {
      group: "arlac77",
      repository: "sync-test-repository"
    },
    "git@bitbucket.org:arlac77/sync-test-repository.git": {
      group: "arlac77",
      repository: "sync-test-repository"
    },
    "git+ssh@bitbucket.org:arlac77/sync-test-repository.git#aBranch": {
      group: "arlac77",
      repository: "sync-test-repository",
      branch: "aBranch"
    },
    "ssh://git@bitbucket.org/arlac77/sync-test-repository.git": {
      group: "arlac77",
      repository: "sync-test-repository"
    },
    "git+https://arlac77@bitbucket.org/arlac77/sync-test-repository.git": {
      group: "arlac77",
      repository: "sync-test-repository"
    }
  };

  for (const name of Object.keys(nameFixtures)) {
    t.deepEqual(provider.parseName(name), nameFixtures[name]);
  }
});

test("provider parseName mydomain", t => {
  const provider = new BitbucketProvider({
    url: "https://mydomain.org/repos/"
  });

  const nameFixtures = {
    "git+https://arlac77@mydomain.org/repos/arlac77/sync-test-repository.git": {
      group: "arlac77",
      repository: "sync-test-repository"
    },
    "https://user:pass@mydomain.org/repos/arlac77/sync-test-repository.git#aBranch": {
      group: "arlac77",
      repository: "sync-test-repository",
      branch: "aBranch"
    }
  };

  for (const name of Object.keys(nameFixtures)) {
    t.deepEqual(provider.parseName(name), nameFixtures[name]);
  }
});
