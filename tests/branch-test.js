import test from "ava";
import { Entry } from "repository-provider";

import { BitbucketProvider } from "../src/bitbucket-provider";
import { BitbucketProject } from "../src/bitbucket-project";

const REPOSITORY_URL =
  "https://arlac77@bitbucket.org/arlac77/sync-test-repository.git";
const REPOSITORY_NAME = "arlac77/sync-test-repository";

const config = BitbucketProvider.optionsFromEnvironment(process.env);

test.only("branch create", async t => {
  const provider = new BitbucketProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME);
  const newName = `test-${new Date().getTime()}`;
  const branch = await repository.createBranch(newName);

  t.is(branch.name, newName);

  //await branch.delete();
});

test("branch delete", async t => {
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

test("list", async t => {
  const provider = new BitbucketProvider(config);
  const branch = await provider.branch(REPOSITORY_NAME);

  t.is(branch.name, "master");

  const entries = [];

  for await (const entry of branch.list()) {
    entries.push(entry);
  }

  t.true(entries[0].equals(new Entry("README.md")));

  //t.deepEqual(entries, [{ path: "README.md" }]);
});

test("entry", async t => {
  const provider = new BitbucketProvider(config);
  const branch = await provider.branch(REPOSITORY_NAME);
  const entry = await branch.entry("README.md");

  console.log(entry);
  t.is(entry.name, "README.md");
  t.is((await entry.getString()).startsWith("# README"), true);
});
