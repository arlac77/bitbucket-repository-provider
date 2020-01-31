import test from "ava";
import { pullRequestLivecycle } from "repository-provider-test-support";
import { StringContentEntry } from "content-entry";

import { BitbucketProvider } from "../src/bitbucket-provider.mjs";

const REPOSITORY_NAME = "arlac77/sync-test-repository";

test("pr livecycle", async t => {
  await pullRequestLivecycle(
    t,
    BitbucketProvider.initialize(undefined, process.env),
    REPOSITORY_NAME
  );
});

test("pr list", async t => {
  const provider = BitbucketProvider.initialize(undefined, process.env);
  const repository = await provider.repository(REPOSITORY_NAME);

  const destination = await repository.defaultBranch;

  const sources = await Promise.all(
    ["pr-test/source-1", "pr-test/source-2"].map(async bn => {
      const branch = await repository.createBranch(bn);
      const commit = await branch.commit("message text", [
        new StringContentEntry("README.md", `file content #${bn}`)
      ]);

      const pr = await provider.pullRequestClass.open(branch, destination, {
        title: `test pr from ${bn}`,
        body: "this is the body\n- a\n- b\n- c"
      });

      return branch;
    })
  );

  let numberOfSources0 = 0;

  for await (const pr of provider.pullRequestClass.list(repository, {
    source: sources[0]
  })) {
    t.is(pr.source, sources[0]);
    t.is(pr.destination, destination);
    numberOfSources0++;
  }

  t.is(numberOfSources0, 1);

  const prs = [];

  for await (const pr of provider.pullRequestClass.list(repository)) {
    // console.log(pr.toString());
    prs.push(pr);
  }

  t.true(prs.length >= 2);
});
