import test from "ava";
import { repositoryLivecycleTest } from "repository-provider-test-support";
import BitbucketProvider from "bitbucket-repository-provider";

test("create & delete repo", async t =>
  repositoryLivecycleTest(
    t,
    BitbucketProvider.initialize(undefined, process.env),
    "test-repo-1",
    "arlac77"
  ));
