import { RepositoryGroup } from "repository-provider";

/**
 *
 */
export class BitbucketRepositoryGroup extends RepositoryGroup {
  static get attributeMappiong() {
    return {
      ...super.attributeMapping,
      display_name: "displayName"
      //website: "homePageURL"
    };
  }
}
