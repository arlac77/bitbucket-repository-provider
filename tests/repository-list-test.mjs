import test from "ava";
import { repositoryListTest } from "repository-provider-test-support";
import BitbucketProvider from "bitbucket-repository-provider";

const provider = BitbucketProvider.initialize(undefined, process.env);

test(repositoryListTest, provider, "xhubio/*", {
  "xhubio/decision-table-data-generator": {
    name: "decision-table-data-generator"
  }
});
test(repositoryListTest, provider, "xhubio/invalid_repository_name");
test(repositoryListTest, provider, "invalid_user_name/*");
test(repositoryListTest, provider, "");
