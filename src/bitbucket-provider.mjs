import fetch from "node-fetch";

import { Provider } from "repository-provider";
import { BitbucketBranch } from "./bitbucket-branch.mjs";
import { BitbucketRepository } from "./bitbucket-repository.mjs";

export { BitbucketBranch, BitbucketRepository };

/**
 * Provider for bitbucket repositories
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
   * @return {string} BITBUCKET_TOKEN ´api token
   * @return {string} BITBUCKET_USERNAME username
   * @return {string} BITBUCKET_PASSWORD password
   */
  static get environmentOptions() {
    const tokenDef = { path: 'authentication.token', template: { type: 'token' } };

    return {
      BITBUCKET_API: 'api',
      BB_TOKEN: tokenDef,
      BITBUCKET_TOKEN: tokenDef,
      BITBUCKET_USERNAME: { path: 'authentication.username', template: { type: 'basic' } },
      BITBUCKET_PASSWORD: { path: 'authentication.password', template: { type: 'basic' } }
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
   * decode URL for a given repo url
   * @param {string} url bitbucket (repo)
   * @param {Object} options api version
   * @return {Object} bitbucket api urls by version
   */
  analyseURL(url, options = { }) {
    if (url === undefined) {
      return undefined;
    }

    if (url.match(/^(\w+)$/)) {
      switch (options.part) {
        case "group":
          return { group: url };
          break;
        case "repository":
          return { repository: url };
          break;
      }

      return { group: url };
    }

    if (url.startsWith("git@") || url.startsWith("git+ssh@")) {
      url = url.replace(/^\w+@/, "");
      url = url.replace(/:/, "/");
      url = "https://" + url;
    } else if (url.startsWith("git+https:")) {
      url = url.replace(/^git\+/, "");
    }
    if (!url.match(/^[\w\+]+:/)) {
      // TODO default url
      url = "https://bitbucket.org/" + url;
    }

    const apiURL = new URL(url);
    const branch = apiURL.hash.substring(1);

    const parts = apiURL.pathname.split(/\//);
    const group = parts[parts.length - 2];
    let repository = parts[parts.length - 1];

    repository = repository.replace(/\.git$/, "");

    return { repository, group, branch };
  }

  async *repositories(pattern = "**/*") {
    for (const p of asArray(pattern)) {
      let m;
      if ((m = p.match(/^(\w+)\/(.*)/))) {
        const group = await this._loadGroupRepositories(m[1]);
        yield * group.repositories(m[2]);
      }
    }
  }

  /**
   * Supported name schemes are
   * - https://user:aSecret@bitbucket.org/owner/repo-name.git
   * - git+https://user:aSecret@bitbucket.org/owner/repo-name.git
   * - git@bitbucket.org:owner/repo-name.git
   * - owner/repo-name
   * @param {string} name
   * @return {Repository}
   */
  async repository(name) {
    const analysed = this.analyseURL(name, { part: "repository" });
    if (analysed === undefined) {
      return undefined;
    }

    let repository = this._repositories.get(analysed.repository);

    if (repository === undefined) {
      let group = await this.repositoryGroup(analysed.group);

      if (group === undefined) {
        group = await this._loadGroupRepositories(analysed.group);
      }

      console.log("GROUP", group);

      repository = await group.repository(analysed.repository);
      console.log("REPOSITORY", analysed.repository, repository);

      /*
      repository = new this.repositoryClass(
        group,
        analysed.repository,
        options
      );

      group._repositories.set(repository.name, repository);
      */
    }

    return repository;
  }

  async _loadGroupRepositories(group) {
    let url = `repositories/${group}`;

    do {
      const r = await this.fetch(url);
      const res = await r.json();

      url = res.next;
      await Promise.all(
        res.values.map(async b => {
          const groupName = b.owner.username;

          group = this._repositoryGroups.get(groupName);
          if (group === undefined) {
            group = new this.repositoryGroupClass(groupName, b.owner);
            this._repositoryGroups.set(group.name, group);
          }

          const repository = new this.repositoryClass(group, b.name, b);

          group._repositories.set(repository.name, repository);
          console.log("SET",repository.name);
          /*
          console.log("XX",
            b.name,
            repository.name,
            await group._repositories.get(b.name),
            "|",
            await group.repository(repository.name)
          );
*/
        })
      );
    } while (url);

    console.log("YY",[...group._repositories.keys()]);
    return group;
  }

  fetch(url, options) {
    return fetch(`${this.api}/${url}`, {
      headers: {
        authorization:
          "Basic " +
          Buffer(this.authentication.username + ":" + this.authentication.password).toString(
            "base64"
          )
      }
    });
  }
}

function asArray(o) {
  return Array.isArray(o) ? o : [o];
}
