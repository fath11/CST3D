import { defineConfig } from 'tsup'

export default defineConfig({
  name: 'cst12293d', // Replace it with your extension name
  entry: ['src/index.ts', 'src/index.js'],
  target: ['esnext'],
  format: ['iife'],
  outDir: 'dist',
  banner: {
    // Replace it with your extension's metadata
    js: `// Name: CST 3D
// ID: cst12293d
// Description: Bring your sprites into the third dimension.
// By: CST1229 <https://scratch.mit.edu/users/CST1229/>
// License: MPL-2.0
`
  },
  platform: 'browser',
  clean: true
})
