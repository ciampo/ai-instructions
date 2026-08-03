---
name: publish-release
description: Publish an already prepared and verified release, including the authorized commit, tag, registry publication, and remote release. Use only when the user explicitly asks to publish.
---

# Publish Release

This workflow performs remote, consequential release actions. Use it only after explicit publication authorization.

## Steps

1. **Confirm the prepared release**: Verify the prepared version from repository metadata, the changelog, exact prepared commit, working tree, target branch, and release artifact contents.
2. **Inspect existing tags**: Before asking for direction or making a consequential change, inspect the intended tag locally and on every relevant remote. Resolve annotated and lightweight tags to their commit targets, compare each target with the exact prepared commit, and record every remote checked. Read-only tag inspection is required even when another release target, such as the registry, is already ambiguous.
3. **Confirm the publication target**: Verify the repository's intended registry or deployment environment without substituting another target.
4. **Stop on ambiguity**: Before any commit, tag, push, publish, deployment, or remote release, report the prepared version and commit, local tag state and target, remote tag state and target, remotes checked, and unresolved publication target. If a required read is unavailable, report that exact verification gap. Never defer these reads until after asking the user what to do.
5. **Re-run release gates**: Run the repository's complete verification and package dry-run. Stop on any failure.
6. **Commit and tag**: Create the release commit and tag using the repository's conventions. Never rewrite a published tag.
7. **Push**: Push the release commit and tag to the confirmed remote.
8. **Publish**: Run the documented registry or deployment command. Do not substitute a different registry or environment.
9. **Verify**: Confirm the published version, files, exports, and installation path from the registry or deployment target.
10. **Create the remote release**: When the repository uses GitHub releases, create it from the verified tag and public changelog content.
11. **Report**: Provide release URLs, verification evidence, and any downstream follow-ups.

Stop and request direction if the prepared state, target, credentials, or authorization is ambiguous.
