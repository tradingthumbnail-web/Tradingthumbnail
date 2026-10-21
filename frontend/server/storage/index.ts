import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

export interface S3StorageConfig {
	accessKeyId: string;
	secretAccessKey: string;
	region: string;
	bucket: string;
	endpoint?: string;
}

export class S3Storage {
	private client: S3Client;
	private bucket: string;

	constructor(config: S3StorageConfig) {
		this.client = new S3Client({
			region: config.region,
			credentials: {
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey,
			},
			...(config.endpoint
				? {
					endpoint: config.endpoint,
					forcePathStyle: true,
					// AWS SDK v3 default checksums break Cloudflare R2.
					requestChecksumCalculation: "WHEN_REQUIRED" as const,
					responseChecksumValidation: "WHEN_REQUIRED" as const,
				}
				: {}),
		});
		this.bucket = config.bucket;
	}

	/**
	 * Upload an object to S3
	 * @param key - The object key (path) in the bucket
	 * @param body - The data to upload (Buffer, string, or Uint8Array)
	 * @param contentType - Optional MIME type
	 */
	async put(key: string, body: Buffer | string | Uint8Array, contentType?: string): Promise<void> {
		await this.client.send(
			new PutObjectCommand({
				Bucket: this.bucket,
				Key: key,
				Body: body,
				ContentType: contentType,
			})
		);
	}

	/**
	 * Get an object from S3 as bytes
	 * @param key - The object key (path) in the bucket
	 * @returns Buffer containing the object data
	 */
	async get(key: string): Promise<Buffer> {
		const response = await this.client.send(
			new GetObjectCommand({
				Bucket: this.bucket,
				Key: key,
			})
		);

		if (!response.Body) {
			throw new Error(`Object not found: ${key}`);
		}

		return Buffer.from(await response.Body.transformToByteArray());
	}

	/**
	 * Delete an object from S3
	 * @param key - The object key (path) in the bucket
	 */
	async delete(key: string): Promise<void> {
		await this.client.send(
			new DeleteObjectCommand({
				Bucket: this.bucket,
				Key: key,
			})
		);
	}

	/**
	 * Delete all the files from a base path
	 * @param basePath - The base path to delete the files from
	 */
	async deleteAllFilesInFolder(basePath: string): Promise<void> {
		const list = await this.client.send(
			new ListObjectsV2Command({
				Bucket: this.bucket,
				Prefix: basePath,
			})
		);
		await Promise.all(list.Contents?.map((item) => this.delete(item.Key as string)) || []);
	}

    /**
     * Generate a presigned URL for an object
     * @param key - The object key (path) in the bucket
     * @param expiresIn - The number of seconds the URL will be valid for
     * @returns The presigned URL
     */
    async generatePresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        const url = await getSignedUrl(this.client, command, { expiresIn });
        return url;
    }

    async generatePresignedUploadUrl(key: string, contentType?: string, maxSizeBytes: number = 5 * 1024 * 1024, expiresIn: number = 600): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: contentType,
            ContentLength: maxSizeBytes,
        });
        const url = await getSignedUrl(this.client, command, { expiresIn });
        return url;
    }

    /**
     * List all the objects in a folder
     * @param folder - The folder to list the objects from
     * @returns The list of objects
     */
    async list(folder: string): Promise<string[]> {
        const command = new ListObjectsV2Command({
            Bucket: this.bucket,
            Prefix: folder,
        });
        const response = await this.client.send(command);
        return response.Contents?.map((item) => item.Key as string) || [];
    }
}

// Singleton instance with environment variables
const config = useRuntimeConfig();
if (!config.s3.accessKeyId || !config.s3.secretAccessKey || !config.s3.region || !config.s3.bucket) {
	throw new Error('-x- S3 configuration is missing');
} else {
    console.log(' |- S3 configuration on ✅')
}
export const storage = new S3Storage({
	accessKeyId: config.s3.accessKeyId || process.env.NUXT_S3_ACCESS_KEY_ID as string,
	secretAccessKey: config.s3.secretAccessKey || process.env.NUXT_S3_SECRET_ACCESS_KEY as string,
	region: config.s3.region || process.env.NUXT_S3_REGION as string,
	bucket: config.s3.bucket || process.env.NUXT_S3_BUCKET as string,
	endpoint: config.s3.endpoint || process.env.NUXT_S3_ENDPOINT as string | undefined,
});