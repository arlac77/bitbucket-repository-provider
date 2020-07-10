import { replaceWithOneTimeExecutionMethod } from "one-time-execution-method";
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
  static get attributMapping() {
    return {
      ...super.attributeMappin,
      is_private: "isPrivate",
      website: "homePageURL"
    };
  }

  constructor(owner, name, options) {
    super(owner, name, options);

    Object.defineProperties(this, {
      user: { value: name.split(/\//)[0] }
    });
  }

  /**
   * @return {string[]} url
   */
  get urls() {
    return [`${this.provider.url}${this.slug}.git`];
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

  async initializeHooks() {
    let url = `repositories/${this.slug}/hooks`;

    do {
      const r = await this.fetch(url);
      const res = await r.json();
      res.values.forEach(h => {
        this.addHook(
          new this.hookClass(this, h.id, new Set(h.events), h)
        );
      });
      url = res.next;
    } while (url);
  }

  async initializeBranches() {
    let url = `repositories/${this.slug}/refs/branches`;

    do {
      const r = await this.fetch(url);
      const res = await r.json();

      if (res.type === "error") {
        break;
      }

      res.values.forEach(b => this.addBranch(b.name, b.target));

      url = res.next;
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
  async createBranch(name, from = this.defaultBranch, options) {
    from = await from;
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

    return super.addBranch(name, json);
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

replaceWithOneTimeExecutionMethod(
  BitbucketRepository.prototype,
  "initializeBranches"
);
replaceWithOneTimeExecutionMethod(
  BitbucketRepository.prototype,
  "initializeHooks"
);
replaceWithOneTimeExecutionMethod(
  BitbucketRepository.prototype,
  "initializePullRequests"
);
