import fetch from "node-fetch";

import { Provider } from "repository-provider";
import { BitbucketBranch } from "./bitbucket-branch.mjs";
import { BitbucketRepository } from "./bitbucket-repository.mjs";
import { BitbucketPullRequest } from "./bitbucket-pull-request.mjs";

export { BitbucketBranch, BitbucketRepository, BitbucketPullRequest };

/**
 * Provider for bitbucket repositories
 *
 * Supported name schemes are
 * - https://user:aSecret@bitbucket.org/owner/repo-name.git
 * - git+https://user:aSecret@bitbucket.org/owner/repo-name.git
 * - git@bitbucket.org:owner/repo-name.git
 * - owner/repo-name
 * @param {Object} config
 * @param {string} config.url provider scm base
 * @param {string} config.api provider api base
 * @param {Object} config.authentication authentication
 * @param {string} config.authentication.type
 * @param {string} config.authentication.username
 * @param {string} config.authentication.password
 */
export class BitbucketProvider extends Provider {
  /**
   * Default configuration as given for the cloud privider
   * @return {Object}
   */
  static get defaultOptions() {
    return {
      url: "https://bitbucket.org",
      api: "https://api.bitbucket.org/2.0",
      authentication: {}
    };
  }

  /**
   * @param {Object} options
   * @return {boolean} true if token an api are present
   */
  static areOptionsSufficciant(options) {
    return options.authentication !== undefined;
  }

  /**
   * known environment variables
   * @return {Object}
   * @return {string} BITBUCKET_API api
   * @return {string} BB_TOKEN api token
   * @return {string} BITBUCKET_TOKEN api token
   * @return {string} BITBUCKET_USERNAME username
   * @return {string} BITBUCKET_PASSWORD password
   */
  static get environmentOptions() {
    const tokenDef = {
      path: "authentication.token",
      template: { type: "token" }
    };

    return {
      BITBUCKET_API: "api",
      BB_TOKEN: tokenDef,
      BITBUCKET_TOKEN: tokenDef,
      BITBUCKET_USERNAME: {
        path: "authentication.username",
        template: { type: "basic" }
      },
      BITBUCKET_PASSWORD: {
        path: "authentication.password",
        template: { type: "basic" }
      }
    };
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

  async *repositoryGroups(patterns) {
    const rg = await this.repositoryGroup(patterns);
    if(rg !== undefined) { yield rg; }
  }

  async repositoryGroup(name) {
    let group = await super.repositoryGroup(name);

    if (group !== undefined) {
      return group;
    }

    if (name === undefined) {
      return undefined;
    }

    let url = `repositories/${name}`; // + '?role=contributor';

    do {
      const r = await this.fetch(url);

      if (!r.ok) {
        return undefined;
      }

      const res = await r.json();

      url = res.next;
      await Promise.all(
        res.values.map(async b => {
          const groupName = b.owner.nickname || b.owner.username;
          group = this._repositoryGroups.get(groupName);
          if (group === undefined) {
            group = new this.repositoryGroupClass(this, groupName, b.owner);
            this._repositoryGroups.set(group.name, group);
          }

          const repository = new this.repositoryClass(group, b.name, b);
          group._repositories.set(repository.name, repository);
        })
      );
    } while (url);

    return group;
  }

  fetch(url, options) {
    let headers = {
      authorization:
        "Basic " +
        Buffer(
          this.authentication.username + ":" + this.authentication.password
        ).toString("base64")
    };

    if (options) {
      if (options.headers) {
        headers = { ...options.headers, ...headers };
      }
      if (options.data) {
        options.body = JSON.stringify(options.data);
        delete options.data;
        headers["Content-Type"] = "application/json";
      }
    }

    return fetch(`${this.api}/${url}`, {
      ...options,
      headers
    });
  }
}
