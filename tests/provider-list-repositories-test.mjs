import test from "ava";
import { BitbucketProvider } from "../src/bitbucket-provider";

test("list repositories", async t => {
  const provider = new BitbucketProvider(
    BitbucketProvider.optionsFromEnvironment(process.env)
  );

  const rps = new Set();

  for await (const r of await provider.repositories("XXX/*")) {
    console.log(r);
    rps.add(r.name);
  }

  t.is(rps.size, 1);
});
