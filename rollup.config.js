import json from "rollup-plugin-json";
import executable from "rollup-plugin-executable";
import babel from "rollup-plugin-babel";
import pkg from "./package.json";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import cleanup from "rollup-plugin-cleanup";

export default {
  input: pkg.module,
  output: {
    file: pkg.main,
    format: "cjs",
    interop: false
  },
  plugins: [
    babel({
      runtimeHelpers: false,
      externalHelpers: true,
      babelrc: false,
      plugins: ["@babel/plugin-proposal-async-generator-functions"],
      exclude: "node_modules/**"
    }),
    resolve(),
    commonjs(),
    cleanup()
  ],
  external: ["repository-provider", "stream", "http", "https", "zlib"]
};
