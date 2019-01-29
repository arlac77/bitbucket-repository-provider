import test from "ava";
import { BitbucketProvider } from "../src/bitbucket-provider";
import { BitbucketProject } from "../src/bitbucket-project";
import { EmptyContentEntry } from "content-entry";

const REPOSITORY_URL =
  "https://arlac77@bitbucket.org/arlac77/sync-test-repository.git";
const REPOSITORY_NAME = "arlac77/sync-test-repository";

const config = BitbucketProvider.optionsFromEnvironment(process.env);

test.skip("branch create", async t => {
  const provider = new BitbucketProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME);
  const newName = `test-${new Date().getTime()}`;
  const branch = await repository.createBranch(newName);

  t.is(branch.name, newName);

  //await branch.delete();
});

test.skip("branch delete", async t => {
  const provider = new BitbucketProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME);

  const branches = await repository.branches();

  for (const [name, branch] of branches.entries()) {
    if (name.match(/^test-/)) {
      console.log(`${name}: ${branch}`);

      await repository.deleteBranch(name);
      t.is(await repository.branch(name), undefined);
    }
  }
});
