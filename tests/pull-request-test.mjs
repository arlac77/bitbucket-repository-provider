import test from "ava";
import { pullRequestLivecycle, pullRequestList, BITBUCKET_REPOSITORY_NAME } from "repository-provider-test-support";
import BitbucketProvider from "bitbucket-repository-provider";

test("pr livecycle", async t => {
  await pullRequestLivecycle(
    t,
    BitbucketProvider.initialize(undefined, process.env),
    BITBUCKET_REPOSITORY_NAME
  );
});

test("pr list", async t => {
  await pullRequestList(
    t,
    BitbucketProvider.initialize(undefined, process.env),
    BITBUCKET_REPOSITORY_NAME
  );
});
