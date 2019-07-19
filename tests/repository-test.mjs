import test from "ava";
import { assertRepo, assertBranch } from "./util.mjs";
import { BitbucketRepository } from "../src/bitbucket-repository.mjs";
import { BitbucketProvider } from "../src/bitbucket-provider.mjs";

const owner1 = {
  name: "arlac77",
  uuid: '{7eeeef8a-17ef-45be-996f-ea51387bc7b9}'
};

const repoFixtures = {
  //"git@mfelten.de/github-repository-provider.git": undefined,


  "http://somewhere.com/index": undefined,
  "https://somewhere.com/index.git": undefined,

  "https://arlac77@bitbucket.org/arlac77/sync-test-repository.git": {
    provider: BitbucketProvider,
    owner: owner1,
    name: "sync-test-repository",
    fullName: "arlac77/sync-test-repository",
    uuid: '{1fbf1cff-a829-473c-bd42-b5bd684868a1}',
    description: "test repository for npm-template-sync @bitbucket",
    branch: 'master'
  },
  "ssh://git@bitbucket.org/arlac77/sync-test-repository.git": {
    provider: BitbucketProvider,
    owner: owner1,
    name: "sync-test-repository",
    fullName: "arlac77/sync-test-repository",
    uuid: '{1fbf1cff-a829-473c-bd42-b5bd684868a1}',
    description: "test repository for npm-template-sync @bitbucket",
    branch: 'master'
  },
  "git@bitbucket.org:arlac77/sync-test-repository.git": {
    provider: BitbucketProvider,
    owner: owner1,
    name: "sync-test-repository",
    fullName: "arlac77/sync-test-repository",
    uuid: '{1fbf1cff-a829-473c-bd42-b5bd684868a1}',
    description: "test repository for npm-template-sync @bitbucket",
    branch: 'master'
  },
  "https://arlac77@bitbucket.org/arlac77/npm-package-template.git": {
    provider: BitbucketProvider,
    name: "npm-package-template",
    fullName: "arlac77/npm-package-template",
    uuid: '{36734289-3058-4c37-86ff-0ee8696d3d9d}',
    owner: owner1,
    hooks: [
      {
        id: "{79492efb-32b4-4f69-a469-606b58d2f8b5}",
        active: true,
        url: "https://mfelten.dynv6.net/services/ci/api/bitbucket",
        events: new Set(["repo:push"])
      }
    ],
    branch: 'master'
  }
};

test("locate repository several", async t => {
  t.plan(37);

  const provider = BitbucketProvider.initialize(undefined, process.env);

  for (const rn of Object.keys(repoFixtures)) {
    const repository = await provider.repository(rn);
    await assertRepo(t, repository, repoFixtures[rn], rn);
  }
});

test("locate branch several", async t => {
  t.plan(10);

  const provider = BitbucketProvider.initialize(undefined, process.env);

  for (const rn of Object.keys(repoFixtures)) {
    const branch = await provider.branch(rn);
    await assertBranch(t, branch, repoFixtures[rn], rn);
  }
});

test("BitbucketRepository constructor", t => {
  const provider = new BitbucketProvider();
  const group = new provider.repositoryGroupClass("p1");
  const repository = new BitbucketRepository(group, "r1");

  t.is(repository.owner, group);
  t.is(repository.name, "r1");
});
