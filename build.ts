// todo static path replacing

import { copy, ensureFile } from 'https://deno.land/std@0.201.0/fs/mod.ts'
import * as path from 'https://deno.land/std@0.201.0/path/mod.ts'
import postCSS from 'https://deno.land/x/postcss@8.4.16/mod.js'
import postcssPresetEnv from 'npm:postcss-preset-env@9.1.3'

const buildHash = crypto.randomUUID().split('-')[1]

const dir = 'web'
const outDir = 'dist'

// @ts-expect-error idk...
const postCSSInstance = postCSS([postcssPresetEnv({ preserve: true })])

let html = await Deno.readTextFile(path.join(dir, 'index.html'))

const allAssetMatches = html.matchAll(/"[\/.]*assets\/(.+)"/g)

const getHashedOutPath = (outPath: string) => {
  return path.format({
    dir: path.dirname(outPath),
    name: path.parse(outPath).name,
    ext: `.${buildHash}${path.extname(outPath)}`,
  })
}

const transpileAssets = () =>
  [...allAssetMatches].map(async ([match, assetPath]) => {
    const fullAssetPath = path.join(dir, 'assets', assetPath)
    const ext = path.extname(fullAssetPath)

    let code = await Deno.readFile(fullAssetPath)

    if (ext === '.css') {
      const codeAsString = new TextDecoder().decode(code)
      const result = await postCSSInstance.process(codeAsString, {
        from: undefined,
        to: undefined,
      })
      code = new TextEncoder().encode(result.css)
    }

    const outPath = getHashedOutPath(
      path.join(outDir, 'assets', assetPath),
    )

    await ensureFile(outPath)
    await Deno.writeFile(outPath, code)

    console.log(`Transpiled asset ${assetPath}`)

    const matchWithHash = match.replace(
      assetPath,
      path.relative('dist/assets', outPath),
    )

    html = html.replaceAll(match, matchWithHash)
  })

await Promise.all([
  ...transpileAssets(),
  copy(path.join(dir, 'static'), path.join(outDir, 'static'), {
    overwrite: true,
  }),
])

const outPath = path.join(outDir, 'index.html')
await ensureFile(outPath)
await Deno.writeTextFile(outPath, html)
