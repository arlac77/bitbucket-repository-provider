import test from "ava";
import { repositoryListTest } from "repository-provider-test-support";
import BitbucketProvider from "bitbucket-repository-provider";

const provider = BitbucketProvider.initialize(undefined, process.env);


const xhubioRepos = {
  "xhubio/decision-table-data-generator": {
    name: "decision-table-data-generator"
  }
};

test(repositoryListTest, provider, "xhubio/*", xhubioRepos);
test(repositoryListTest, provider, "bitbucket:xhubio/*", xhubioRepos);
test(repositoryListTest, provider, "https://bitbucket.org/xhubio/*", xhubioRepos);

test(repositoryListTest, provider, "unknown:xhubio/*");
test(repositoryListTest, provider, "xhubio/invalid_repository_name");
test(repositoryListTest, provider, "invalid_user_name/*");
test(repositoryListTest, provider, "");
