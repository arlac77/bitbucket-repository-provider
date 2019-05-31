import fetch from "node-fetch";

import { Provider } from "repository-provider";
import { BitbucketBranch } from "./bitbucket-branch.mjs";
import { BitbucketRepository } from "./bitbucket-repository.mjs";
import { BitbucketGroup } from "./bitbucket-group.mjs";

export { BitbucketBranch, BitbucketRepository, BitbucketGroup };

/**
 * Provider for bitbucket repositories
 * @param {Object} config
 * @param {string} config.url provider scm base
 * @param {string} config.api provider api base
 * @param {Object} config.auth authentication
 * @param {string} config.auth.type
 * @param {string} config.auth.username
 * @param {string} config.auth.password
 */
export class BitbucketProvider extends Provider {
  /**
   * Default configuration as given for the cloud privider
   * @return {Object}
   */
  static get defaultOptions() {
    return {
      url: "https://bitbucket.org",
      api: {
        "2.0": "https://api.bitbucket.org/2.0"
      },
      auth: {}
    };
  }

  /**
   * provide config from environment variables
   * either from
   * __BITBUCKET_USERNAME__ and
   * __BITBUCKET_PASSWORD__
   * or
   * __BITBUCKET_TOKEN__ or __BB_TOKEN__
   * @param {Object} env as provided by process.env
   * @return {Object} undefined if no bitbucket related entries where found
   */
  static optionsFromEnvironment(env) {
    if (env !== undefined) {
      const config = {};

      const token = env.BB_TOKEN || env.BITBUCKET_TOKEN;
      if (token !== undefined) {
        config.auth = {
          type: "token",
          token
        };
      }

      if (env.BITBUCKET_USERNAME && env.BITBUCKET_PASSWORD) {
        config.auth = {
          type: "basic",
          username: env.BITBUCKET_USERNAME,
          password: env.BITBUCKET_PASSWORD
        };
      }

      if (env.BITBUCKET_API) {
        config.api = {
          "2.0": env.BITBUCKET_API
        };
      }

      return config;
    }

    return undefined;
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
   * @return {Class} BitbucketGroup
   */
  get repositoryGroupClass() {
    return BitbucketGroup;
  }

  /**
   * decode URL for a given repo url
   * provide version 1.0 for stash hosts names and 2.0 for all other
   * @param {string} url bitbucket (repo)
   * @param {Object} options api version
   * @return {Object} bitbucket api urls by version
   */
  analyseURL(url, options = { version: "2.0" }) {
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

    let version = options.version;

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

    apiURL.hash = "";

    const parts = apiURL.pathname.split(/\//);
    const group = parts[parts.length - 2];
    let repository = parts[parts.length - 1];

    repository = repository.replace(/\.git$/, "");

    if (apiURL.host.match(/stash\./)) {
      version = "1.0";
      apiURL.pathname = `rest/api/${version}`;
    } else {
      apiURL.host = "api." + apiURL.host;
      apiURL.pathname = `${version}`;
    }

    apiURL.username = "";
    apiURL.password = "";

    return { api: { [version]: apiURL.href }, repository, group, branch };
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
  async repository(name, options) {
    const analysed = this.analyseURL(name, { part: "repository" });
    if (analysed === undefined) {
      return undefined;
    }

    console.log(analysed);

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
      //console.log("_loadGroupRepositories",url);

      const r = await this.fetch(url);
      const res = await r.json();

      //console.log(res);

      url = res.next;
      await Promise.all(
        res.values.map(async b => {
          const groupName = b.owner.username;

          //console.log(groupName);

          group = this._repositoryGroups.get(groupName);
          if (group === undefined) {
            group = new this.repositoryGroupClass(groupName, b.owner);
            this._repositoryGroups.set(group.name, group);
          }

          console.log("CREATE", group, b.name);

          const repository = new this.repositoryClass(group, b.name, b);

          console.log("REPOSITORY", repository.prototype);

          //const repository = await group._createRepository(b.name, b);
          group._repositories.set(repository.name, repository);


          console.log("XX",
            b.name,
            repository.name,
            await group._repositories.get(b.name),
            await group.repository(repository.name)
          );

        })
      );
    } while (url);

    return group;
  }

  fetch(url, options) {
    return fetch(`${this.api["2.0"]}/${url}`, {
      headers: {
        authorization:
          "Basic " +
          Buffer(this.auth.username + ":" + this.auth.password).toString(
            "base64"
          )
      }
    });
  }
}

function asArray(o) {
  return Array.isArray(o) ? o : [o];
}
