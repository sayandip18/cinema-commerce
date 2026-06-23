// Learn more: https://docs.expo.dev/guides/monorepo/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch only this app and the monorepo-root node_modules (where pnpm hoists
// shared deps into .pnpm). We deliberately do NOT watch the whole monorepo
// root: that makes Metro crawl sibling apps such as apps/admin, whose Vite
// dependency optimizer (node_modules/.vite) creates and deletes temp dirs
// rapidly during `pnpm dev` and crashes Metro's Windows file watcher (ENOENT).
config.watchFolders = [
  projectRoot,
  path.resolve(monorepoRoot, 'node_modules'),
];

// Resolve modules from this app first, then the monorepo root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;
