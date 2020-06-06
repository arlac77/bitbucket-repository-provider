import test from "ava";
import { pullRequestLivecycle, pullRequestList } from "repository-provider-test-support";
import BitbucketProvider from "bitbucket-repository-provider";

const REPOSITORY_NAME = "arlac77/sync-test-repository";

test("pr livecycle", async t => {
  await pullRequestLivecycle(
    t,
    BitbucketProvider.initialize(undefined, process.env),
    REPOSITORY_NAME
  );
});

test("pr list", async t => {
  await pullRequestList(
    t,
    BitbucketProvider.initialize(undefined, process.env),
    REPOSITORY_NAME
  );
});
