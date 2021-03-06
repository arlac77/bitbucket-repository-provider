import { RepositoryGroup } from "repository-provider";

/**
 *
 */
export class BitbucketRepositoryGroup extends RepositoryGroup {
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
  async createRepository(name, options = {}) {
    //console.log(`repositories/${this.name}/${name}`);
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

    //console.log(response);

    if (response.ok) {
      return this.addRepository(name, options);
    }
  }
}
