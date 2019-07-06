import test from "ava";
import {createBranchFrom } from './util.mjs';

import { BitbucketProvider } from "../src/bitbucket-provider.mjs";

const REPOSITORY_NAME = "arlac77/sync-test-repository";

test.skip("create pullRequest", async t => {
  const provider = BitbucketProvider.initialize(undefined, process.env);  
  const destination = await provider.branch(REPOSITORY_NAME);

  const source = createBranchFrom(destination,'pr-creation-test/*');

  const pr = await provider.pullRequestClass.open(source, destination, {
    title: 'my PR'
  });

  console.log(pr);

  t.is(pr.name, "my PR");
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
