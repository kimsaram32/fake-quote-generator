import {
  createCanvas,
  Image,
  loadImage,
} from 'https://deno.land/x/canvas@v1.4.1/mod.ts'

const canvasWidth = 1000
const canvasHeight = 600

const font = await Deno.readFile('./web/static/noto-serif-kr-400.woff2')

const createBackgroundCanvas = () => {
  const canvas = createCanvas(canvasWidth, canvasHeight)
  const ctx = canvas.getContext('2d')

  const background = ctx.createLinearGradient(0, 0, canvasWidth, 0)
  background.addColorStop(0.1, '#111')
  background.addColorStop(1, '#222')

  ctx.fillStyle = background
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  return canvas
}

const createImageCanvas = (image: Image) => {
  const imageMargin = 30
  const imageWidth = 450
  const imageHeight = canvasHeight - imageMargin * 2

  const canvas = createCanvas(imageWidth, imageHeight)
  const ctx = canvas.getContext('2d')

  // mask image
  const imageMask = ctx.createLinearGradient(0, 0, imageWidth, 0)
  imageMask.addColorStop(0, '#000')
  imageMask.addColorStop(1, 'transparent')

  ctx.fillStyle = imageMask
  ctx.fillRect(0, 0, imageWidth, imageHeight)
  ctx.fillStyle = ''

  // image
  ctx.globalCompositeOperation = 'source-in'
  ctx.drawImage(
    image,
    0,
    0,
    image.width() / image.height() * imageHeight,
    imageHeight,
  )
  ctx.globalCompositeOperation = 'source-over'

  return canvas
}

const backgroundCanvas = createBackgroundCanvas()

type Options = {
  image: File
  quote: string
  author: string
  yearOfBirth: string
  yearOfDeath: string
}

export const createQuoteImage = async (options: Options) => {
  const { image, quote, author, yearOfBirth, yearOfDeath } = options

  const canvas = createCanvas(canvasWidth, canvasHeight)
  canvas.loadFont(font, { family: 'font' })
  const ctx = canvas.getContext('2d')

  ctx.filter = 'grayscale(100%)'

  // background
  ctx.drawImage(backgroundCanvas, 0, 0, canvasWidth, canvasHeight)

  // image
  const imageMargin = 30

  const loadedImage = await loadImage(new Uint8Array(await image.arrayBuffer()))
  const imageCanvas = createImageCanvas(loadedImage)
  ctx.drawImage(imageCanvas, imageMargin, imageMargin)

  // text
  const textOffset = { x: 450, y: 150 }

  ctx.font = `${Math.min(40, 28 + 120 / quote.length)}px font`
  ctx.fillStyle = '#eee'

  const finalLines = []
  for (const withLineBreak of quote.split(/\r\n|\r|\n/)) {
    let lines: string[] = ['']

    for (const word of withLineBreak.split(' ')) {
      const lastLine = lines.at(-1)!
      const content = word.concat(' ')

      if (
        ctx.measureText(lastLine.concat(content)).width >=
          canvasWidth - textOffset.x + 50
      ) {
        lines.push(content)
        continue
      }

      lines = lines.with(-1, lastLine.concat(content))
    }

    finalLines.push(...lines)
  }

  // quote
  for (const [index, line] of finalLines.entries()) {
    ctx.fillText(line, textOffset.x, textOffset.y + index * 60)
  }

  // author info
  ctx.font = '30px font'
  ctx.fillStyle = '#aaa'

  const yearsInfo = yearOfBirth && yearOfDeath
    ? `(${yearOfBirth} ~ ${yearOfDeath})`
    : ''

  const fullAuthorText = `- ${author} ${yearsInfo}`

  const authorTextWidth =
    ctx.measureText(author + yearOfBirth + yearOfDeath).width

  ctx.fillText(fullAuthorText, 900 - authorTextWidth, 480)

  return canvas.toBuffer('image/png')
}
