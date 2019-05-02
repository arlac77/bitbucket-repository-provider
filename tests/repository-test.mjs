import test from "ava";
import { BitbucketGroup } from "../src/bitbucket-project.mjs";
import { BitbucketRepository } from "../src/bitbucket-repository.mjs";

test("BitbucketRepository constructor", t => {
  const project = new BitbucketGroup("p1");
  const repository = new BitbucketRepository(project, "r1");

  t.is(repository.owner, project);
  t.is(repository.name, "r1");
});
