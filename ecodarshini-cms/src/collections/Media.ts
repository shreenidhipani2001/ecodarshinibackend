// import type { CollectionConfig } from 'payload'

// export const Media: CollectionConfig = {
//   slug: 'media',
//   access: {
//     // Anyone can read/view images (public)
//     read: () => true,
//   },
//   upload: {
//     // Where uploaded files are stored
//     staticDir: '../media',

//     // Auto-generate different image sizes
//     imageSizes: [
//       {
//         name: 'thumbnail',
//         width: 150,
//         height: 150,
//         position: 'centre',
//       },
//       {
//         name: 'card',
//         width: 400,
//         height: 400,
//         position: 'centre',
//       },
//       {
//         name: 'full',
//         width: 800,
//         height: 800,
//         position: 'centre',
//       },
//     ],

//     // Allowed file types
//     mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
//   },

//   fields: [
//     {
//       name: 'alt',
//       type: 'text',
//       required: true,
//       label: 'Alt Text (for accessibility)',
//     },
//     {
//       name: 'productSlug',
//       type: 'text',
//       label: 'Product Slug (optional - helps identify which product)',
//       admin: {
//         description: 'Enter the product slug this image belongs to',
//       },
//     },
//   ],
// }



import type { CollectionConfig } from 'payload/types'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  upload: {
    staticDir: '../media',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 150,
        height: 150,
        position: 'centre',
      },
      {
        name: 'card',
        width: 400,
        height: 400,
        position: 'centre',
      },
      {
        name: 'full',
        width: 800,
        height: 800,
        position: 'centre',
      },
    ],
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Alt Text (for accessibility)',
    },
    {
      name: 'productSlug',
      type: 'text',
    },
  ],
}
