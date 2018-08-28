import {
  Provider,
  Repository,
  Branch,
  Project,
  Content
} from "repository-provider";
import { BitbucketBranch } from "./bitbucket-branch";
import { BitbucketRepository } from "./bitbucket-repository";
import { BitbucketProject } from "./bitbucket-project";

const request = require("request-promise");

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
      }
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
      const token = env.BB_TOKEN || env.BITBUCKET_TOKEN;
      if (token !== undefined) {
        return {
          auth: {
            type: "token",
            token
          }
        };
      }

      if (env.BITBUCKET_USERNAME && env.BITBUCKET_PASSWORD) {
        return {
          auth: {
            type: "basic",
            username: env.BITBUCKET_USERNAME,
            password: env.BITBUCKET_PASSWORD
          }
        };
      }
    }

    return undefined;
  }

  /**
   * API base url
   * @return {string} api base url
   */
  get api() {
    return this.config.api;
  }

  /**
   * GIT base url
   * @return {string} repo base utl
   */
  get url() {
    return this.config.url;
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

    let repository = this.repositories.get(analysed.repository);

    if (repository === undefined) {
      const project = await this.project(analysed.project, {
        api: analysed.api
      });

      try {
        repository = new this.repositoryClass(
          project,
          analysed.repository,
          options
        );

        project.repositories.set(repository.name, repository);
      } catch (e) {
        if (e.statusCode !== 404) {
          throw e;
        }
      }
    }

    return repository;
  }

  /**
   * @param {string} name
   * @param {Object} options
   */
  async project(name, options) {
    const analysed = this.analyseURL(name, { part: "project" });
    if (analysed === undefined) {
      return undefined;
    }

    let project = this.repositoryGroups.get(analysed.project);
    if (project !== undefined) {
      return project;
    }
    project = new this.repositoryGroupClass(this, analysed.project, options);
    this.repositoryGroups.set(project.name, project);

    return project;
  }

  get(path) {
    const params = {
      uri: path.match(/^https?:/) ? path : this.api["2.0"] + "/" + path,
      auth: this.config.auth,
      json: true
    };

    console.log(`GET ${params.uri}`);
    return request.get(params);
  }

  put(path) {
    const params = {
      uri: this.api["2.0"] + "/" + path,
      auth: this.config.auth
    };

    return request.put(params);
  }

  delete(path, data) {
    const params = {
      uri: path.match(/^https?:/) ? path : this.api["2.0"] + "/" + path,
      auth: this.config.auth,
      form: data
    };
    console.log(`DELETE ${params.uri}`);

    return request.delete(params);
  }

  post(path, data) {
    const params = {
      uri: path.match(/^https?:/) ? path : this.api["2.0"] + "/" + path,
      auth: this.config.auth,
      form: data
    };

    return request.post(params);
  }
}
