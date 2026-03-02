import { createUploadthing, type FileRouter } from 'uploadthing/next'

const f = createUploadthing()

export const ourFileRouter = {
  pickupAttachment: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 3
    },
    'application/vnd.ms-excel': {
      maxFileSize: '4MB',
      maxFileCount: 3
    },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
      maxFileSize: '4MB',
      maxFileCount: 3
    }
  })
    .middleware(async () => {
      // No auth required here
      // Auth is handled by our own login system
      return {}
    })
    .onUploadComplete(async ({ file }) => {
      console.log('✅ Upload complete:', file.name, file.url)
      return {
        url: file.url,
        name: file.name
      }
    })
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
