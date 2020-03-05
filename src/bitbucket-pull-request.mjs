import { PullRequest } from "repository-provider";

/**
 *
 */
export class BitbucketPullRequest extends PullRequest {
  static get validStates() {
    return new Set(["OPEN", "MERGED", "SUPERSEDED", "DECLINED"]);
  }

  /**
   * List all pull request for a given repo
   * result will be filtered by source branch, destination branch and states
   * @param {Repository} repository
   * @param {Object} filter
   * @param {Branch?} filter.source
   * @param {Branch?} filter.destination
   * @param {Set<string>?} filter.states
   * @return {Iterator<PullRequest>}
   */
  static async *list(repository, filter = {}) {
    const getBranch = async u =>
      repository.provider.branch(
        [u.repository.full_name, u.branch.name].join("#")
      );

    const query =
      filter.states && filter.states.size
        ? "?" + [...filter.states].map(state => `state=${state}`).join("&")
        : "";
    let url = `repositories/${repository.slug}/pullrequests${query}`;

    do {
      const r = await repository.fetch(url);
      const res = await r.json();
      url = res.next;

      if (res.values) {
        for (const p of res.values) {
          const source = await getBranch(p.source);

          if (filter.source && !filter.source.equals(source)) {
            continue;
          }

          const destination = await getBranch(p.destination);

          if (filter.destination && !filter.destination.equals(destination)) {
            continue;
          }

          yield new this(source, destination, p.id, {
            description: p.description,
            title: p.title,
            state: p.state
          });
        }
      }
    } while (url);
  }

  /**
   * https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Busername%7D/%7Brepo_slug%7D/pullrequests#post
   */
  static async open(source, destination, options) {
    for await (const p of source.provider.pullRequestClass.list(
      source.repository,
      { source, destination }
    )) {
      return p;
    }

    const url = `repositories/${destination.slug}/pullrequests`;

    const res = await destination.fetch(url, {
      method: "POST",
      data: {
        source: {
          branch: {
            name: source.name
          }
        },
        destination: {
          branch: {
            name: destination.name
          }
        },
        ...options,
        description: options.body
      }
    });

    const json = await res.json();

    if (json.type === "error" && json.error) {
      throw new Error(json.error.message);
    }

    return new this(source, destination, json.id, {
      body: json.description,
      title: json.title,
      state: json.state
    });
  }

  /**
   * https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Bworkspace%7D/%7Brepo_slug%7D/pullrequests/%7Bpull_request_id%7D/merge
   */
  async _merge(method = "merge_commit") {
    const url = `repositories/${this.destination.slug}/pullrequests/${this.number}/merge`;
    const res = await this.destination.fetch(url, {
      type: "a type",
      message: "a message",
      method: "POST",
      data: {
        close_source_branch: false,
        merge_strategy: method // "fast_forward", "squash", "merge_commit"
      }
    });
  }

  async _write() {}
}
