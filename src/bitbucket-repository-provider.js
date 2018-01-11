import { Provider, Repository, Branch } from 'repository-provider';

const { Client } = require('bitbucket-server-nodejs');

const request = require('request-promise');

/**
 * Provider for bitbucket repositories
 * @param {Object} config
 * @param {string} config.url
 * @param {string} config.auth.type
 * @param {string} config.auth.username
 * @param {string} config.auth.password
 */
export class BitbucketProvider extends Provider {
  static get repositoryClass() {
    return BitbucketRepository;
  }

  static get branchClass() {
    return BitbucketBranch;
  }

  /**
   * Default configuration
   * @return {Object}
   */
  static get defaultOptions() {
    return {
      url: 'https://api.bitbucket.org/2.0'
    };
  }

  static options(config) {
    return Object.assign(this.defaultOptions, config);
  }

  constructor(config) {
    super(config);

    Object.defineProperty(this, 'client', {
      value: new Client(this.config.url, this.config.auth)
    });
  }

  put(path, data) {
    const boundary = '---------------------------735323031399963166993862150';
    const params = {
      uri: this.config.url + '/' + path,
      headers: { 'Content-Type': `multipart/form-data boundary=${boundary}` },
      auth: this.config.auth,
      body: [boundary, data, boundary].join('\n')
    };

    return request.post(params);
  }
}

/**
 * a repository hosted in bitbucket
 */
export class BitbucketRepository extends Repository {
  constructor(provider, name) {
    super(provider, name.replace(/#.*/, ''));
    Object.defineProperty(this, 'user', { value: name.split(/\//)[0] });
  }

  get client() {
    return this.provider.client;
  }

  get project() {
    return 'aProject';
  }

  async branches() {
    const res = await this.client.get(
      `repositories/${this.name}/refs/branches`
    );

    //console.log(res);

    res.values.forEach(b => {
      const branch = new this.provider.constructor.branchClass(this, b.name);
      this._branches.set(branch.name, branch);
    });

    return this._branches;
  }

  async createBranch(name, from) {
    const res = await this.provider.put(
      `repositories/${this.name}/src/`,
      `branch=${name}
message=hello
parents=cd85098`
    );
    console.log(res);

    const b = new this.provider.constructor.branchClass(this, name);
    this._branches.set(b.name, b);
    return b;
  }
}

export class BitbucketBranch extends Branch {
  get client() {
    return this.provider.client;
  }

  get project() {
    return this.provider.project;
  }

  async content(path, options = {}) {
    try {
      const res = await this.client.get(
        `repositories/${this.repository.name}/raw/${this.name}/${path}`
      );
      return res;
    } catch (e) {
      if (options.ignoreMissing) {
        return '';
      }
    }
  }

  async tree(path) {
    const res = await this.client.get(
      `repositories/${this.repository.name}/src/${this.name}/${path}`
    );

    return res.values.map(e => {
      return { path: e.path };
    });
  }

  async list() {
    return this.tree('/');
  }

  async createPullRequest(to, msg) {
    const res = await this.client.put(
      `repositories/${this.name}/pullrequests`,
      {
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
      }
    );

    console.log(res);

    return new PullRequest(this.repository, result.number);
  }
}
