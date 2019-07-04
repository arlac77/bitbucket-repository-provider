import test from "ava";
import { assertRepo } from "./util.mjs";
import { BitbucketRepository } from "../src/bitbucket-repository.mjs";
import { BitbucketProvider } from "../src/bitbucket-provider.mjs";

const owner1 = {
  name: "arlac77"
};

const repoFixtures = {
  // "git@mfelten.de/github-repository-provider.git": undefined,
  // "http://www.heise.de/index.html": undefined,

  "https://arlac77@bitbucket.org/arlac77/npm-package-template.git": {
    provider: BitbucketProvider,
    fullName: "arlac77/npm-package-template",
    owner: owner1,
    hooks: [
      {
        id: "{79492efb-32b4-4f69-a469-606b58d2f8b5}",
        active: true,
        url: "https://mfelten.dynv6.net/services/ci/api/webhook",
        events: new Set(["repo:push"])
      }
    ]
  }
};

test("locate repository several", async t => {
  const provider = BitbucketProvider.initialize(undefined, process.env);

  for (const rn of Object.keys(repoFixtures)) {
    const r = repoFixtures[rn];
    const repository = await provider.repository(rn);
    await assertRepo(t, repository, repoFixtures[rn]);
  }
});

test("BitbucketRepository constructor", t => {
  const provider = new BitbucketProvider();
  const group = new provider.repositoryGroupClass("p1");
  const repository = new BitbucketRepository(group, "r1");

  t.is(repository.owner, group);
  t.is(repository.name, "r1");
});
