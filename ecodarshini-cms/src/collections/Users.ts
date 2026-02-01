// import type { CollectionConfig } from 'payload'

// export const Users: CollectionConfig = {
//   slug: 'users',
//   auth: true, // Enables authentication
//   admin: {
//     useAsTitle: 'email',
//   },
//   fields: [
//     {
//       name: 'name',
//       type: 'text',
//     },
//   ],
// }



import type { CollectionConfig } from 'payload/types'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
  ],
}
