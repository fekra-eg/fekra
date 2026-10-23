# FEKRA CMS documentation

The English CMS manual covers 18 editor and administrator workflows with screenshots, a publishing checklist, and troubleshooting guidance.

- [PDF manual](FEKRA-CMS-User-Guide.pdf) for reading and sharing
- [Editable Word manual](FEKRA-CMS-User-Guide.docx)
- [Markdown guide](CMS-USER-GUIDE.md) for reading in the repository
- [Original screenshots](screenshots/)

## Scope and screenshot environment

The manual follows the collection definitions, custom editor components, access rules, and globals in this checkout. Screenshots were captured from the actual CMS running with an isolated local demo database on 22 October 2026. They contain demo content rather than live applicant or contact data. No live content was published or changed while preparing the guide.

The initial local startup against the configured database failed because the running Payload version expected `users.reset_password_requested_at`, which was absent. The documentation database was created separately; this task did not migrate or repair the configured database. A developer should investigate version and migration compatibility before changing that database.

## Related project documentation

- [Project overview and local setup](../../README.md)
- [Technical handover](../HANDOVER.md)
- [Page inventory](../PAGE-INVENTORY.md)
- [QA map](../QA-MAP.md)

## Updating this guide

Edit the workflow content in `build_guide.py`, refresh the relevant screenshots, and run the builder with a Python environment that includes `python-docx` and Pillow. Render and visually inspect every page before replacing the shared PDF. The page index assumes one page per workflow, so check it after layout or content changes.

Keep authentication state, database files, and credentials outside this documentation directory.
