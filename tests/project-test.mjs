import test from "ava";
import { BitbucketProvider } from "../src/bitbucket-provider";
import { BitbucketProject } from "../src/bitbucket-project";


const config = BitbucketProvider.optionsFromEnvironment(process.env);

test("project by short name", async t => {
  const provider = new BitbucketProvider(config);
  const project = await provider.project("decission-table");

  t.is(project.name, "decission-table");
});
