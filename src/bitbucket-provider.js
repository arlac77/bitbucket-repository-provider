import {
  Provider,
  Repository,
  Branch,
  Project,
  Content
} from 'repository-provider';
import { BitbucketBranch } from './bitbucket-branch';
import { BitbucketRepository } from './bitbucket-repository';
import { BitbucketProject } from './bitbucket-project';
import { URL } from 'url';

const request = require('request-promise');

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
   * Default configuration
   * @return {Object}
   */
  static get defaultOptions() {
    const url = 'https://bitbucket.org';
    return {
      url,
      api: BitbucketProvider.apiURLs(url)
    };
  }

  /**
   * api url for a given repo url
   * provide version 1.0 for stash hosts names and 2.0 for all other
   * @param {string} url bitbucket (repo)
   * @param {string} version api version
   * @return {Object} bitbucket api urls by version
   */
  static apiURLs(url, version) {
    const u = new URL(url);
    if (version === undefined) {
      if (u.host.match(/stash/)) {
        version = '1.0';
      } else {
        version = '2.0';
      }
    }
    u.host = 'api.' + u.host;
    return { [version]: `${u.href}${version}` };
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
            type: 'token',
            token
          }
        };
      }

      if (env.BITBUCKET_USERNAME && env.BITBUCKET_PASSWORD) {
        return {
          auth: {
            type: 'basic',
            username: env.BITBUCKET_USERNAME,
            password: env.BITBUCKET_PASSWORD
          }
        };
      }
    }

    return undefined;
  }

  analyseRepoURL(name) {
    const m = name.match(/^scm\/([^\/]+)\/(.*)/);
    if (m) {
      const projectName = m[1];
      const repositoryName = m[2];
      return {
        projectName,
        repositoryName,
        api: `projects/${project}/repos/${repoName}`
      };
    }

    return {
      repositoryName: name,
      api: `repositories/${name}`
    };
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
   * Supported name schemes are
   * - https://user:aSecret@bitbucket.org/owner/repo-name.git
   * - git+https://user:aSecret@bitbucket.org/owner/repo-name.git
   * - git@bitbucket.org:owner/repo-name.git
   * - owner/repo-name
   * @param {string} name
   * @return {Repository}
   */
  async repository(name) {
    if (name === undefined) {
      return undefined;
    }

    name = name.replace(/#.*$/, '');

    if (name.startsWith('git@') || name.startsWith('git+ssh@')) {
      const [host, pathname] = name.split(/:/);
      if (pathname !== undefined) {
        name = pathname;
        name = name.replace(/\.git$/, '');
        name = name.replace(/^\//, '');
      }
    } else if (
      name.startsWith('https') ||
      name.startsWith('git+https') ||
      name.startsWith('ssh:')
    ) {
      const url = new URL(name);
      name = url.pathname;
      name = name.replace(/\.git$/, '');
      name = name.replace(/^\//, '');
    }

    let r = this.repositories.get(name);
    if (r === undefined) {
      try {
        const { repositoryName, projectName, api } = this.analyseRepoURL(name);

        const res = await this.get(api);
        r = new this.repositoryClass(this, repositoryName, {
          project: projectName,
          api
        });

        await r.initialize();
        this.repositories.set(repositoryName, r);
      } catch (e) {
        if (e.statusCode !== 404) {
          throw e;
        }
      }
    }

    return r;
  }

  async project(name) {
    const username = 'xxxx';
    const response = await this.get(`teams/${username}/projects/`); // 2.0

    console.log(response);
  }

  get(path) {
    const params = {
      uri: this.api['2.0'] + '/' + path,
      auth: this.config.auth,
      json: true
    };

    //console.log(`GET ${params.uri}`);
    return request.get(params);
  }

  put(path) {
    const params = {
      uri: this.api['2.0'] + '/' + path,
      auth: this.config.auth
    };

    return request.put(params);
  }

  delete(path, data) {
    const params = {
      uri: 'https://api.bitbucket.org/' + path,
      auth: this.config.auth,
      form: data
    };

    return request.delete(params);
  }

  post(path, data) {
    const params = {
      uri: this.api['2.0'] + '/' + path,
      auth: this.config.auth,
      form: data
    };

    return request.post(params);
  }
}
