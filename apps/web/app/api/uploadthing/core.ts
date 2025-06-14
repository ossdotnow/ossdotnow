import { createUploadthing, type FileRouter } from 'uploadthing/next';

const f = createUploadthing();

export const ourFileRouter: FileRouter = {
  imageUploader: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 1,
    },
  }).onUploadComplete(async ({ file }) => {
    console.log('file url', file.ufsUrl);

    return {
      url: file.ufsUrl,
    };
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
