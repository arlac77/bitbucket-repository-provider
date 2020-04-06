import test from "ava";
import { BitbucketProvider } from "../src/bitbucket-provider.mjs";

const REPOSITORY_URL =
  "https://arlac77@bitbucket.org/arlac77/sync-test-repository.git";
const REPOSITORY_NAME = "arlac77/sync-test-repository";

const config = BitbucketProvider.optionsFromEnvironment(process.env);

test.serial("branch create/delete", async t => {
  const provider = new BitbucketProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME);
  const newName = `test-${new Date().getTime()}`;
  const branch = await repository.createBranch(newName);

  t.is(branch.name, newName);

  await branch.delete();
});

test.serial("branch delete", async t => {
  const provider = BitbucketProvider.initialize(undefined, process.env);
  const repository = await provider.repository(REPOSITORY_NAME);

  const newName = `test-${new Date().getTime()}`;
  await repository.createBranch(newName);

  for await (const branch of repository.branches("test-*")) {
    const name = branch.name;
    console.log(`DELETE ${branch}`);
    await repository.deleteBranch(name);
    t.is(await repository.branch(name), undefined);
  }

  t.is(await repository.branch(newName), undefined);
});
