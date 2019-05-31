import { RepositoryGroup } from "repository-provider";

/**
 * Group of a bitbucket repositories (Project)
 */
export class BitbucketGroup extends RepositoryGroup {
  /**
   * options
   */
  static get defaultOptions() {
    return {
        /**
         * api url.
         * @return {string}
         */
        api: undefined,
        ...super.defaultOptions
      };
  }
}
