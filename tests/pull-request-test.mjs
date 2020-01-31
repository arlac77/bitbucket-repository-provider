import test from "ava";
import { pullRequestLivecycle } from "repository-provider-test-support";

import { BitbucketProvider } from "../src/bitbucket-provider.mjs";

const REPOSITORY_NAME = "arlac77/sync-test-repository";

test("pr livecycle", async t => {
  await pullRequestLivecycle(t, BitbucketProvider.initialize(undefined, process.env), REPOSITORY_NAME);
});

test("pr list", async t => {
  const provider = BitbucketProvider.initialize(undefined, process.env);
  const repository = await provider.repository("arlac77/npm-package-template");

  const prs = [];

  for await (const pr of repository.pullRequests()) {
    console.log(pr);

    prs.push(pr);
  }
  t.true(prs.length > 0);
});
