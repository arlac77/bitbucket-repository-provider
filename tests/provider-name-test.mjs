import test from "ava";
import { providerParseNameTest } from "repository-provider-test-support";
import { repositories } from "./fixtures/repositories.mjs";
import { BitbucketProvider } from "../src/bitbucket-provider.mjs";

test(providerParseNameTest, new BitbucketProvider(), repositories);

test(
  "mydomain",
  providerParseNameTest,
  new BitbucketProvider({
    url: "https://mydomain.org/repos/"
  }),
  {
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
  }
);
