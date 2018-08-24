import {
  Provider,
  Repository,
  Branch,
  Content,
  PullRequest
} from "repository-provider";

/**
 * a repository hosted in bitbucket
 * @param {Owner} owner
 * @param {string} name
 * @param {Object} options
 * @param {string} [options.api]
 * @param {string} [options.project]
 *
 * @property {string} api
 * @property {string} project
 * @property {string} user
 */
export class BitbucketRepository extends Repository {
  /*
  static get defaultOptions() {
    return Object.assign({ project: undefined }, super.defaultOptions);
  }
*/

  constructor(owner, name, options = {}) {
    super(owner, name, options);
    Object.defineProperties(this, {
      user: { value: name.split(/\//)[0] },
      api: {
        value: options.api
      }
    });
  }

  get provider() {
    return this.owner.provider;
  }

  get fullName() {
    return `${this.owner.name}/${this.name}`;
  }

  /**
   * @return {string[]} url
   */
  get urls() {
    return [`${this.provider.url}/${this.fullName}.git`];
  }

  /**
   * Deliver the url of home page.
   * @return {string} '.../overwiew'
   */
  get homePageURL() {
    return `${this.provider.url}/${this.fullName}/overview`;
  }

  /**
   * Deliver the url of issue tracking system.
   * @return {string} '.../issues'
   */
  get issuesURL() {
    return `${this.provider.url}/${this.fullName}/issues`;
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

  async _initialize() {
    await super._initialize();

    let url = `repositories/${this.fullName}/refs/branches`;

    do {
      const res = await this.get(url);

      url = res.next;
      res.values.forEach(b => {
        const branch = new this.provider.branchClass(this, b.name, {
          hash: b.target.hash
        });

        this._branches.set(branch.name, branch);
      });
    } while (url);
  }

  /**
   * Create a new branch
   * @param {string} name of the new branch to create
   * @param {BitbucketBranch} from
   * @param {Object} options
   * @param {string} options.message
   */
  async createBranch(name, from = this.defaultBranch, options = {}) {
    const res = await this.post(`${this.api}/src/`, {
      branch: name,
      message: options.message,
      parents: [from.hash].join(",")
    });
    return super.createBranch(name, from, options);
  }

  async deleteBranch(name) {
    //console.log(${});
    const p = "arlac77";
    const r = "sync-test-repository";

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
