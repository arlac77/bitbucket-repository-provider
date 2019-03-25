import { Branch, PullRequest } from "repository-provider";
import { BufferContentEntry } from "content-entry";
import micromatch from "micromatch";

/**
 * Branch of a bitbucket repository
 */
export class BitbucketBranch extends Branch {
  /**
   * options
   */
  static get defaultOptions() {
    return Object.assign(
      {
        /**
         * api url.
         * @return {string}
         */
        hash: undefined
      },
      super.defaultOptions
    );
  }

  fetch(...args) {
    return this.provider.fetch(...args);
  }

  get slug() {
    return this.repository.slug;
  }

  /**
   * https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories
   * @param {string} name
   * @return {Promise<Entry>}
   */
  async entry(name) {
    const res = await this.fetch(
      `repositories/${this.slug}/src/${this.hash}/${name}`
    );

    return new this.entryClass(name, await res.json());
  }

  async *tree(name, patterns) {
    const r = await this.fetch(
      `repositories/${this.repository.fullName}/src/${this.hash}${name}`
    );

    const res = await r.json();

    for (const entry of res.values) {
      if (patterns === undefined) {
        yield new this.entryClass(entry.path);
      } else {
        if (micromatch([entry.path], patterns).length === 1) {
          yield new this.entryClass(entry.path);
        }
      }
    }
  }

  async *entries(patterns) {
    return yield* this.tree("/", patterns);
  }

  /**
   * @see{https://stackoverflow.com/questions/46310751/how-to-create-a-pull-request-in-a-bitbucket-using-api-1-0/46311951#46311951}
   */
  async createPullRequest(to, msg) {
    const res = await this.fetch(`pullrequests`, {
      method: "put",
      data: {
        title: msg,
        description: msg,
        state: "OPEN",
        open: true,
        closed: false,
        fromRef: {
          id: this.ref,
          repository: {
            slug: this.name,
            name: null,
            project: {
              key: this.project
            }
          }
        },
        toRef: {
          id: to.ref,
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
              name: "REVIEWER"
            }
          }
        ]
      }
    });

    console.log(res);

    return new PullRequest(this.repository, result.number);
  }

  get entryClass() {
    return BufferContentEntry;
  }
}
