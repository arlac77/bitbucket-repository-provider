import test from "ava";
import { BitbucketProvider } from "../src/bitbucket-provider.mjs";

test("list repositories", async t => {
  const provider = BitbucketProvider.initialize(undefined,process.env);

  const rps = new Map();

  for await (const r of provider.repositories("xhubio/*")) {
    console.log("NAME", r.name);
    rps.set(r.name,r);
  }

 // t.is(rps.get('user').name, 'user');

  t.is(rps.get('decision-table-data-generator').name, 'decision-table-data-generator');
});
