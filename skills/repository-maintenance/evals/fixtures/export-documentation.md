# Export command

The CLI guide documents `export --output PATH`. A successful export replaces the contents of an existing file. Previously, if the export reported an error, the file could be left empty. The new regression test starts with a known file, makes the export report an error, and verifies that the original contents survive. Recovery after power loss is outside the command's contract.

The writer now creates a scratch file beside the destination and renames it into place after the export finishes. The platform requires both paths to be on the same filesystem for this rename. A maintainer suggested using the system temporary directory instead. The source comment belongs on the line that chooses the directory.

The same patch renames the private helper `writeReport` to `stageReport`. Output formatting stays the same. The release notes have a public Fixes section and use one sentence per entry.
