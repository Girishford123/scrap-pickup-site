import { createUploadthing, type FileRouter } from 'uploadthing/next'

const f = createUploadthing()

export const ourFileRouter = {
  pickupAttachment: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 3
    },
    blob: {
      maxFileSize: '4MB',
      maxFileCount: 3
    }
  })
    .middleware(async () => {
      return {}
    })
    .onUploadComplete(async ({ file }) => {
      console.log('✅ File uploaded:', file.name, file.url)
      return {
        url: file.url,
        name: file.name
      }
    })
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter