import { RepositoryGroup } from "repository-provider";

/**
 * Project of a bitbucket repository
 */
export class BitbucketProject extends RepositoryGroup {
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
        api: undefined
      },
      super.defaultOptions
    );
  }
}
