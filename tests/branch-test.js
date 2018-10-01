import test from "ava";
import {
  Content,
} from "repository-provider";

import { BitbucketProvider } from "../src/bitbucket-provider";
import { BitbucketProject } from "../src/bitbucket-project";

const REPOSITORY_URL =
  "https://arlac77@bitbucket.org/arlac77/sync-test-repository.git";
const REPOSITORY_NAME = "arlac77/sync-test-repository";

const config = BitbucketProvider.optionsFromEnvironment(process.env);

test("create branch", async t => {
  const provider = new BitbucketProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME);
  const newName = `test-${new Date().getTime()}`;
  const branch = await repository.createBranch(newName);

  t.is(branch.name, newName);

  //await branch.delete();
});

test("delete branch", async t => {
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

test.only("list", async t => {
  const provider = new BitbucketProvider(config);
  const branch = await provider.branch(REPOSITORY_NAME);

  t.is(branch.name, "master");

  const entries = [];

  for await (const entry of branch.list()) {
    entries.push(entry);
  }

  t.true(entries[0].equals(new Content('README.md')));

  //t.deepEqual(entries, [{ path: "README.md" }]);
});

test("content", async t => {
  const provider = new BitbucketProvider(config);
  const branch = await provider.branch(REPOSITORY_NAME);

  const c = await branch.content("README.md");

  console.log(c.path);
  console.log(c.content);

  t.is(c.path, "README.md");
  t.is(c.content.startsWith("# README"), true);
});
