import multer from 'multer';
import path from 'path';
import type { Request } from 'express';

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

/**
 * Multer middleware for handling multipart/form-data (file uploads).
 * Usage: upload.single("photo") for single file upload with field name "photo".
 */
export const upload = multer({ storage });

export function getPublicUrl(req: Request, relativePath: string): string {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}${relativePath}`;
}

export function handleFileUpload(req: Request, file: MulterFile) {
  const relativeUrl = `/uploads/${file.filename}`;
  const publicUrl = getPublicUrl(req, relativeUrl);
  return {
    relativeUrl,
    publicUrl,
  };
}