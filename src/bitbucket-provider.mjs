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

const domain = "bitbucket.org";

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
      url: {
        type: "url",
        default: `https://${domain}/`
      },
      api: {
        type: "url",
        description: "URL of the provider api",
        env: "BITBUCKET_API",
        default: `https://api.${domain}/2.0/`
      },
      "authentication.token": {
        type: "string",
        description: "API token",
        // BB_TOKEN_BASIC_AUTH is this the same ?
        env: ["BITBUCKET_TOKEN", "BB_TOKEN"],
        additionalAttributes: { "authentication.type": "token" },
        private: true
      },
      "authentication.password": {
        type: "string",
        description: "Password for plain authentification",
        env: "BITBUCKET_PASSWORD",
        additionalAttributes: { "authentication.type": "basic" },
        private: true
      },
      "authentication.username": {
        type: "string",
        description: "Username for plain authentification",
        env: "BITBUCKET_USERNAME",
        additionalAttributes: { "authentication.type": "basic" }
      }
    };
  }

  /**
   * @param {Object} options
   * @return {boolean} true if authentication is present
   */
  static areOptionsSufficcient(options) {
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
      `ssh://${domain}`,
      `git@${domain}:`,
      `git@${domain}/`,
      `git+ssh@${domain}:`,
      `ssh@${domain}:`
    ];
  }

  /**
   * We are called bitbucket
   * @return {string} bitbucket
   */
  get name() {
    return "bitbucket";
  }

  /**
   * {@link https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories}
   */
  async initializeRepositories() {
    let next = `repositories/?role=contributor`;

    do {
      const response = await this.fetch(next);

      if (!response.ok) {
        break;
      }

      const res = await response.json();

      next = res.next;
      res.values.map(b => {
        const groupName = b.owner.nickname || b.owner.username;
        const group = this.addRepositoryGroup(groupName, b.owner);
        group.addRepository(b.name, b);
      });
    } while (next);
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
