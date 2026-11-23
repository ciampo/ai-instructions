# Archive reader migration

The import command is replacing its archive reader. Both readers can list
the entries in a sample archive. The existing reader unit tests pass a file
path to the reader.

The scheduled backup job instead pipes an archive into `restore --input -`.
That mode reads from a stream that cannot seek. A local fixture contains two
records with known IDs, and the CLI can restore them to a temporary database.
The new reader's documentation lists stream support, but the command adapter
has only been exercised with file paths.
