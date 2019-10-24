import test from "ava";
import { repositoryListTest } from "repository-provider-test-support";
import { BitbucketProvider } from "../src/bitbucket-provider.mjs";

test(
  repositoryListTest,
  BitbucketProvider.initialize(undefined, process.env),
  "xhubio/*",
  {
    "decision-table-data-generator": { name: "decision-table-data-generator" }
  }
);

test(
  repositoryListTest,
  BitbucketProvider.initialize(undefined, process.env),
  undefined,
  undefined
);
