import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService {
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private isS3Enabled: boolean = false;

  constructor(private configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID')?.trim();
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY')?.trim();
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET')?.trim() || '';

    if (accessKeyId && secretAccessKey && this.bucketName) {
      console.log(`[StorageService] S3 enabled. Bucket: ${this.bucketName}, Region: ${this.configService.get('AWS_REGION')}, KeyId: ${accessKeyId.substring(0, 8)}...`);
      this.s3Client = new S3Client({
        region: this.configService.get<string>('AWS_REGION') || 'ap-southeast-1',
        credentials: { accessKeyId, secretAccessKey },
      });
      this.isS3Enabled = true;
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'general'): Promise<{ url: string; key: string }> {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const key = `${folder}/${fileName}`;

    if (this.isS3Enabled && this.s3Client) {
      try {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
          }),
        );
        const url = `https://${this.bucketName}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${key}`;
        return { url, key };
      } catch (err) {
        console.error(`[StorageService] S3 Upload failed, falling back to local storage:`, err);
      }
    }

    // Local Storage Fallback
      const uploadDir = path.join(process.cwd(), 'uploads', folder);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, file.buffer);

      // Verify the file was actually written to disk
      if (!fs.existsSync(filePath)) {
        throw new Error(`File gagal disimpan ke disk: ${filePath}`);
      }
      const writtenSize = fs.statSync(filePath).size;
      if (writtenSize === 0) {
        fs.unlinkSync(filePath);
        throw new Error(`File ditulis tapi kosong (0 bytes): ${filePath}`);
      }

      console.log(`[StorageService] File saved: ${filePath} (${writtenSize} bytes)`);
      const url = `http://localhost:3001/uploads/${folder}/${fileName}`;
      return { url, key };
    }

  async getPresignedUrl(key: string): Promise<string> {
    if (!this.isS3Enabled || !this.s3Client) {
      // If local storage, return the direct local URL (simplification)
      return `http://localhost:3001/uploads/${key}`;
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }
}
