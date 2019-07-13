import test from "ava";
import {pullRequestLivecycle } from './util.mjs';

import { BitbucketProvider } from "../src/bitbucket-provider.mjs";

const REPOSITORY_NAME = "arlac77/sync-test-repository";

test.only("create pullRequest", async t => {
  const provider = BitbucketProvider.initialize(undefined, process.env);

  await pullRequestLivecycle(t, provider, REPOSITORY_NAME);
});

test("list pullRequest", async t => {
  const provider = BitbucketProvider.initialize(undefined, process.env);
  const repository = await provider.repository("arlac77/npm-package-template");

  const prs = [];

  for await (const pr of repository.pullRequests()) {
    console.log(pr);

    prs.push(pr);
  }
  t.true(prs.length > 0);
});
