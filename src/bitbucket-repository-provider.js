import { Provider, Repository, Branch } from 'repository-provider';

const request = require('request-promise');
const { URL } = require('url');

/**
 * Provider for bitbucket repositories
 * @param {Object} config
 * @param {string} config.url provider scm base
 * @param {string} config.api provider api base
 * @param {string} config.apiVersion provider api version
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
    return {
      url: 'https://bitbucket.org',
      api: 'https://api.bitbucket.org',
      apiVersion: '2.0'
    };
  }

  ananlyseRepoURL(name) {
    const m = name.match(/^scm\/([^\/]+)\/(.*)/);
    if (m) {
      const project = m[1];
      const repoName = m[2];
      return {
        project,
        repoName,
        api: `${this.apiVersion}/projects/${project}/repos/${repoName}`
      };
    }

    return {
      repoName: name,
      api: `${this.apiVersion}/repositories/${name}`
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
   * API version to use
   * @return {string} 1.0 or 2.0
   */
  get apiVersion() {
    return this.config.apiVersion;
  }

  /**
   * GIT base url
   * @return {string} repo base utl
   */
  get url() {
    return this.config.url;
  }

  get repositoryClass() {
    return BitbucketRepository;
  }

  get branchClass() {
    return BitbucketBranch;
  }

  /**
   * @param {string} name
   * @return {Repository}
   */
  async repository(name) {
    name = name.replace(/#.*$/, '');

    if (name.startsWith('http')) {
      const url = new URL(name);
      name = url.pathname;
      name = name.replace(/\.git$/, '');
      name = name.replace(/^\//, '');
    }

    let r = this.repositories.get(name);
    if (r === undefined) {
      try {
        const { repoName, project, api } = this.ananlyseRepoURL(name);

        const res = await this.get(api);
        r = new this.repositoryClass(this, repoName, {
          project,
          api
        });

        await r.initialize();
        this.repositories.set(repoName, r);
      } catch (e) {
        if (e.statusCode !== 404) {
          throw e;
        }
      }
    }

    return r;
  }

  get(path) {
    const params = {
      uri: this.api + '/' + path,
      auth: this.config.auth,
      json: true
    };

    //console.log(`GET ${params.uri}`);
    return request.get(params);
  }

  put(path) {
    const params = {
      uri: this.api + '/' + path,
      auth: this.config.auth
    };

    return request.put(params);
  }

  delete(path, data) {
    const params = {
      uri: this.api + '/' + path,
      auth: this.config.auth,
      form: data
    };

    return request.delete(params);
  }

  post(path, data) {
    const params = {
      uri: this.api + '/' + path,
      auth: this.config.auth,
      form: data
    };

    return request.post(params);
  }
}

/**
 * a repository hosted in bitbucket
 */
export class BitbucketRepository extends Repository {
  constructor(provider, name, options = {}) {
    super(provider, name);
    Object.defineProperty(this, 'user', { value: name.split(/\//)[0] });
    Object.defineProperty(this, 'api', {
      value: options.api || `${provider.apiVersion}/repositories/${name}`
    });

    Object.defineProperty(this, 'project', {
      value: options.project
    });
  }

  /**
   * @return {string[]} url
   */
  get urls() {
    return [`${this.provider.url}/${this.name}.git`];
  }

  get(...args) {
    return this.provider.get(...args);
  }

  put(...args) {
    return this.provider.put(...args);
  }

  post(...args) {
    return this.provider.post(...args);
  }

  delete(...args) {
    return this.provider.delete(...args);
  }

  async initialize() {
    await super.initialize();

    const res = await this.get(`${this.api}/refs/branches`);

    res.values.forEach(b => {
      const branch = new this.provider.branchClass(this, b.name);

      branch.hash = b.target.hash;

      this._branches.set(branch.name, branch);
    });
  }

  async createBranch(name, from, options = {}) {
    const parents = [
      from === undefined ? this._branches.get('master').hash : from.hash
    ];
    const res = await this.post(`${this.api}/src/`, {
      branch: name,
      message: options.message,
      parents: parents.join(',')
    });
    const b = super.createBranch(name, from, options);
    return b;
  }

  async deleteBranch(name) {
    const res = await this.delete(
      `${this.api.replace(/2\.0/, '1.0')}/branches`,
      {
        name: `refs/heads/${name}`
      }
    );
    console.log(res);
    return super.deleteBranch(name);
  }
}

export class BitbucketBranch extends Branch {
  get(...args) {
    return this.provider.get(...args);
  }

  put(...args) {
    return this.provider.put(...args);
  }

  post(...args) {
    return this.provider.post(...args);
  }

  get project() {
    return this.provider.project;
  }

  async content(path, options = {}) {
    try {
      const res = await this.get(
        `${this.repository.api}/raw/${this.name}/${path}`
      );
      return res;
    } catch (e) {
      if (options.ignoreMissing) {
        return '';
      }
    }
  }

  async tree(path) {
    const res = await this.get(
      `${this.repository.api}/src/${this.name}/${path}`
    );

    return res.values.map(e => {
      return { path: e.path };
    });
  }

  async list() {
    return this.tree('/');
  }

  async createPullRequest(to, msg) {
    const res = await this.put(`${this.repository.api}/pullrequests`, {
      title: msg,
      description: msg,
      state: 'OPEN',
      open: true,
      closed: false,
      fromRef: {
        id: `refs/heads/${this.name}`,
        repository: {
          slug: this.name,
          name: null,
          project: {
            key: this.project
          }
        }
      },
      toRef: {
        id: `refs/heads/${to}`,
        repository: {
          slug: to,
          name: null,
          project: {
            key: this.project
          }
        }
      },
      locked: false,
      reviewers: [
        {
          user: {
            name: 'REVIEWER'
          }
        }
      ]
    });

    console.log(res);

    return new PullRequest(this.repository, result.number);
  }
}
