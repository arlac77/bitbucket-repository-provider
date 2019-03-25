import { Provider } from "repository-provider";
import { BitbucketBranch } from "./bitbucket-branch";
import { BitbucketRepository } from "./bitbucket-repository";
import { BitbucketProject } from "./bitbucket-project";
import request from "request-promise";
import fetch from "node-fetch";

export { BitbucketBranch, BitbucketRepository, BitbucketProject };

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
   * provide auth info from environment variables
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
   * @return {Class} BitbucketProject
   */
  get repositoryGroupClass() {
    return BitbucketProject;
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
        case "project":
          return { project: url };
          break;
        case "repository":
          return { repository: url };
          break;
      }

      return { project: url };
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
    const project = parts[parts.length - 2];
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

    return { api: { [version]: apiURL.href }, repository, project, branch };
  }

  async *repositories(pattern = "**/*") {
    for (const p of asArray(pattern)) {
      let m;
      if ((m = p.match(/^(\w+)\/(.*)/))) {
        const pn = m[1];
        const r = await this.fetch(`${this.api["2.0"]}/projects/${pn}`);
        console.log(r);
      } else {
        const r = await this.fetch(`${this.api["2.0"]}/repositories`);
        console.log(r);
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

    let repository = this._repositories.get(analysed.repository);

    if (repository === undefined) {
      let project = await this.project(analysed.project, {
        api: analysed.api
      });

      if (project === undefined) {
        project = await this._loadProjectRepositories(analysed.project);
      }

      //console.log("PROJECT", project);

      repository = await project.repository(analysed.repository);
      console.log("REPOSITORY", analysed.repository, repository);

      /*
      repository = new this.repositoryClass(
        project,
        analysed.repository,
        options
      );

      project._repositories.set(repository.name, repository);
      */
    }

    return repository;
  }

  async _loadProjectRepositories(project) {
    let url = `repositories/${project}`;

    let group;

    do {
      const res = await this.get(url);

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
          //const repository = await group._createRepository(b.name, b);
          group._repositories.set(repository.name, repository);

          console.log(
            b.name,
            repository.name,
            await group._repositories.get(b.name)
          );
        })
      );
    } while (url);

    return group;
  }

  /**
   * alias for repositoryGroup()
   * @param {string} name
   * @param {Object} options
   */
  async project(name, options) {
    return this.repositoryGroup(name, options);
  }

  fetch(url, options) {
    return fetch(url, {
      headers: {
        authorization:
          "Basic " +
          Buffer(this.auth.username + ":" + this.auth.password).toString(
            "base64"
          )
      }
    });
  }

  get(path) {
    const params = {
      uri: path.match(/^https?:/) ? path : this.api["2.0"] + "/" + path,
      auth: this.auth,
      json: true
    };

    console.log(`GET ${params.uri}`);
    return request.get(params);
  }

  put(path) {
    const params = {
      uri: this.api["2.0"] + "/" + path,
      auth: this.auth
    };

    return request.put(params);
  }

  delete(path, data) {
    const params = {
      uri: path.match(/^https?:/) ? path : this.api["2.0"] + "/" + path,
      auth: this.auth,
      form: data
    };
    console.log(`DELETE ${params.uri}`);

    return request.delete(params);
  }

  post(path, data) {
    const params = {
      uri: path.match(/^https?:/) ? path : this.api["2.0"] + "/" + path,
      auth: this.auth,
      form: data
    };

    return request.post(params);
  }
}

function asArray(o) {
  return Array.isArray(o) ? o : [o];
}
