import { Repository } from "repository-provider";

/**
 * a repository hosted in bitbucket
 * @param {Owner} owner
 * @param {string} name
 * @param {Object} options
 * @param {string} [options.api]
 * @param {string} [options.group]
 *
 * @property {string} api
 * @property {string} group
 * @property {string} user
 */
export class BitbucketRepository extends Repository {
  static get defaultOptions() {
    return {
      size: undefined,
      language: undefined,
      ...super.defaultOptions
    };
  }

  constructor(owner, name, options) {
    super(owner, name, options);

    Object.defineProperties(this, {
      user: { value: name.split(/\//)[0] }
    });
  }

  get slug() {
    return `${this.owner.name}/${this.name}`;
  }

  /**
   * @return {string[]} url
   */
  get urls() {
    return [`${this.provider.url}/${this.slug}.git`];
  }

  /**
   * Deliver the url of home page.
   * @return {string} '.../overwiew'
   */
  get homePageURL() {
    return `${this.provider.url}/${this.slug}/overview`;
  }

  /**
   * Deliver the url of issue tracking system.
   * @return {string} '.../issues'
   */
  get issuesURL() {
    return `${this.provider.url}/${this.slug}/issues`;
  }

  fetch(...args) {
    return this.provider.fetch(...args);
  }

  async _fetchHooks() {
    let url = `repositories/${this.slug}/hooks`;

    do {
      const r = await this.fetch(url);
      const res = await r.json();
      url = res.next;
      res.values.forEach(h => {
        this._hooks.push(
          new this.hookClass(this, h.name, new Set(h.events), {
            id: h.uuid,
            active: h.active,
            url: h.url,
            description: h.description
          })
        );
      });
    } while (url);
  }

  async _fetchBranches() {
    let url = `repositories/${this.slug}/refs/branches`;

    do {
      const r = await this.fetch(url);
      const res = await r.json();
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
  async _createBranch(name, from = this.defaultBranch, options) {
    const res = await this.fetch(`repositories/${this.slug}/refs/branches`, {
      method: "POST",
      data: {
        name,
        target: {
          hash: from.hash
        }
      }
    });
    //console.log(res.ok, res.status, res.statusText);

    const json = await res.json();
    //console.log(json);

    return super._createBranch(name, from, { hash: json.hash });
  }

  /**
   * https://docs.atlassian.com/bitbucket-server/rest/5.8.0/bitbucket-branch-rest.html#idm45555984542992
   * https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Busername%7D/%7Brepo_slug%7D/refs/branches/%7Bname%7D#delete
   */
  async deleteBranch(name) {
    const url = `repositories/${this.slug}/refs/branches/${name}`;
    // console.log(url);

    const res = await this.fetch(url, { method: "DELETE" });

    //console.log(res.ok, res.status, res.statusText);
    //const p = await res.json();
    //console.log(p);
    return super.deleteBranch(name);
  }
}
