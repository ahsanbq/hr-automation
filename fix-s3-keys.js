/**
 * Script to fix S3 keys that were incorrectly extracted
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Extract the correct S3 object key from a given S3 presigned URL.
 * @param {string} url - The S3 presigned URL.
 * @returns {string|null} The S3 object key or null if not an S3 URL or key cannot be extracted.
 */
function extractCorrectS3KeyFromUrl(url) {
  try {
    const urlObj = new URL(url);

    // Check if it's an S3 URL
    if (
      urlObj.hostname.includes("amazonaws.com") ||
      urlObj.hostname.includes("s3.")
    ) {
      // Extract the key from the path - keep everything after the first slash
      const pathParts = urlObj.pathname.split("/");
      if (pathParts.length > 1) {
        // Remove the leading slash and get the rest as the key
        return pathParts.slice(1).join("/");
      }
    }

    return null;
  } catch (error) {
    console.error("Error parsing URL:", url, error);
    return null;
  }
}

/**
 * Fix S3 keys for existing resumes
 */
async function fixS3Keys() {
  console.log("🔧 Fixing S3 Keys...");

  try {
    // Get all resumes with S3 keys
    const resumes = await prisma.resume.findMany({
      where: {
        s3Key: { not: null },
        resumeUrl: { contains: "amazonaws.com" },
      },
      select: {
        id: true,
        candidateName: true,
        s3Key: true,
        resumeUrl: true,
      },
    });

    console.log(`📊 Found ${resumes.length} resumes to fix`);

    let fixed = 0;
    let errors = 0;

    for (const resume of resumes) {
      try {
        // Extract the correct S3 key from the original URL
        const correctS3Key = extractCorrectS3KeyFromUrl(resume.resumeUrl);

        if (correctS3Key && correctS3Key !== resume.s3Key) {
          // Update the resume with the correct S3 key
          await prisma.resume.update({
            where: { id: resume.id },
            data: { s3Key: correctS3Key },
          });

          console.log(`✅ Fixed ${resume.candidateName} (${resume.id})`);
          console.log(`   Old key: ${resume.s3Key}`);
          console.log(`   New key: ${correctS3Key}`);
          fixed++;
        } else if (correctS3Key === resume.s3Key) {
          console.log(
            `⏭️  Skipping ${resume.candidateName} (${resume.id}) - already correct`
          );
        } else {
          console.log(
            `❌ Could not extract correct S3 key for ${resume.candidateName} (${resume.id})`
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

    console.log("\n📈 Fix Summary:");
    console.log(`✅ Successfully fixed: ${fixed}`);
    console.log(`⏭️  Already correct: ${resumes.length - fixed - errors}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total processed: ${resumes.length}`);
  } catch (error) {
    console.error("❌ Fix failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  fixS3Keys()
    .then(() => {
      console.log("🎉 S3 key fix completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 S3 key fix failed:", error);
      process.exit(1);
    });
}

module.exports = { fixS3Keys, extractCorrectS3KeyFromUrl };
