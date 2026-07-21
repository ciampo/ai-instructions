---
name: publish-release
description: Publish an already prepared and verified release, including the authorized commit, tag, registry publication, and remote release. Use only when the user explicitly asks to publish.
---

# Publish Release

This workflow performs remote, consequential release actions. Use it only after explicit publication authorization.

## Steps

1. **Confirm the prepared release**: Verify the version, changelog, working tree, target branch, registry, and release artifact contents.
2. **Re-run release gates**: Run the repository's complete verification and package dry-run. Stop on any failure.
3. **Commit and tag**: Create the release commit and tag using the repository's conventions. Never rewrite a published tag.
4. **Push**: Push the release commit and tag to the confirmed remote.
5. **Publish**: Run the documented registry or deployment command. Do not substitute a different registry or environment.
6. **Verify**: Confirm the published version, files, exports, and installation path from the registry or deployment target.
7. **Create the remote release**: When the repository uses GitHub releases, create it from the verified tag and public changelog content.
8. **Report**: Provide release URLs, verification evidence, and any downstream follow-ups.

Stop and request direction if the prepared state, target, credentials, or authorization is ambiguous.
