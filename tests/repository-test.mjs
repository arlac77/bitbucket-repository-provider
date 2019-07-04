import test from "ava";
import { BitbucketRepository } from "../src/bitbucket-repository.mjs";
import { BitbucketProvider } from "../src/bitbucket-provider.mjs";

async function assertRepo(t, repository, fixture) {
  if (fixture === undefined) {
    t.is(repository, undefined);
  } else {
    t.is(repository.fullName, fixture.fullName);

    if (fixture.owner) {
      t.is(repository.owner.name, fixture.owner.name);
      t.is(repository.owner.id, fixture.owner.id);
    }

    if (fixture.hooks) {
      for await (const h of repository.hooks()) {
        const fh = fixture.hooks.find(x => x.id === h.id);
        if (fh) {
          t.is(h.id, fh.id);
          t.is(h.url, fh.url);
          t.is(h.active, fh.active);
          t.deepEqual(h.events, fh.events);
        }
      }
    }

    if (fixture.provider) {
      t.is(repository.provider.constructor, fixture.provider);
    }
  }
}

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
