import test from "ava";
import { repositories } from "./fixtures/repositories.mjs";
import { BitbucketProvider } from "../src/bitbucket-provider.mjs";

test("provider parseName", t => {
  const provider = new BitbucketProvider();
  for (const [name,repo] of Object.entries(repositories)) {
    t.log(name);
    t.deepEqual(provider.parseName(name), repo, name);
  }
});

test("provider parseName mydomain", t => {
  const provider = new BitbucketProvider({
    url: "https://mydomain.org/repos/"
  });

  const nameFixtures = {
    "git+https://arlac77@mydomain.org/repos/arlac77/sync-test-repository.git": {
      base: "https://mydomain.org/repos/",
      group: "arlac77",
      repository: "sync-test-repository"
    },
    "https://user:pass@mydomain.org/repos/arlac77/sync-test-repository.git#aBranch": {
      base: "https://mydomain.org/repos/",
      group: "arlac77",
      repository: "sync-test-repository",
      branch: "aBranch"
    }
  };

  for (const [name,repo] of Object.entries(nameFixtures)) {
    t.deepEqual(provider.parseName(name), repo, name);
  }
});
