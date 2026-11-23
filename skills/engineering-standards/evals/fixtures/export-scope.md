# Empty exports

The nightly service and the CLI use different writers. Both return before
writing the required header for an empty export. The importer rejects either
file. The release is meant to restore that guarantee for both supported entry
points.

The CLI also has a progress display change ready to include. It can ship on
its own. Its terminal snapshots account for most of the proposed diff, and
reviewers still disagree about the output when stdout is redirected.
