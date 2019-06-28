import test from "ava";
import { BitbucketProvider } from "../src/bitbucket-provider.mjs";


const config = BitbucketProvider.optionsFromEnvironment(process.env);

test.skip("groups by short name", async t => {
  const provider = new BitbucketProvider(config);
  const group = await provider.repositoryGroup("xhubio/decision-table");

  t.is(group.name, "decision-table");
});
