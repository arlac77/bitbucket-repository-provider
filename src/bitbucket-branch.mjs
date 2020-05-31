import { matcher } from "matching-iterator";
import { Branch } from "repository-provider";
import {
  ContentEntry,
  BufferContentEntry,
  BufferContentEntryMixin,
  BaseCollectionEntry
} from "content-entry";

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
   * https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Busername%7D/%7Brepo_slug%7D/src/%7Bnode%7D/%7Bpath%7D
   * @param {string} name
   * @return {Promise<Entry>}
   */
  async entry(name) {
    const res = await this.fetch(
      `repositories/${this.slug}/src/${this.hash}/${name}`
    );

    return new this.entryClass(name, Buffer.from(await res.arrayBuffer()));
  }

  /**
   *
   * @param patterns
   */
  async *entries(patterns) {
    const r = await this.fetch(
      `repositories/${this.slug}/src/${this.hash}/?max_depth=99`
    );

    const res = await r.json();

    for (const entry of matcher(res.values, patterns, { name: "path" })) {
      yield entry.type === "commit_directory"
          ? new BaseCollectionEntry(entry.path)
          : new LazyBufferContentEntry(entry.path, this);
    }
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

class LazyBufferContentEntry extends BufferContentEntryMixin(ContentEntry) {
  constructor(name, branch) {
    super(name);
    Object.defineProperties(this, {
      branch: { value: branch }
    });
  }

  async getBuffer() {
    const branch = this.branch;

    const res = await branch.fetch(
      `repositories/${branch.slug}/src/${branch.hash}/${this.name}`
    );

    return Buffer.from(await res.arrayBuffer());
  }
}
