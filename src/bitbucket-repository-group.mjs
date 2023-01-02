import { RepositoryGroup } from "repository-provider";

/**
 *
 */
export class BitbucketRepositoryGroup extends RepositoryGroup {

  static get attributes() {
    return {
      ...super.attributes,
      uuid: { type: "string", isKey: true }
    };
  }

  static get attributeMapping() {
    return {
      ...super.attributeMapping,
      display_name: "displayName",
      "links.avatar.href": "avatarURL",
      website: "homePageURL"
    };
  }

  /**
   * {@link https://community.atlassian.com/t5/Bitbucket-articles/Create-and-configure-a-Bitbucket-Server-repository-using-the/ba-p/828364}
   * @param {string} name
   * @param {Object} options
   * @return {Repository} newly created repository
   */
  async createRepository(name, options) {
    const response = await this.provider.fetch(
      `repositories/${this.name}/${name}`,
      {
        method: "POST",
        body: JSON.stringify({
          name,
          ...options
        })
      }
    );

    if (response.ok) {
      return this.addRepository(name, options);
    }
  }
}
