import AWS from "aws-sdk";

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "eu-north-1",
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "synchro-cv";

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export class S3Service {
  /**
   * Upload a file to S3 with organized path structure
   * @param file - File buffer to upload
   * @param fileName - Original file name
   * @param jobId - Job ID for organization
   * @param resumeId - Resume ID for unique identification
   * @returns Upload result with S3 URL
   */
  static async uploadResume(
    file: Buffer,
    fileName: string,
    jobId: string,
    resumeId: string
  ): Promise<UploadResult> {
    try {
      // Get file extension
      const fileExtension = fileName.split(".").pop()?.toLowerCase() || "pdf";

      // Create organized path: synchro-hire/cv-sorting/jobId/resumeId.extension
      const key = `synchro-hire/cv-sorting/${jobId}/${resumeId}.${fileExtension}`;

      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: this.getContentType(fileExtension),
      };

      const result = await s3.upload(uploadParams).promise();

      // Return the S3 key instead of presigned URL to avoid expiration issues
      return {
        success: true,
        url: result.Location, // Use S3 location for reference
        key: result.Key, // Store this key in database for generating fresh presigned URLs
      };
    } catch (error) {
      console.error("S3 Upload Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown upload error",
      };
    }
  }

  /**
   * Upload multiple files to S3
   * @param files - Array of files with metadata
   * @param jobId - Job ID for organization
   * @returns Array of upload results
   */
  static async uploadMultipleResumes(
    files: Array<{ buffer: Buffer; fileName: string; resumeId: string }>,
    jobId: string
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map(({ buffer, fileName, resumeId }) =>
      this.uploadResume(buffer, fileName, jobId, resumeId)
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Delete a file from S3
   * @param key - S3 object key
   * @returns Deletion result
   */
  static async deleteResume(
    key: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await s3
        .deleteObject({
          Bucket: BUCKET_NAME,
          Key: key,
        })
        .promise();

      return { success: true };
    } catch (error) {
      console.error("S3 Delete Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown delete error",
      };
    }
  }

  /**
   * Generate a presigned URL for temporary access
   * @param key - S3 object key
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns Presigned URL
   */
  static async getPresignedUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      return s3.getSignedUrl("getObject", {
        Bucket: BUCKET_NAME,
        Key: key,
        Expires: expiresIn,
      });
    } catch (error) {
      console.error("Presigned URL Error:", error);
      throw error;
    }
  }

  /**
   * Get content type based on file extension
   * @param extension - File extension
   * @returns MIME type
   */
  private static getContentType(extension: string): string {
    const contentTypes: { [key: string]: string } = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      txt: "text/plain",
      rtf: "application/rtf",
    };

    return contentTypes[extension] || "application/octet-stream";
  }

  /**
   * List files in a specific job directory
   * @param jobId - Job ID
   * @returns List of files
   */
  static async listJobResumes(jobId: string): Promise<AWS.S3.Object[]> {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Prefix: `synchro-hire/cv-sorting/${jobId}/`,
      };

      const result = await s3.listObjectsV2(params).promise();
      return result.Contents || [];
    } catch (error) {
      console.error("S3 List Error:", error);
      return [];
    }
  }

  /**
   * Get file metadata
   * @param key - S3 object key
   * @returns File metadata
   */
  static async getFileMetadata(
    key: string
  ): Promise<AWS.S3.HeadObjectOutput | null> {
    try {
      return await s3
        .headObject({
          Bucket: BUCKET_NAME,
          Key: key,
        })
        .promise();
    } catch (error) {
      console.error("S3 Metadata Error:", error);
      return null;
    }
  }
}

export default S3Service;
