/**
 * Migration script to extract S3 keys from existing presigned URLs
 * This script helps migrate existing resume URLs that contain presigned URLs
 * to use the new S3 key-based system.
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Extract S3 key from a presigned URL
 * @param {string} url - Presigned URL
 * @returns {string|null} - S3 key or null if not found
 */
function extractS3KeyFromUrl(url) {
  try {
    // Parse the URL
    const urlObj = new URL(url);

    // Check if it's an S3 URL
    if (
      urlObj.hostname.includes("amazonaws.com") ||
      urlObj.hostname.includes("s3.")
    ) {
      // Extract the key from the path
      const pathParts = urlObj.pathname.split("/");
      if (pathParts.length > 1) {
        // Remove the leading slash and get the rest as the key
        return pathParts.slice(1).join("/");
      }
    }

    // Check if it's a direct S3 URL with bucket in hostname
    if (urlObj.hostname.includes(".s3.") || urlObj.hostname.includes(".s3-")) {
      const bucketName = urlObj.hostname.split(".")[0];
      const key = urlObj.pathname.substring(1); // Remove leading slash
      return key;
    }

    return null;
  } catch (error) {
    console.error("Error parsing URL:", url, error);
    return null;
  }
}

/**
 * Check if a URL is a presigned URL (has AWS signature parameters)
 * @param {string} url - URL to check
 * @returns {boolean} - True if it's a presigned URL
 */
function isPresignedUrl(url) {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.searchParams.has("X-Amz-Signature") ||
      urlObj.searchParams.has("AWSAccessKeyId") ||
      urlObj.searchParams.has("X-Amz-Algorithm")
    );
  } catch (error) {
    return false;
  }
}

/**
 * Main migration function
 */
async function migrateResumeUrls() {
  console.log("🔄 Starting resume URL migration...");

  try {
    // Get all resumes
    const resumes = await prisma.resume.findMany({
      select: {
        id: true,
        resumeUrl: true,
        s3Key: true,
        candidateName: true,
      },
    });

    console.log(`📊 Found ${resumes.length} resumes to process`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const resume of resumes) {
      try {
        // Skip if already has S3 key
        if (resume.s3Key) {
          console.log(
            `⏭️  Skipping ${resume.candidateName} (${resume.id}) - already has S3 key`
          );
          skipped++;
          continue;
        }

        // Check if URL is a presigned URL
        if (!isPresignedUrl(resume.resumeUrl)) {
          console.log(
            `⏭️  Skipping ${resume.candidateName} (${resume.id}) - not a presigned URL`
          );
          skipped++;
          continue;
        }

        // Extract S3 key from URL
        const s3Key = extractS3KeyFromUrl(resume.resumeUrl);

        if (s3Key) {
          // Update the resume with the S3 key
          await prisma.resume.update({
            where: { id: resume.id },
            data: { s3Key: s3Key },
          });

          console.log(
            `✅ Migrated ${resume.candidateName} (${resume.id}) - S3 key: ${s3Key}`
          );
          migrated++;
        } else {
          console.log(
            `❌ Could not extract S3 key from ${resume.candidateName} (${resume.id}) - URL: ${resume.resumeUrl}`
          );
          errors++;
        }
      } catch (error) {
        console.error(
          `❌ Error processing ${resume.candidateName} (${resume.id}):`,
          error
        );
        errors++;
      }
    }

    console.log("\n📈 Migration Summary:");
    console.log(`✅ Successfully migrated: ${migrated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total processed: ${resumes.length}`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateResumeUrls()
    .then(() => {
      console.log("🎉 Migration completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration failed:", error);
      process.exit(1);
    });
}

module.exports = { migrateResumeUrls, extractS3KeyFromUrl, isPresignedUrl };
