import test from "ava";
import { BitbucketProvider } from "../src/bitbucket-provider.mjs";


const config = BitbucketProvider.optionsFromEnvironment(process.env);

test("groups by short name", async t => {
  const provider = new BitbucketProvider(config);
  const project = await provider.repositoryGroup("xhubio/decision-table");

  t.is(project.name, "decision-table");
});
