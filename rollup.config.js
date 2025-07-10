import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [
  // CommonJS build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      exports: 'named'
    },
    plugins: [
      resolve({ preferBuiltins: false }),
      commonjs(),
      typescript({ declaration: true, outDir: 'dist' })
    ],
    external: ['cross-fetch']
  },
  // ESM build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'es'
    },
    plugins: [
      resolve({ preferBuiltins: false }),
      commonjs(),
      typescript({ declaration: false })
    ],
    external: ['cross-fetch']
  }
]; 