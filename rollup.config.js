import pkg from './package.json';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: pkg.module,
  output: {
    file: pkg.main,
    format: 'cjs'
  },
  plugins: [resolve(), commonjs()],
  external: ['repository-provider', 'url']
};
