## [1.0.1](https://github.com/StephenFlavin/docusaurus-plugin-tech-radar/compare/v1.0.0...v1.0.1) (2026-04-17)


### Bug Fixes

* links on diciplines page ([d14568a](https://github.com/StephenFlavin/docusaurus-plugin-tech-radar/commit/d14568a67c81e99c042d0957c82ca9ed5d189ce1))

# 1.0.0 (2026-04-17)


* feat!: rename quadrants to segments across codebase ([30a806b](https://github.com/StephenFlavin/docusaurus-plugin-tech-radar/commit/30a806bb3015536b0b5512c26adc07120216269c))


### Bug Fixes

* correct repository URL typo in package.json ([f59d66f](https://github.com/StephenFlavin/docusaurus-plugin-tech-radar/commit/f59d66ff50672e6a34826964813d9874a836f7fc))
* name and base url ([766cdbf](https://github.com/StephenFlavin/docusaurus-plugin-tech-radar/commit/766cdbfa75e4374e5a955c195b7f1eff0bfbfa20))
* **samples:** revert webpack override to 5.97.1 ([c994d45](https://github.com/StephenFlavin/docusaurus-plugin-tech-radar/commit/c994d4569ceb8c0426b72639a20a8b31b7a53cf4))
* **theme:** let radar-page fill viewport and inherit --doc-sidebar-width ([5d1961e](https://github.com/StephenFlavin/docusaurus-plugin-tech-radar/commit/5d1961eb5e9e68ae803cc7d2fd6d9be09b8f52a0))
* **theme:** match sidebar width to docs and remove content max-width cap ([dab5690](https://github.com/StephenFlavin/docusaurus-plugin-tech-radar/commit/dab569092acdf48cbb32bb785b1a6b4b0ef4907c))
* **theme:** reduce sidebar width to 240px to match docs visual weight ([b28c827](https://github.com/StephenFlavin/docusaurus-plugin-tech-radar/commit/b28c827d5133881f72d51f06c29afcfcb73c96c9))
* **theme:** remove bold from sidebar category labels ([f8ecad5](https://github.com/StephenFlavin/docusaurus-plugin-tech-radar/commit/f8ecad5c705f4474983f55294e38897be3b775c2))
* **theme:** use --ifm-menu-* variables for sidebar link sizing ([6a73547](https://github.com/StephenFlavin/docusaurus-plugin-tech-radar/commit/6a735470350bad065c73c1df985aadeffa179bb6))
* thread routeBasePath to components; remove config from entryData/discData ([1222f05](https://github.com/StephenFlavin/docusaurus-plugin-tech-radar/commit/1222f051bd600fbf4471fda24904b7e91e8cb8c1))


### Features

* initial commit ([e549bb9](https://github.com/StephenFlavin/docusaurus-plugin-tech-radar/commit/e549bb929d7fc8b5169a1db587a8926ea6d6c021))
* **samples:** add GitHub link in footer and demo tag in navbar ([7666d16](https://github.com/StephenFlavin/docusaurus-plugin-tech-radar/commit/7666d162184231ff0414bafa83addee02b3076ca))


### BREAKING CHANGES

* The `quadrants` key in the radar data model, YAML
schema, and all internal/theme references has been renamed to
`segments` to reflect that the radar supports a dynamic number of
sections rather than exactly four. Existing YAML files must replace
`quadrants:` with `segments:` under each discipline.
