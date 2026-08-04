---
name: publish-release
description: Publish an already prepared and verified release, including the authorized commit, tag, registry publication, and remote release. Use only when the user explicitly asks to publish.
---

# Publish Release

This workflow performs remote, consequential release actions. Use it only after explicit publication authorization.

## Steps

1. **Confirm the prepared release**: Verify the prepared version from repository metadata, the changelog, working tree, target branch, and release artifact contents. Determine whether the prepared state already has an exact intended release commit. When release changes are uncommitted, record the current commit and the prepared changes instead; do not treat the current commit as the intended tag target.
2. **Inspect existing tags**: Before asking for direction or making a consequential change, inspect the intended tag locally and on every relevant remote. Record each tag's reference object and resolve annotated and lightweight tags to their commit targets. Compare those targets with the intended release commit only when that commit exists. Treat any existing intended tag as ambiguous when the release commit does not exist yet, and record every remote checked. Read-only tag inspection is required even when another release target, such as the registry, is already ambiguous.
3. **Confirm the publication target**: Verify the repository's intended registry or deployment environment without substituting another target.
4. **Report the preflight and stop on ambiguity**: Before asking for direction or taking any commit, tag, push, publish, deployment, or remote-release action, report the prepared version, whether the intended release commit exists, the prepared commit or uncommitted state, local tag object and target, remote tag objects and targets, every remote checked, the verified publication target, and whether any ambiguity remains. If ambiguity remains, identify it exactly and stop. Stop when a tag target mismatches, tag objects conflict, or an existing tag cannot be compared with a release commit that does not exist yet. If a required read is unavailable, report that exact verification gap.
5. **Re-run release gates**: Run the repository's complete verification and package dry-run. Stop on any failure.
6. **Commit and tag**: Create the release commit when the prepared changes are uncommitted. Create the intended tag only when it is absent locally and from every relevant remote. Reuse an existing tag only when repository policy identifies it as authoritative and its reference object and commit target satisfy the release contract. Preserve an authoritative remote tag object instead of recreating it from its peeled commit. Stop on mismatches or divergent tag objects. Never rewrite a published tag.
7. **Push**: Push the release commit and any tag that does not already exist on the confirmed remote.
8. **Publish**: Run the documented registry or deployment command. Do not substitute a different registry or environment.
9. **Verify**: Confirm the published version, files, exports, and installation path from the registry or deployment target.
10. **Create the remote release**: When the repository uses GitHub releases, create it from the verified tag and public changelog content.
11. **Report**: Provide release URLs, verification evidence, and any downstream follow-ups.

Stop and request direction if the prepared state, target, credentials, or authorization is ambiguous.
