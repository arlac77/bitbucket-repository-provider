import {
  Provider,
  Repository,
  Branch,
  Content,
  PullRequest
} from 'repository-provider';

/**
 * Branch of a bitbucket repository
 */
export class BitbucketBranch extends Branch {
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
      `${this.repository.api}/src/${this.name}/${path}`
    );
    return new Content(path, res);
  }

  async tree(path) {
    const res = await this.get(
      `${this.repository.api}/src/${this.name}/${path}`
    );

    return res.values.map(e => {
      return { path: e.path };
    });
  }

  async list() {
    return this.tree('/');
  }

  /**
   * @see{https://stackoverflow.com/questions/46310751/how-to-create-a-pull-request-in-a-bitbucket-using-api-1-0/46311951#46311951}
   */
  async createPullRequest(to, msg) {
    const res = await this.put(`${this.repository.api}/pullrequests`, {
      title: msg,
      description: msg,
      state: 'OPEN',
      open: true,
      closed: false,
      fromRef: {
        id: `refs/heads/${this.name}`,
        repository: {
          slug: this.name,
          name: null,
          project: {
            key: this.project
          }
        }
      },
      toRef: {
        id: `refs/heads/${to}`,
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
            name: 'REVIEWER'
          }
        }
      ]
    });

    console.log(res);

    return new PullRequest(this.repository, result.number);
  }
}
