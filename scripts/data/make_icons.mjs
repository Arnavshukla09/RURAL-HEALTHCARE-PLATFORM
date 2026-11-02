import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')

async function run() {
  const iconsDir = path.join(root, 'public', 'icons')
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true })
  }

  const srcIcon = fs.existsSync(path.join(root, 'public', 'icon-512x512.png'))
    ? path.join(root, 'public', 'icon-512x512.png')
    : fs.existsSync(path.join(iconsDir, 'icon-512.png'))
    ? path.join(iconsDir, 'icon-512.png')
    : path.join(root, 'public', 'icon.svg')
  const srcHero = path.join(root, 'public', 'hero.png')

  console.log('Generating PWA icons from:', srcIcon)

  // 1. icon-192.png
  await sharp(srcIcon)
    .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(iconsDir, 'icon-192.png'))
  console.log('✓ Created public/icons/icon-192.png')

  // 2. icon-512.png
  await sharp(srcIcon)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(iconsDir, 'icon-512.png'))
  console.log('✓ Created public/icons/icon-512.png')

  // 3. maskable-192.png (80% safe zone = ~154px centered on 192x192 canvas)
  const inner192 = await sharp(srcIcon)
    .resize(154, 154, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toBuffer()

  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite([{ input: inner192, gravity: 'center' }])
    .png()
    .toFile(path.join(iconsDir, 'maskable-192.png'))
  console.log('✓ Created public/icons/maskable-192.png')

  // 4. maskable-512.png (80% safe zone = ~410px centered on 512x512 canvas)
  const inner512 = await sharp(srcIcon)
    .resize(410, 410, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toBuffer()

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite([{ input: inner512, gravity: 'center' }])
    .png()
    .toFile(path.join(iconsDir, 'maskable-512.png'))
  console.log('✓ Created public/icons/maskable-512.png')

  // 5. apple-touch-icon.png (180x180)
  await sharp(srcIcon)
    .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(root, 'public', 'apple-touch-icon.png'))
  console.log('✓ Created public/apple-touch-icon.png')

  // 6. hero.webp (max 1200px, quality ~75)
  if (fs.existsSync(srcHero)) {
    await sharp(srcHero)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toFile(path.join(root, 'public', 'hero.webp'))
    console.log('✓ Created public/hero.webp')
  }

  console.log('All icons and hero.webp generated successfully!')
}

run().catch((err) => {
  console.error('Error generating icons:', err)
  process.exit(1)
})
