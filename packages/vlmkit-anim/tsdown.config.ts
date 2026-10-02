import { defineConfig } from "tsdown";

// Same shape vlmkit built this package with (tsdown.packages.config.ts there): one module per
// source file, so `@mizchi/vlmkit-anim/<path>.ts` deep imports keep resolving to `dist/<path>.mjs`.
export default defineConfig({
  name: "@mizchi/vlmkit-anim",
  entry: ["src/**/*.ts", "!src/**/*.test.ts"],
  root: "src",
  outDir: "dist",
  clean: true,
  format: ["esm"],
  platform: "node",
  target: "node24",
  dts: true,
  unbundle: true,
  deps: {
    neverBundle: [/^@mizchi\/vlmkit-/],
  },
});
