import fetch from "node-fetch";
import { replaceWithOneTimeExecutionMethod } from "one-time-execution-method";

import { MultiGroupProvider } from "repository-provider";
import { BitbucketBranch } from "./bitbucket-branch.mjs";
import { BitbucketRepositoryGroup } from "./bitbucket-repository-group.mjs";
import { BitbucketRepository } from "./bitbucket-repository.mjs";
import { BitbucketPullRequest } from "./bitbucket-pull-request.mjs";

export {
  BitbucketBranch,
  BitbucketRepository,
  BitbucketPullRequest,
  BitbucketRepositoryGroup
};

/**
 * Provider for bitbucket repositories
 *
 * Supported name schemes are
 * - https://user:aSecret@bitbucket.org/owner/repo-name.git
 * - git+https://user:aSecret@bitbucket.org/owner/repo-name.git
 * - git@bitbucket.org:owner/repo-name.git
 * - owner/repo-name
 * Known environment variables
 * - BITBUCKET_API api
 * - BB_TOKEN api token
 * - BITBUCKET_TOKEN api token
 * - BITBUCKET_USERNAME username
 * - BITBUCKET_PASSWORD password
 * @param {Object} config
 * @param {string} config.url provider scm base
 * @param {string} config.api provider api base
 * @param {Object} config.authentication authentication
 * @param {string} config.authentication.type
 * @param {string} config.authentication.username
 * @param {string} config.authentication.password
 */
export class BitbucketProvider extends MultiGroupProvider {
  /**
   * Default configuration as given for the cloud privider
   * @return {Object}
   */
  static get attributes() {
    return {
      ...super.attributes,
      url: "https://bitbucket.org/",
      api: {
        env: "BITBUCKET_API",
        default: "https://api.bitbucket.org/2.0/"
      },
      "authentication.token": {
        env: ["BITBUCKET_TOKEN", "BB_TOKEN"],
        additionalAttributes: { "authentication.type": "token" },
        private: true
      },
      "authentication.password": {
        env: "BITBUCKET_PASSWORD",
        additionalAttributes: { "authentication.type": "basic" },
        private: true
      },
      "authentication.username": {
        env: "BITBUCKET_USERNAME",
        additionalAttributes: { "authentication.type": "basic" }
      },
      "authentication.type": {}
    };
  }

  /**
   * @param {Object} options
   * @return {boolean} true if authentication is present
   */
  static areOptionsSufficciant(options) {
    return options["authentication.type"] !== undefined;
  }

  /**
   * @return {Class} repository group class used by the Provider
   */
  get repositoryGroupClass() {
    return BitbucketRepositoryGroup;
  }

  /**
   * @return {Class} BitbucketRepository
   */
  get repositoryClass() {
    return BitbucketRepository;
  }

  /**
   * @return {Class} BitbucketBranch
   */
  get branchClass() {
    return BitbucketBranch;
  }

  /**
   * @return {Class} pull request class used by the Provider
   */
  get pullRequestClass() {
    return BitbucketPullRequest;
  }

  /**
   * All possible base urls
   * @return {string[]} common base urls of all repositories
   */
  get repositoryBases() {
    return [
      this.url,
      "ssh://bitbucket.org",
      "git@bitbucket.org:",
      "git@bitbucket.org/",
      "git+ssh@bitbucket.org:",
      "ssh@bitbucket.org:"
    ];
  }
  async initializeRepositories() {
    let url = `repositories/?role=contributor`;

    do {
      const r = await this.fetch(url);

      if (!r.ok) {
        break;
      }

      const res = await r.json();

      url = res.next;
      res.values.map(b => {
        const groupName = b.owner.nickname || b.owner.username;
        const group = this.addRepositoryGroup(groupName, b.owner);
        group.addRepository(b.name, b);
      });
    } while (url);
  }

  fetch(url, options = {}) {
    const headers = {
      authorization:
        "Basic " +
        Buffer.from(
          this.authentication.username + ":" + this.authentication.password
        ).toString("base64"),
      ...options.headers
    };

    if (options.data) {
      options.body = JSON.stringify(options.data);
      delete options.data;
      headers["Content-Type"] = "application/json";
    }

    return fetch(new URL(url, this.api), {
      ...options,
      headers
    });
  }
}

replaceWithOneTimeExecutionMethod(
  BitbucketProvider.prototype,
  "initializeRepositories"
);

export default BitbucketProvider;
