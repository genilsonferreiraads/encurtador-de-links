import sharp from 'sharp';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateFavicons() {
  const inputPng = join(__dirname, '../public/icons/link.png');
  const outputDir = join(__dirname, '../public');

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Define sizes to generate
  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 }
  ];

  // Generate each size
  for (const { name, size } of sizes) {
    try {
      await sharp(inputPng)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(join(outputDir, name));
      
      console.log(`Generated ${name}`);
    } catch (error) {
      console.error(`Error generating ${name}:`, error);
    }
  }

  // Copiar o arquivo .ico original para a pasta public
  try {
    await fs.copyFile(
      join(__dirname, '../public/icons/link.ico'),
      join(outputDir, 'favicon.ico')
    );
    console.log('Copied favicon.ico');
  } catch (error) {
    console.error('Error copying favicon.ico:', error);
  }

  console.log('All favicons generated successfully!');
}

generateFavicons().catch(console.error); 
