import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export const uploadsDirectory = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(uploadsDirectory, { recursive: true });

const extensions: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadsDirectory),
    filename: (_req, file, callback) => callback(null, `${randomUUID()}${extensions[file.mimetype] || ''}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!extensions[file.mimetype]) return callback(new Error('รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP'));
    callback(null, true);
  },
});

export function handleImageUpload(req: Request, res: Response, next: NextFunction): void {
  imageUpload.single('image')(req, res, (error: any) => {
    if (error) {
      res.status(400).json({
        success: false,
        message: error.code === 'LIMIT_FILE_SIZE' ? 'ไฟล์ภาพต้องมีขนาดไม่เกิน 5 MB' : error.message,
      });
      return;
    }
    if (!req.file) {
      next();
      return;
    }
    void fsPromises.readFile(req.file.path).then(async (contents) => {
      const isJpeg = contents.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
      const isPng = contents.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
      const isWebp = contents.toString('ascii', 0, 4) === 'RIFF' && contents.toString('ascii', 8, 12) === 'WEBP';
      const valid = (req.file!.mimetype === 'image/jpeg' && isJpeg) ||
        (req.file!.mimetype === 'image/png' && isPng) ||
        (req.file!.mimetype === 'image/webp' && isWebp);
      if (!valid) {
        await fsPromises.unlink(req.file!.path);
        res.status(400).json({ success: false, message: 'เนื้อหาไฟล์ไม่ใช่ภาพ JPG, PNG หรือ WEBP ที่ถูกต้อง' });
        return;
      }
      next();
    }).catch(next);
  });
}
