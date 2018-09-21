import {
  Provider,
  Repository,
  Branch,
  Content,
  PullRequest
} from "repository-provider";

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

  get(...args) {
    return this.provider.get(...args);
  }

  put(...args) {
    return this.provider.put(...args);
  }

  post(...args) {
    return this.provider.post(...args);
  }

  /**
   * @param {string} path
   * @return {Promise<Content>}
   */
  async content(path) {
    const res = await this.get(
      `repositories/${this.fullName}/src/${this.hash}/${path}`
    );
    return new Content(path, res);
  }

  async tree(path) {
    const res = await this.get(
      `repositories/${this.repository.fullName}/src/${this.hash}${path}`
    );

    console.log(res);
    return res.values.map(e => {
      return { path: e.path };
    });
  }

  async *list(pattern = ["**/*", "**/.*"]) {
    for (entry of this.tree("/")) {
      yield entry;
    }
  }

  /**
   * @see{https://stackoverflow.com/questions/46310751/how-to-create-a-pull-request-in-a-bitbucket-using-api-1-0/46311951#46311951}
   */
  async createPullRequest(to, msg) {
    const res = await this.put(`${this.repository.api}/pullrequests`, {
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
    });

    console.log(res);

    return new PullRequest(this.repository, result.number);
  }
}
