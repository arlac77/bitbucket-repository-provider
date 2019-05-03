import test from "ava";
import { BitbucketGroup } from "../src/bitbucket-group.mjs";
import { BitbucketRepository } from "../src/bitbucket-repository.mjs";

test("BitbucketRepository constructor", t => {
  const group = new BitbucketGroup("p1");
  const repository = new BitbucketRepository(group, "r1");

  t.is(repository.owner, group);
  t.is(repository.name, "r1");
});
