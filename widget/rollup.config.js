import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/vaani.js",
      format: "iife",
      name: "VaaniWidget",
      sourcemap: true,
    },
    {
      file: "dist/vaani.min.js",
      format: "iife",
      name: "VaaniWidget",
      plugins: [terser()],
    },
  ],
  plugins: [resolve(), commonjs(), typescript({ tsconfig: "./tsconfig.json" })],
};
