import { copy, ensureFile } from 'https://deno.land/std@0.201.0/fs/mod.ts'
import * as path from 'https://deno.land/std@0.201.0/path/mod.ts'
import postCSS from 'https://deno.land/x/postcss@8.4.16/mod.js'
import postcssPresetEnv from 'npm:postcss-preset-env@9.1.3'

const dir = 'web'
const outDir = 'dist'

// @ts-expect-error idk...
const postCSSInstance = postCSS([postcssPresetEnv({ preserve: true })])

const html = await Deno.readTextFile(path.join(dir, 'index.html'))

const allAssetPaths = html.matchAll(/"[\/.]*assets\/(.+)"/g)

const transpileAssets = () => {
  return [...allAssetPaths].map(async ([, assetPath]) => {
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

    const outPath = path.join(outDir, 'assets', assetPath)
    await ensureFile(outPath)
    await Deno.writeFile(outPath, code)

    console.log(`Transpiled asset ${assetPath}`)
  })
}

const copyStatic = async () => {
  await Promise.all(
    ['index.html', 'static'].map((input) =>
      copy(path.join(dir, input), path.join(outDir, input), {
        overwrite: true,
      })
    ),
  )
  console.log('Copied static files')
}

await Promise.all([...transpileAssets(), copyStatic()])
