import { assert } from 'https://deno.land/std@0.201.0/assert/assert.ts'
import { AssertionError } from 'https://deno.land/std@0.201.0/assert/assertion_error.ts'
import { contentType } from 'https://deno.land/std@0.201.0/media_types/mod.ts'
import * as path from 'https://deno.land/std@0.201.0/path/mod.ts'
import { router } from 'https://deno.land/x/rutt@0.2.0/mod.ts'
import { createQuoteImage } from './image.ts'

const webDir = Deno.args.includes('prod') ? 'dist' : 'web'
console.log(`Web Directory: ${webDir}`)

const indexPage = await Deno.readFile(path.join(webDir, 'index.html'))

const handler = router({
  '/': () => {
    return new Response(indexPage, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  },

  '/image': async (request) => {
    try {
      const data = await request.formData()

      const [image, quote, author, yearOfBirth, yearOfDeath] = [
        'image',
        'quote',
        'author',
        'year-of-birth',
        'year-of-death',
      ]
        .map((name) => data.get(name))
        .map((data) => typeof data === 'string' ? data.trim() : data)

      assert(image instanceof File)
      assert(typeof quote === 'string')
      assert(typeof author === 'string')
      assert(typeof yearOfBirth === 'string')
      assert(typeof yearOfDeath === 'string')

      const quoteImage = await createQuoteImage({
        image,
        quote: `" ${quote} "`,
        author,
        yearOfBirth,
        yearOfDeath,
      })
      return new Response(quoteImage, {
        headers: { 'content-type': 'image/png' },
      })
    } catch (error) {
      if (error instanceof AssertionError) {
        return new Response(null, { status: 400 })
      }

      throw error
    }
  },

  '*': async (_request, _info, matches) => {
    const assetPath = path.join(webDir, matches[0])

    try {
      const content = await Deno.readFile(assetPath)

      return new Response(content, {
        headers: { 'content-type': contentType(path.extname(assetPath))! },
      })
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return new Response(null, { status: 404 })
      }

      throw error
    }
  },
})

Deno.serve(handler)
