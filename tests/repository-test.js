import test from "ava";
import { BitbucketProject } from "../src/bitbucket-project";
import { BitbucketRepository } from "../src/bitbucket-repository";

test("BitbucketRepository constructor", t => {
  const project = new BitbucketProject("p1");
  const repository = new BitbucketRepository(project, "r1");

  t.is(repository.owner, project);
  t.is(repository.name, "r1");
});
