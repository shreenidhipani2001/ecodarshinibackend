import { buildConfig } from 'payload/config'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { slateEditor } from '@payloadcms/richtext-slate'
import { webpackBundler } from '@payloadcms/bundler-webpack'
import path from 'path'

// Media Collection - for product images
const Media = {
  slug: 'media',
  access: {
    read: () => true,
  },
  upload: {
    staticDir: path.resolve(__dirname, '../media'),
    imageSizes: [
      { name: 'thumbnail', width: 150, height: 150, position: 'centre' as const },
      { name: 'card', width: 400, height: 400, position: 'centre' as const },
      { name: 'full', width: 800, height: 800, position: 'centre' as const },
    ],
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
  },
  fields: [
    { name: 'alt', type: 'text' as const, required: true, label: 'Alt Text' },
    { name: 'productSlug', type: 'text' as const, label: 'Product Slug' },
  ],
}

// Users Collection - for admin access
const Users = {
  slug: 'users',
  auth: true,
  admin: { useAsTitle: 'email' },
  fields: [{ name: 'name', type: 'text' as const }],
}

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3001',
  admin: {
    user: 'users',
    bundler: webpackBundler(),
  },
  editor: slateEditor({}),
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  collections: [Users, Media],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  cors: ['http://localhost:3000', 'http://localhost:5000', 'http://localhost:5173'],
})
