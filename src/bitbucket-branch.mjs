import micromatch from "micromatch";
import { Branch } from "repository-provider";
import { BufferContentEntry } from "content-entry";

/**
 * Branch of a bitbucket repository
 */
export class BitbucketBranch extends Branch {
  /**
   * options
   */
  static get defaultOptions() {
    return {
      /**
       * api url.
       * @return {string}
       */
      hash: undefined,
      ...super.defaultOptions
    };
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

    return new this.entryClass(name, await res.text());
  }

  async *tree(name, patterns) {
    const r = await this.fetch(
      `repositories/${this.slug}/src/${this.hash}${name}`
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
   * Commit entries
   * @param {string} message commit message
   * @param {Entry[]} updates file content to be commited
   * @param {Object} options
   * @return {Promise}
   */
  async commit(message, updates, options) {
    const searchParams = new URLSearchParams();
    searchParams.set("message", message);
    searchParams.set("branch", this.name);
    //searchParams.set("parents", XXX);

    for (const u of updates) {
      searchParams.set(u.name, await u.getString());
    }

    const res = await this.fetch(`repositories/${this.slug}/src`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: searchParams
    });

    //console.log(res.ok, res.status, res.statusText);

    //const text = await res.text();
    //console.log(text);
  }

  get entryClass() {
    return BufferContentEntry;
  }
}
