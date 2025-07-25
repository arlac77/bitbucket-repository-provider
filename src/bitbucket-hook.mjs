import { Hook } from "repository-provider";

/**
 *
 */
export class BitbucketHook extends Hook {
  static attributeMapping = {
    uuid: "id"
  };
}
