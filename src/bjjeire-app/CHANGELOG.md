# Changelog

## [0.1.35](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.34...frontend-v0.1.35) (2026-09-03)


### Bug Fixes

* trigger ci ([7cbe7c3](https://github.com/ianoflynnautomation/bjjeire/commit/7cbe7c37dee1685ddcbc7e1f37275e6eae9e210e))
* trigger ci ([afe3ac2](https://github.com/ianoflynnautomation/bjjeire/commit/afe3ac20de6f792da61a9f8e449e37fc73e3b975))

## [0.1.34](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.33...frontend-v0.1.34) (2026-08-27)


### Features

* add test reporting compliance ([afc66a1](https://github.com/ianoflynnautomation/bjjeire/commit/afc66a1900eafe0e95ef99afd1ecfc9014fe243f))
* add test reporting compliance ([0e60b46](https://github.com/ianoflynnautomation/bjjeire/commit/0e60b468291ddaec55874b755c49a151ad467a43))


### Bug Fixes

* failing ci ([0c65f7f](https://github.com/ianoflynnautomation/bjjeire/commit/0c65f7f764569476b762b7e0de6e61df91779ebe))
* failing ci ([129d96c](https://github.com/ianoflynnautomation/bjjeire/commit/129d96c4e533bf9a4f526509a628da4b38560db2))

## [0.1.33](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.32...frontend-v0.1.33) (2026-08-23)


### Features

* add ephemeral test env ([d6f9383](https://github.com/ianoflynnautomation/bjjeire/commit/d6f93838e09675eb996739450eee2fbb7d7cf3a3))


### Bug Fixes

* ui acceptance tests ([4a33d66](https://github.com/ianoflynnautomation/bjjeire/commit/4a33d6604e24aca1732f2456e03827e20ddd5668))

## [0.1.32](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.31...frontend-v0.1.32) (2026-08-20)


### Features

* harden test workflows ci cd ([3082c7d](https://github.com/ianoflynnautomation/bjjeire/commit/3082c7dd17636939722444e6946b725da93ea506))

## [0.1.31](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.30...frontend-v0.1.31) (2026-08-09)


### Bug Fixes

* frontend vars hardening ([da5ef38](https://github.com/ianoflynnautomation/bjjeire/commit/da5ef387036715a16c94b4914093c35ad29120f6))
* frontend vars hardening ([7291c4a](https://github.com/ianoflynnautomation/bjjeire/commit/7291c4aeb7cf7652f9cf0be79deaca66d2f689ca))
* ui format ([bff21d1](https://github.com/ianoflynnautomation/bjjeire/commit/bff21d1571c772d5bdb9a837c13f7495d3c59f77))

## [0.1.30](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.29...frontend-v0.1.30) (2026-08-09)


### Features

* add competition theme ([e5929f4](https://github.com/ianoflynnautomation/bjjeire/commit/e5929f47b2a5657d34cb9466721660903b0618a3))
* add hover prefetch ([b88968b](https://github.com/ianoflynnautomation/bjjeire/commit/b88968bd07505e728e1f8cd947ed29461322cf2c))
* clean up index css ([f064b4e](https://github.com/ianoflynnautomation/bjjeire/commit/f064b4efc7c2d90b5be472dc728466eaf089b1a9))
* init commit ([9bc7d86](https://github.com/ianoflynnautomation/bjjeire/commit/9bc7d86fa58f92848dfd259eb06b3469c78881fd))
* remove hardcoded memo after react 19 upgrade ([11b4af6](https://github.com/ianoflynnautomation/bjjeire/commit/11b4af6b0e2d86b402a12838c29854fc885c04ca))
* update UI theme design ([9036d77](https://github.com/ianoflynnautomation/bjjeire/commit/9036d773bb1b66440568fe606df8c68413865e13))


### Bug Fixes

* card header dark only patterns ([49d9b61](https://github.com/ianoflynnautomation/bjjeire/commit/49d9b614be570aa08efa8e11e4c8cab78a51a003))
* format and linting ([45888f9](https://github.com/ianoflynnautomation/bjjeire/commit/45888f916890e8367528a3ce142a238860d0c42a))
* format api ([1f32eaa](https://github.com/ianoflynnautomation/bjjeire/commit/1f32eaaa7b324c327fea86273201dc1c4ee6731c))
* openai drift ([2367a60](https://github.com/ianoflynnautomation/bjjeire/commit/2367a60890246e7becda8db74da9a15f14cbeb8c))
* publish first Java API image ([b19425a](https://github.com/ianoflynnautomation/bjjeire/commit/b19425a446d5730896eaa64e9594a2ec040a8b87))
* release please drift api and ui ([424a573](https://github.com/ianoflynnautomation/bjjeire/commit/424a5738f4b4e18029d9fd0be51ac02486d73a05))
* release please drift api and ui ([6b43e98](https://github.com/ianoflynnautomation/bjjeire/commit/6b43e98a111df259f089cc13808e5a3195681265))

## [0.1.29](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.27...frontend-v0.1.29) (2026-08-08)

> **Note:** Reconciliation entry. The release-please version counter was rolled back at some point (git tags only reach `frontend-v0.1.23`, and this file carries duplicate/out-of-order `0.1.21`–`0.1.27` runs). Meanwhile a `v0.1.29` frontend image from the earlier release lineage still sits in GHCR and is what the Flux image policy (`>=0.1.0 <1.0.0`, highest-tag-wins) keeps selecting — so releases at `0.1.23` or below can never reach the cluster. The manifest is re-anchored to `0.1.29` so the next release cuts `0.1.30`, produces a fresh image that finally outranks the stale one, and numbering stays monotonic from here. The bullets below carry the real commits from the current build.

### Features

* add competition theme ([e5929f4](https://github.com/ianoflynnautomation/bjjeire/commit/e5929f47b2a5657d34cb9466721660903b0618a3))
* add hover prefetch ([b88968b](https://github.com/ianoflynnautomation/bjjeire/commit/b88968bd07505e728e1f8cd947ed29461322cf2c))
* clean up index css ([f064b4e](https://github.com/ianoflynnautomation/bjjeire/commit/f064b4efc7c2d90b5be472dc728466eaf089b1a9))
* remove hardcoded memo after react 19 upgrade ([11b4af6](https://github.com/ianoflynnautomation/bjjeire/commit/11b4af6b0e2d86b402a12838c29854fc885c04ca))
* update UI theme design ([9036d77](https://github.com/ianoflynnautomation/bjjeire/commit/9036d773bb1b66440568fe606df8c68413865e13))

### Bug Fixes

* publish first Java API image ([b19425a](https://github.com/ianoflynnautomation/bjjeire/commit/b19425a446d5730896eaa64e9594a2ec040a8b87))
* card header dark only patterns ([49d9b61](https://github.com/ianoflynnautomation/bjjeire/commit/49d9b614be570aa08efa8e11e4c8cab78a51a003))
* format and linting ([45888f9](https://github.com/ianoflynnautomation/bjjeire/commit/45888f916890e8367528a3ce142a238860d0c42a))
* format api ([1f32eaa](https://github.com/ianoflynnautomation/bjjeire/commit/1f32eaaa7b324c327fea86273201dc1c4ee6731c))
* openai drift ([2367a60](https://github.com/ianoflynnautomation/bjjeire/commit/2367a60890246e7becda8db74da9a15f14cbeb8c))

## [0.1.27](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.26...frontend-v0.1.27) (2026-07-11)

### Features

- update bjj event schedule and pricing model ([#268](https://github.com/ianoflynnautomation/bjjeire/issues/268)) ([f6b331d](https://github.com/ianoflynnautomation/bjjeire/commit/f6b331d2d64541ea0ef0b1a2c4b91bdad7bc760e))

## [0.1.26](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.25...frontend-v0.1.26) (2026-07-10)

### Bug Fixes

- trigger frontend build ([#266](https://github.com/ianoflynnautomation/bjjeire/issues/266)) ([61ad9cb](https://github.com/ianoflynnautomation/bjjeire/commit/61ad9cba7bec8c01786ae25d1036b012bbf8c95a))

## [0.1.25](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.24...frontend-v0.1.25) (2026-07-08)

### Features

- add tracing ([#262](https://github.com/ianoflynnautomation/bjjeire/issues/262)) ([0cc3f5c](https://github.com/ianoflynnautomation/bjjeire/commit/0cc3f5ca387f0f5f748841712715e0533f7d611f))

## [0.1.24](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.23...frontend-v0.1.24) (2026-07-05)

### Bug Fixes

- nav links and button variant ui defect ([#243](https://github.com/ianoflynnautomation/bjjeire/issues/243)) ([7b7ff19](https://github.com/ianoflynnautomation/bjjeire/commit/7b7ff19456d00d92027e8e390d2812b330bd3a4e))

## [0.1.23](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.22...frontend-v0.1.23) (2026-06-29)

### Features

- add audit log ([#228](https://github.com/ianoflynnautomation/bjjeire/issues/228)) ([862c8a1](https://github.com/ianoflynnautomation/bjjeire/commit/862c8a1ab27819babe3a701bd5f89ccd578ba8b5))

## [0.1.22](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.21...frontend-v0.1.22) (2026-06-14)

### Bug Fixes

- add pagination max page validation ([#200](https://github.com/ianoflynnautomation/bjjeire/issues/200)) ([069c769](https://github.com/ianoflynnautomation/bjjeire/commit/069c769bd1438a7299faa8341a14e4a76d05e515))

## [0.1.21](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.20...frontend-v0.1.21) (2026-05-17)

### Bug Fixes

- **api:** re-publish container image with fixed ([a03bb0c](https://github.com/ianoflynnautomation/bjjeire/commit/a03bb0cf546003dc788a569365eca436afb68994))
- **api:** re-publish container image with fixed ([8a42557](https://github.com/ianoflynnautomation/bjjeire/commit/8a425573fb667a9a49d4e55d4d4fcfdb35aee85d))

## [0.1.20](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.19...frontend-v0.1.20) (2026-05-17)

### Bug Fixes

- **api:** re-publish v0.1.10 container image ([8e1c4ed](https://github.com/ianoflynnautomation/bjjeire/commit/8e1c4eddf5572ae39b9ff2294a09201fd68ebb87))

## [0.1.19](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.18...frontend-v0.1.19) (2026-05-16)

### Bug Fixes

- msal config ([#168](https://github.com/ianoflynnautomation/bjjeire/issues/168)) ([e3b4e5f](https://github.com/ianoflynnautomation/bjjeire/commit/e3b4e5f126ca90fdf54568703144c708a220fbf2))

## [0.1.18](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.17...frontend-v0.1.18) (2026-05-14)

### Features

- improve ui feature flag init ([#148](https://github.com/ianoflynnautomation/bjjeire/issues/148)) ([d6fcc5b](https://github.com/ianoflynnautomation/bjjeire/commit/d6fcc5b55eac998566ac0e678c0bd1e017cfa8f5))

## [0.1.17](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.16...frontend-v0.1.17) (2026-04-26)

### Features

- add api versioning ([#107](https://github.com/ianoflynnautomation/bjjeire/issues/107)) ([270ad0b](https://github.com/ianoflynnautomation/bjjeire/commit/270ad0b5f0b6afb5080be40f6fba2893e83ae77d))

## [0.1.16](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.15...frontend-v0.1.16) (2026-04-25)

### Features

- react improve UI accessibility ([#102](https://github.com/ianoflynnautomation/bjjeire/issues/102)) ([671669c](https://github.com/ianoflynnautomation/bjjeire/commit/671669cf504e06aeb6c45399079e3f05ed6139ca))

## [0.1.15](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.14...frontend-v0.1.15) (2026-04-11)

### Bug Fixes

- release ci pipeline ([#69](https://github.com/ianoflynnautomation/bjjeire/issues/69)) ([866ee7a](https://github.com/ianoflynnautomation/bjjeire/commit/866ee7abd58b6dc32df1bc75cc0d66072b45642f))

## [0.1.14](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.13...frontend-v0.1.14) (2026-04-11)

### Features

- add background services ([#67](https://github.com/ianoflynnautomation/bjjeire/issues/67)) ([530bd7a](https://github.com/ianoflynnautomation/bjjeire/commit/530bd7a11238be6c3a19d57f830098bbec8349e6))

## [0.1.13](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.12...frontend-v0.1.13) (2026-04-10)

### Features

- add new support model feature ([#65](https://github.com/ianoflynnautomation/bjjeire/issues/65)) ([3d05199](https://github.com/ianoflynnautomation/bjjeire/commit/3d05199f5ba06666264ef77b9b9990c6a7264291))

## [0.1.12](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.11...frontend-v0.1.12) (2026-04-08)

### Features

- add store feature ([#63](https://github.com/ianoflynnautomation/bjjeire/issues/63)) ([a4cb36d](https://github.com/ianoflynnautomation/bjjeire/commit/a4cb36dfbbf45ac848e8dec35e006ab808c9ffb2))

## [0.1.11](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.10...frontend-v0.1.11) (2026-04-05)

### Features

- add competitions feature ([#61](https://github.com/ianoflynnautomation/bjjeire/issues/61)) ([385df60](https://github.com/ianoflynnautomation/bjjeire/commit/385df60a7d97ec95f16d0d97995d0c0be2d18b55))

## [0.1.10](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.9...frontend-v0.1.10) (2026-04-04)

### Features

- add feature flag management ([#58](https://github.com/ianoflynnautomation/bjjeire/issues/58)) ([c930f9b](https://github.com/ianoflynnautomation/bjjeire/commit/c930f9be339b3692e1b4007b17313f9702791110))

## [0.1.9](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.8...frontend-v0.1.9) (2026-04-02)

### Features

- remove unused test folders ([#56](https://github.com/ianoflynnautomation/bjjeire/issues/56)) ([d893bfd](https://github.com/ianoflynnautomation/bjjeire/commit/d893bfd759dd605a1e64c64bfef7ccd21cc01639))

## [0.1.8](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.7...frontend-v0.1.8) (2026-03-31)

### Features

- replace nginx with caddy locally ([#53](https://github.com/ianoflynnautomation/bjjeire/issues/53)) ([196a6f4](https://github.com/ianoflynnautomation/bjjeire/commit/196a6f454d8045460d9f78e6196c53c2da85cd40))

## [0.1.7](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.6...frontend-v0.1.7) (2026-03-28)

### Bug Fixes

- security vulnerabilities ([#49](https://github.com/ianoflynnautomation/bjjeire/issues/49)) ([1b4a9a2](https://github.com/ianoflynnautomation/bjjeire/commit/1b4a9a26e31366323ba3a3e268679001ad96b735))

## [0.1.6](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.5...frontend-v0.1.6) (2026-03-28)

### Features

- add serach filter for gyms and events ([#47](https://github.com/ianoflynnautomation/bjjeire/issues/47)) ([dd69b15](https://github.com/ianoflynnautomation/bjjeire/commit/dd69b154e9a73e0b73e40f1e5c217b8256f61b68))

## [0.1.5](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.4...frontend-v0.1.5) (2026-03-28)

### Features

- clean up UI components ([#44](https://github.com/ianoflynnautomation/bjjeire/issues/44)) ([8023126](https://github.com/ianoflynnautomation/bjjeire/commit/802312608b0391185cb6f5b2802e3f570640027e))

## [0.1.4](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.3...frontend-v0.1.4) (2026-03-24)

### Features

- add playwright vite tests ([#41](https://github.com/ianoflynnautomation/bjjeire/issues/41)) ([5ac9187](https://github.com/ianoflynnautomation/bjjeire/commit/5ac9187e9652a8ea2b343faa30d8bd323ff29849))

## [0.1.3](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.2...frontend-v0.1.3) (2026-03-22)

### Features

- add cloudflare web analytics ([#38](https://github.com/ianoflynnautomation/bjjeire/issues/38)) ([150f9fc](https://github.com/ianoflynnautomation/bjjeire/commit/150f9fce51001fd3f997a9e3d95c0bb53b81a34a))

## [0.1.2](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.1...frontend-v0.1.2) (2026-03-21)

### Features

- add light dark mode in UI ([#36](https://github.com/ianoflynnautomation/bjjeire/issues/36)) ([30eee04](https://github.com/ianoflynnautomation/bjjeire/commit/30eee04aaa8872df9e495baf07f38b8447348b54))

## [0.1.1](https://github.com/ianoflynnautomation/bjjeire/compare/frontend-v0.1.0...frontend-v0.1.1) (2026-03-21)

### Features

- add GitHub react component ([#29](https://github.com/ianoflynnautomation/bjjeire/issues/29)) ([d0563ab](https://github.com/ianoflynnautomation/bjjeire/commit/d0563ab39c9abdfbe823673972787f1f42e5bc54))
