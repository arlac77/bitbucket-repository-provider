import { PullRequest } from "repository-provider";

/**
 *
 */
export class BitbucketPullRequest extends PullRequest {
  static get validStates() {
    return new Set(["OPEN", "MERGED", "SUPERSEDED", "DECLINED"]);
  }

  /**
   * list all pull request for a given destination repo
   * @param {Repository} repository
   * @param {Set<string>} states
   */
  static async *list(repository, source, destination, states) {
    const getBranch = async u =>
    repository.provider.branch(
        [u.repository.full_name, u.branch.name].join("#")
      );

    const query =
      states && states.size
        ? "?" + [...states].map(state => `state=${state}`).join("&")
        : "";
    let url = `repositories/${repository.slug}/pullrequests${query}`;

    do {
      const r = await repository.fetch(url);
      const res = await r.json();
      url = res.next;

      for (const p of res.values) {
        yield new this(
          await getBranch(p.source),
          await getBranch(p.destination),
          p.id,
          {
            description: p.description,
            title: p.title,
            state: p.state
          }
        );
      }
    } while (url);
  }

  /**
   * https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Busername%7D/%7Brepo_slug%7D/pullrequests#post
   */
  static async open(source, destination, options) {
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
    //console.log(json);

    return new this(source, destination, json.id, {
      body: json.description,
      title: json.title,
      state: json.state
    });
  }

  async _merge(method) {}

  async _write() {}
}
