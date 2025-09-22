import { Hook } from "repository-provider";

/**
 *
 */
export class BitbucketHook extends Hook {
  static attributes = {
    ...super.attributes,
    id: { ...super.attributes.id, externalName: "uuid" }
  };
}
