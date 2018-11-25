import { Provider, Repository, Branch, PullRequest } from "repository-provider";

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
    await this._loadAllBranches();
  }

  async _loadAllBranches() {
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
   * @see https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Busername%7D/%7Brepo_slug%7D/refs/branches?_ga=2.65542446.1034690805.1541022941-164225451.1541022941#post
   * @param {string} name of the new branch to create
   * @param {BitbucketBranch} from
   * @param {Object} options
   * @param {string} options.message
   */
  async createBranch(name, from = this.defaultBranch, options = {}) {
    const res = await this.post(`repositories/${this.fullName}/refs/branches`, {
      name: name,
      target: {
        hash: "4d2dc9b5fb194eeaf1dee933e3e0140d98856be3"
      }
    });
    return super.createBranch(name, from, options);
  }

  /**
   * https://docs.atlassian.com/bitbucket-server/rest/5.8.0/bitbucket-branch-rest.html#idm45555984542992
   * https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Busername%7D/%7Brepo_slug%7D/refs/branches/%7Bname%7D#delete
   */
  async deleteBranch(name) {
    /*
    const p = "arlac77";
    const r = "sync-test-repository";
    const u = `rest/branch-utils/1.0/projects/${p}/repos/${r}/branches`;

    /rest/branch-utils/1.0/projects/{projectKey}/repos/{repositorySlug}/branches
    {
    name: `refs/heads/${name}`,
    dryRun: false
    }
    url = `https://api.bitbucket.org/rest/branch-utils/1.0/projects/arlac77/repos/${
      this.fullName
    }/branches`;
*/

    const res = await this.delete(
      `repositories/${this.fullName}/refs/branches/${name}`
    );

    return super.deleteBranch(name);
  }
}
