# Project asset provenance manifest

This manifest records an asset's project, origin, source, declared license, attribution notes, and manual rights-review status. It is a production-safety aid, not a rights database, legal opinion, or proof that media is permitted for a particular use.

## Research and design decision

- [SPDX 3.0.1 license-expression specification](https://spdx.github.io/spdx-spec/v3.0.1/annexes/spdx-license-expressions/) defines SPDX identifiers, custom **LicenseRef-** references, and **AND** / **OR** / **WITH** syntax.
- [SPDX License List](https://spdx.org/licenses/) provides canonical identifiers and license texts. This validator checks expression grammar only; it does not confirm that an identifier exists in the list.
- [Creative Commons BY 4.0 legal code, Section 3](https://creativecommons.org/licenses/by/4.0/legalcode) describes attribution, retaining licensor-supplied notices, linking to the work and license, and indicating modifications.
- [Creative Commons FAQ](https://creativecommons.org/faq/) explains that attribution format depends on the medium and that modification notices and prior notices should be retained.
- [OpenAssetIO introduction](https://docs.openassetio.org/OpenAssetIO/) describes an interoperability bridge, not a database or standardized asset metadata schema. This manifest does not claim OpenAssetIO compatibility.

The finding matters because this studio serves multiple independent projects. Source and rights notes should travel with the project asset, rather than being inferred from a filename or copied between projects.

## Location and path isolation

Store one **asset-manifest.json** in each project workspace, for example:

~~~text
public/
  projects/
    MyShortFilm/
      asset-manifest.json
      assets/opening-photo.png
      licenses/custom-terms.txt
~~~

The **projectId** must match the workspace folder. Asset and local license paths are relative to that folder. The validator rejects absolute paths, traversal segments, Windows drive/backslash paths, duplicate IDs/paths, missing files, and symlinks resolving outside the project root. Existing projects are not migrated or moved automatically.

## Example schema

This is a template only. Replace all example source data before using it.

~~~json
{
  "schemaVersion": 1,
  "projectId": "MyShortFilm",
  "assets": [{
    "id": "opening-photo",
    "path": "assets/opening-photo.png",
    "mediaType": "image",
    "source": {
      "kind": "third-party",
      "title": "Example photograph",
      "creator": "Example Creator",
      "url": "https://example.org/original-photo"
    },
    "rights": {
      "reviewStatus": "pending",
      "licenseExpression": "CC-BY-4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "attribution": "Example Creator — Example photograph — CC BY 4.0",
      "modified": true,
      "modificationNotice": "Cropped and color-adjusted."
    }
  }]
}
~~~

Origins are **original**, **third-party**, or **generated**. Original assets record the creator; third-party assets record an HTTPS source and license reference; generated assets record the tool/service. For reviewed generated assets, record the applicable terms expression and URL or local terms file.

Review status is **pending**, **reviewed**, or **blocked**. Pending entries warn during normal validation and fail release mode. Blocked entries always fail. **reviewed** is a project-maintainer record that terms were checked for the intended use; the tool cannot verify that statement.

## Commands

~~~bash
node scripts/validate-assets.cjs public/projects/MyShortFilm/asset-manifest.json
node scripts/validate-assets.cjs public/projects/MyShortFilm/asset-manifest.json --release
npm run assets:validate -- public/projects/MyShortFilm/asset-manifest.json --release
~~~

The CLI verifies metadata, referenced local files, and project-root containment. It does not download or inspect source pages, check SPDX IDs against the live list, determine ownership, interpret license terms, or decide jurisdiction-specific suitability. Human review remains required. For custom terms, use a **LicenseRef-...** expression and keep the corresponding text or URL accessible. Preserve source notices and record modifications when required.

## Acceptance checks

- Unique asset IDs and paths, including case-insensitive path collisions.
- Valid project ID, schema version, media type, origin, and review status.
- Third-party assets have source and license references.
- Generated assets identify their tool/service.
- SPDX expression syntax is checked without claiming canonical ID verification.
- Pending rights review blocks **--release**; blocked assets always fail.
- Asset and custom license files exist and resolve inside the project workspace.
- Existing project assets remain untouched.
