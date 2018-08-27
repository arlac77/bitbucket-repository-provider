import test from "ava";
import { BitbucketProvider } from "../src/bitbucket-provider";
import { BitbucketProject } from "../src/bitbucket-project";

const REPOSITORY_URL =
  "https://arlac77@bitbucket.org/arlac77/sync-test-repository.git";
const REPOSITORY_NAME = "arlac77/sync-test-repository";

const config = BitbucketProvider.optionsFromEnvironment(process.env);

test.skip("project by short name", async t => {
  const provider = new BitbucketProvider(config);
  const project = await provider.project("decission-table");

  t.is(project.name, "decission-table");
});
