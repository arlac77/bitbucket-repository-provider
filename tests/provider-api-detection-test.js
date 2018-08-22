import test from "ava";
import { BitbucketProvider } from "../src/bitbucket-provider";

test("api url bitbucket.org", t => {
  t.deepEqual(
    { "2.0": "https://api.bitbucket.org/2.0" },
    BitbucketProvider.apiURLs(
      "https://user:pass@bitbucket.org/arlac77/sync-test-repository.git"
    )
  );
});

test("api url stash", t => {
  t.deepEqual(
    { "1.0": "https://stash.mydomain.com/rest/api/1.0" },
    BitbucketProvider.apiURLs(
      "https://user:pass@stash.mydomain.com/something/proj1/repo1"
    )
  );
});
