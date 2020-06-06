import test from "ava";
import { entryListTest } from "repository-provider-test-support";
import BitbucketProvider from "bitbucket-repository-provider";

const REPOSITORY_URL =
  "https://arlac77@bitbucket.org/arlac77/sync-test-repository.git";
const REPOSITORY_NAME = "arlac77/sync-test-repository";

const config = BitbucketProvider.optionsFromEnvironment(process.env);
const provider = new BitbucketProvider(config);

test("branch entries list", async t => {
  const repository = await provider.repository(REPOSITORY_NAME);
  const branch = await repository.branch("master");
  await entryListTest(t, branch, undefined, {
    "README.md": { startsWith: "fil" },
    "tests/rollup.config.js": { startsWith: "import babel" },
    tests: { isCollection: true },
    "a/b/c/file.txt": { startsWith: "file content" }
  });
});

test("branch entries list with pattern", async t => {
  const repository = await provider.repository(REPOSITORY_NAME);
  const branch = await repository.branch("master");

  await entryListTest(t, branch, ["**/*.mjs", "!tests/*.mjs"], {
   // "tests/repository-test.mjs": { notPresent: true },
    "src/repository.mjs": { startsWith: "import" }
  });
});

test("branch entry", async t => {
  const branch = await provider.branch(REPOSITORY_NAME);
  const entry = await branch.entry("README.md");
  t.is(entry.name, "README.md");

  t.is((await entry.getString()).startsWith("file content #"), true);
});
