/**
 * Debug script to test presigned URL generation
 */

const { PrismaClient } = require("@prisma/client");
const AWS = require("aws-sdk");

const prisma = new PrismaClient();

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "eu-north-1",
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "synchro-cv";

async function debugPresignedUrl() {
  console.log("🔍 Debugging Presigned URL Generation...");

  try {
    // Check environment variables
    console.log("\n📋 Environment Check:");
    console.log(
      `AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? "Set" : "Not set"}`
    );
    console.log(
      `AWS_SECRET_ACCESS_KEY: ${
        process.env.AWS_SECRET_ACCESS_KEY ? "Set" : "Not set"
      }`
    );
    console.log(`AWS_REGION: ${process.env.AWS_REGION || "eu-north-1"}`);
    console.log(
      `S3_BUCKET_NAME: ${process.env.S3_BUCKET_NAME || "synchro-cv"}`
    );

    // Get a resume with S3 key
    const resume = await prisma.resume.findFirst({
      where: { s3Key: { not: null } },
      select: {
        id: true,
        candidateName: true,
        s3Key: true,
        resumeUrl: true,
      },
    });

    if (!resume) {
      console.log("❌ No resume with S3 key found");
      return;
    }

    console.log(
      `\n📄 Testing with resume: ${resume.candidateName} (${resume.id})`
    );
    console.log(`🔑 S3 Key: ${resume.s3Key}`);

    // Test S3 connectivity
    console.log("\n🔗 Testing S3 connectivity...");
    try {
      await s3.headBucket({ Bucket: BUCKET_NAME }).promise();
      console.log("✅ S3 bucket is accessible");
    } catch (error) {
      console.log("❌ S3 bucket access failed:", error.message);
      return;
    }

    // Test presigned URL generation
    console.log("\n🔐 Testing presigned URL generation...");
    try {
      const presignedUrl = s3.getSignedUrl("getObject", {
        Bucket: BUCKET_NAME,
        Key: resume.s3Key,
        Expires: 3600, // 1 hour
      });

      console.log("✅ Presigned URL generated successfully");
      console.log(`🔗 URL: ${presignedUrl.substring(0, 100)}...`);

      // Test if the URL is accessible
      console.log("\n🌐 Testing URL accessibility...");
      try {
        const response = await fetch(presignedUrl, { method: "HEAD" });
        if (response.ok) {
          console.log("✅ Presigned URL is accessible");
        } else {
          console.log(`❌ Presigned URL returned status: ${response.status}`);
        }
      } catch (fetchError) {
        console.log("❌ Failed to test URL accessibility:", fetchError.message);
      }
    } catch (error) {
      console.log("❌ Presigned URL generation failed:", error.message);
    }
  } catch (error) {
    console.error("❌ Debug failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPresignedUrl();
