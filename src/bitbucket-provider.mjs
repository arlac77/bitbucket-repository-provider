import fetch from "node-fetch";
import { replaceWithOneTimeExecutionMethod } from "one-time-execution-method";
import { stateActionHandler } from "fetch-rate-limit-util";
import { MultiGroupProvider } from "repository-provider";
import { BitbucketBranch } from "./bitbucket-branch.mjs";
import { BitbucketRepositoryGroup } from "./bitbucket-repository-group.mjs";
import { BitbucketRepository } from "./bitbucket-repository.mjs";
import { BitbucketPullRequest } from "./bitbucket-pull-request.mjs";
import { BitbucketHook } from "./bitbucket-hook.mjs";

export {
  BitbucketBranch,
  BitbucketRepository,
  BitbucketPullRequest,
  BitbucketRepositoryGroup,
  BitbucketHook
};

const domain = "bitbucket.org";

/**
 * Provider for bitbucket repositories.
 *
 * Supported name schemes are
 * - https://user:aSecret@bitbucket.org/owner/repo-name.git
 * - git+https://user:aSecret@bitbucket.org/owner/repo-name.git
 * - git@bitbucket.org:owner/repo-name.git
 * - owner/repo-name
 * Known environment variables
 * - BITBUCKET_API api
 * - BITBUCKET_TOKEN api token
 * - BITBUCKET_USERNAME username
 * - BITBUCKET_APP_PASSWORD password
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
   * We are called bitbucket.
   * @return {string} bitbucket
   */
  static get name() {
    return "bitbucket";
  }

  /**
   * Default instance env name prefix.
   */
  static get instanceIdentifier() {
    return "BITBUCKET_";
  }

  /**
   * Default configuration as given for the cloud privider.
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
        env: "{{instanceIdentifier}}API",
        set: value => (value.endsWith("/") ? value : value + "/"),
        default: `https://api.${domain}/2.0/`
      },
      "authentication.token": {
        type: "string",
        description: "API token",
        env: ["{{instanceIdentifier}}TOKEN"],
        additionalAttributes: { "authentication.type": "token" },
        private: true
      },
      "authentication.password": {
        type: "string",
        description: "Password for plain authentification",
        env: [
          "{{instanceIdentifier}}APP_PASSWORD",
          "{{instanceIdentifier}}PASSWORD"
        ],
        additionalAttributes: { "authentication.type": "basic" },
        private: true
      },
      "authentication.username": {
        type: "string",
        description: "Username for plain authentification",
        env: "{{instanceIdentifier}}USERNAME",
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
   * @return {Class} hook class used by the Provider
   */
  get hookClass() {
    return BitbucketHook;
  }

  /**
   * All possible base urls.
   * @return {string[]} common base urls of all repositories
   */
  get repositoryBases() {
    return super.repositoryBases.concat([
      this.url,
      `ssh://${domain}`,
      `git@${domain}:`,
      `git@${domain}/`,
      `git+ssh@${domain}:`,
      `ssh@${domain}:`
    ]);
  }

  /**
   * {@link https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories}
   */
  async initializeRepositories() {
    try {
      let next = "repositories/?role=contributor";

      do {
        const { json } = await this.fetchJSON(next);

        next = json.next;
        json.values.map(b => {
          const groupName = b.owner.nickname || b.owner.username;
          this.addRepositoryGroup(groupName, b.owner).addRepository(b.name, b);
        });
      } while (next);
    } catch {}
  }

  fetch(url, options = {}, responseHandler, actions) {
    let authorization;

    if (this.authentication.username) {
      authorization =
        "Basic " +
        Buffer.from(
          this.authentication.username + ":" + this.authentication.password
        ).toString("base64");
    } else {
      if (this.authentication.token) {
        authorization = "Bearer " + this.authentication.token;
      }
    }

    const headers = {
      authorization,
      ...options.headers
    };

    if (options.data) {
      options.body = JSON.stringify(options.data);
      delete options.data;
      headers["Content-Type"] = "application/json";
    }

    return stateActionHandler(
      fetch,
      new URL(url, this.api),
      {
        ...options,
        headers
      },
      responseHandler,
      actions,
      (url, ...args) => this.trace(url.toString(), ...args)
    );
  }

  fetchJSON(url, options, actions) {
    return this.fetch(
      url,
      options,
      async response => {
        return { response, json: await response.json() };
      },
      actions
    );
  }
}

replaceWithOneTimeExecutionMethod(
  BitbucketProvider.prototype,
  "initializeRepositories"
);

export default BitbucketProvider;