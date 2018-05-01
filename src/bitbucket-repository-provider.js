import { Provider, Repository, Branch, Content } from 'repository-provider';
import { URL } from 'url';

const request = require('request-promise');
//const { URL } = require('url');

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
    return {
      url: 'https://bitbucket.org',
      api: 'https://api.bitbucket.org/2.0'
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
      const project = m[1];
      const repoName = m[2];
      return {
        project,
        repoName,
        api: `projects/${project}/repos/${repoName}`
      };
    }

    return {
      repoName: name,
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
        const { repoName, project, api } = this.analyseRepoURL(name);

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
 * @param {Object} options
 * @param {string} [options.api]
 * @param {string} [options.project]
 *
 * @property {string} api
 * @property {string} project
 * @property {string} user
 */
export class BitbucketRepository extends Repository {
  constructor(provider, name, options = {}) {
    super(provider, name);
    Object.defineProperties(this, {
      user: { value: name.split(/\//)[0] },
      api: {
        value: options.api || `2.0/repositories/${name}`
      }
    });

    if (options.project !== undefined) {
      Object.defineProperty(this, 'project', {
        value: options.project
      });
    }
  }

  /**
   * @return {string[]} url
   */
  get urls() {
    return [`${this.provider.url}/${this.name}.git`];
  }

  /**
   * Deliver the url of home page.
   * @return {string} '.../overwiew'
   */
  get homePageURL() {
    return `${this.provider.url}/${this.name}/overview`;
  }

  /**
   * Deliver the url of issue tracking system.
   * @return {string} '.../issues'
   */
  get issuesURL() {
    return `${this.provider.url}/${this.name}/issues`;
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

    let url = `${this.api}/refs/branches`;
    do {
      const res = await this.get(url);
      url = res.next;
      res.values.forEach(b => {
        const branch = new this.provider.branchClass(this, b.name);

        branch.hash = b.target.hash;

        this._branches.set(branch.name, branch);
      });
    } while (url);
  }

  /**
   * @param {string} name
   * @param {BitbucketBranch} from
   * @param {Object} options
   * @param {string} options.message
   */
  async createBranch(name, from, options = {}) {
    const parents = [
      from === undefined ? this._branches.get('master').hash : from.hash
    ];
    const res = await this.post(`${this.api}/src/`, {
      branch: name,
      message: options.message,
      parents: parents.join(',')
    });
    return super.createBranch(name, from, options);
  }

  async deleteBranch(name) {
    //console.log(${});
    const p = 'arlac77';
    const r = 'sync-test-repository';
    const u = `rest/branch-utils/1.0/projects/${p}/repos/${r}/branches`;
    console.log(u);

    //content = '''{"name": "refs/heads/%s"}''' % (variables['branch'])

    const res = await this.delete(u /*`${this.api}/branches`*/, {
      name: `refs/heads/${name}`
    });
    console.log(res);
    return super.deleteBranch(name);
  }
}

/**
 *
 */
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

  /**
   * @param {string} path
   * @return {Promise<Content>}
   */
  async content(path) {
    const res = await this.get(
      `${this.repository.api}/src/${this.name}/${path}`
    );
    return new Content(path, res);
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

  /**
   * @see{https://stackoverflow.com/questions/46310751/how-to-create-a-pull-request-in-a-bitbucket-using-api-1-0/46311951#46311951}
   */
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
