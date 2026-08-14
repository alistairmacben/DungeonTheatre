// The single engine entry point.
//
// Rules, content and the player contract are one module graph. Bundling them
// separately would give each bundle its own copy of the stat-path registry —
// which is exactly the kind of duplicated-state bug the architecture exists to
// avoid, and it is worth the one file to make it impossible.

export * from './rules/index.js'
export * from './content/index.js'
export * from './view/index.js'
