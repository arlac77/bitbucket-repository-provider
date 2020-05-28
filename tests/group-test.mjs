import test from "ava";
import { BitbucketProvider } from "../src/bitbucket-provider.mjs";


const config = BitbucketProvider.optionsFromEnvironment(process.env);

test("groups by short name", async t => {
  const provider = new BitbucketProvider(config);
  const group = await provider.repositoryGroup("xhubio");

  t.is(group.name, "xhubio");
  t.is(group.type, "team");
});
