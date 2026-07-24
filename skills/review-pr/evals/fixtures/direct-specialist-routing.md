# Direct-specialist routing context

This is a static evaluation fixture, not a live pull request. Treat it as the complete immutable boundary; do not fetch a remote branch.

- Repository: `example/review-pr-routing-fixture`
- Base revision: `20b460eb8bd126b0fd2bbc3c17fdd9ca4f7a59f1`
- Head revision: `3a93f8aa4ec2db76f8a4576e75f87cdab919df95`
- Target audience: maintainers deciding whether the regression fix is ready to merge
- Existing review state: no comments or reviews

The only changed area is a settings-dialog regression test. The component renders a semantic Save button, but the test only queries an implementation class and never activates it or observes `onSave`. No browser or assistive-technology evidence is supplied.
