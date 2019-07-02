import test from "ava";
import { BitbucketProvider } from "../src/bitbucket-provider.mjs";

const REPOSITORY_URL =
  "https://arlac77@bitbucket.org/arlac77/sync-test-repository.git";
const REPOSITORY_NAME = "arlac77/sync-test-repository";

test.skip("create pullRequest", async t => {
  const provider = BitbucketProvider.initialize(undefined, process.env);
  const branch = await provider.branch(REPOSITORY_NAME);

  const pr = await branch.createPullRequest(branch, "PR1");

  console.log(pr);

  t.is(pr.name, "PR1");
});
