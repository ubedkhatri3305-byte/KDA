import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('cloudinary.cloudName'),
      api_key: this.configService.get('cloudinary.apiKey'),
      api_secret: this.configService.get('cloudinary.apiSecret'),
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadApiResponse> {
    const cloudName = this.configService.get('cloudinary.cloudName');
    if (!cloudName || cloudName === 'your-cloud-name') {
      return {
        secure_url: 'https://via.placeholder.com/800x1000?text=Mock+Image',
        public_id: 'mock_id',
      } as UploadApiResponse;
    }

    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: `kda/${folder}`,
          resource_type: 'auto',
          quality: 'auto',
          fetch_format: 'auto',
          transformation: [{ width: 1200, crop: 'limit' }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!);
        },
      );
      upload.end(file.buffer);
    });
  }

  async uploadBuffer(
    buffer: Buffer,
    folder: string,
    format: string = 'jpg',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { folder: `kda/${folder}`, format, quality: 'auto' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!);
        },
      );
      upload.end(buffer);
    });
  }

  async uploadFromUrl(url: string, folder: string): Promise<UploadApiResponse> {
    return cloudinary.uploader.upload(url, {
      folder: `kda/${folder}`,
      quality: 'auto',
      fetch_format: 'auto',
    });
  }

  async deleteFile(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }

  getOptimizedUrl(publicId: string, width?: number, height?: number): string {
    return cloudinary.url(publicId, {
      quality: 'auto',
      fetch_format: 'auto',
      ...(width && { width }),
      ...(height && { height }),
      crop: 'fill',
    });
  }
}
