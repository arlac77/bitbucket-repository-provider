import { matcher } from "matching-iterator";
import { Branch } from "repository-provider";
import { default_attribute } from "pacc";
import {
  ContentEntry,
  BufferContentEntry,
  CollectionEntry
} from "content-entry";

/**
 * Branch of a bitbucket repository.
 */
export class BitbucketBranch extends Branch {
  /**
   * options
   */
  static get attributes() {
    return {
      ...super.attributes,
      /**
       *
       * @return {string}
       */
      hash: default_attribute
    };
  }

  // TODO isInitialized ?

  async initialize() {
    if (this.hash === undefined) {
      const url = `repositories/${this.slug}/refs/branches?q=name="${this.name}"`;
      const { json } = await this.provider.fetchJSON(url);

      if (!Array.isArray(json.values) || json.values.length != 1) {
        console.log(json);
        throw new Error(`No such branch ${this.name}`);
      }

      this.hash = json.values[0].target.hash;

      //delete json.values[0].target.repository;
      //Object.assign(this,json.values[0].target);
    }
  }

  /**
   * {@link https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Busername%7D/%7Brepo_slug%7D/src/%7Bnode%7D/%7Bpath%7D}
   * @param {string} name
   * @return {Promise<ContentEntry>}
   */
  async entry(name) {
    await this.initialize();

    const res = await this.provider.fetch(
      `repositories/${this.slug}/src/${this.hash}/${name}`
    );
    if (res.ok) {
      return new BufferContentEntry(
        name,
        undefined,
        new Uint8Array(await res.arrayBuffer())
      );
    }
  }

  /**
   *
   * @param {string[]|string} patterns
   */
  async *entries(patterns) {
    await this.initialize();

    const { json } = await this.provider.fetchJSON(
      `repositories/${this.slug}/src/${this.hash}/?max_depth=99`
    );

    for (const entry of matcher(json.values, patterns, { name: "path" })) {
      yield entry.type === "commit_directory"
        ? new CollectionEntry(entry.path)
        : new BufferContentEntry(entry.path, undefined, async entry => {
            const res = await this.provider.fetch(
              `repositories/${this.slug}/src/${this.hash}/${entry.name}`
            );

            return new Uint8Array(await res.arrayBuffer());
          });
    }
  }

  /**
   * Commit entries
   * @param {string} message commit message
   * @param {ContentEntry[]} updates content to be commited
   * @param {Object} [options]
   * @return {Promise}
   */
  async commit(message, updates, options) {
    const searchParams = new URLSearchParams();
    searchParams.set("message", message);
    searchParams.set("branch", this.name);
    //searchParams.set("parents", XXX);

    for (const u of updates) {
      searchParams.set(u.name, await u.string);
    }

    return this.provider.fetch(`repositories/${this.slug}/src`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: searchParams
    });
  }
}
