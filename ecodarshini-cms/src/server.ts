// import express from 'express'
// import payload from 'payload'
// import dotenv from 'dotenv'

// dotenv.config()

// const app = express()
// const PORT = process.env.PORT || 3001

// const start = async () => {
//   await payload.init({
//     secret: process.env.PAYLOAD_SECRET || 'default-secret',
//     express: app,
//     onInit: () => {
//       payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`)
//     },
//   })

//   app.listen(PORT, () => {
//     console.log(`
//     =============================================
//     Ecodarshini CMS is running!

//     Admin Panel: http://localhost:${PORT}/admin
//     API:         http://localhost:${PORT}/api
//     Media API:   http://localhost:${PORT}/api/media
//     =============================================
//     `)
//   })
// }

// start()

import express from 'express'
import payload from 'payload'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

const start = async () => {
  await payload.init({
    secret: process.env.PAYLOAD_SECRET || 'default-secret',
    express: app,
    onInit: () => {
      const adminURL = process.env.PAYLOAD_ADMIN_URL || `http://localhost:${PORT}/admin`;
      payload.logger.info(`Payload Admin URL: ${adminURL}`)
    },
  })

  app.listen(PORT, () => {
    const adminURL = process.env.PAYLOAD_ADMIN_URL || `http://localhost:${PORT}/admin`;
    console.log(`
    =============================================
    Ecodarshini CMS is running!

    Admin Panel: ${adminURL}
    API:         /api
    Media API:   /api/media
    =============================================
    `)
  })
}

start()
