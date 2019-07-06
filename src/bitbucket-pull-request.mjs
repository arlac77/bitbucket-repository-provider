import { PullRequest } from "repository-provider";

export class BitbucketPullRequest extends PullRequest {
  static get validStates() {
    return new Set(["OPEN", "MERGED", "SUPERSEDED", "DECLINED"]);
  }

  /**
   * list all pull request for a given destination repo
   * @param {Repository} destination
   * @param {Set<string>} states
   */
  static async *list(destination, states) {
    const getBranch = async u =>
      destination.provider.branch(
        [u.repository.full_name, u.branch.name].join("#")
      );

    const query =
      states && states.size
        ? "?" + [...states].map(state => `state=${state}`).join("&")
        : "";
    let url = `repositories/${destination.fullName}/pullrequests${query}`;

    do {
      const r = await destination.fetch(url);
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
  static async open(source, destination, title) {
    const url = `repositories/${destination.fullName}/pullrequests`;

    const r = await destination.fetch(url, {
      method: "POST",
      data: {
        title,
        source: {
          branch: {
            name: source.name
          }
        },
        destination: {
          branch: {
            name: destination.name
          }
        }
      }
    });
    //console.log(r);

    const p = await r.json();
    console.log(p);

    return new this(source, destination, "4711", {
      description: p.description,
      title: p.title,
      state: p.state
    });
  }

  async merge() {}
}
