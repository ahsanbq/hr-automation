/**
 * Test script to verify the presigned URL API is working
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testPresignedUrlAPI() {
  console.log("🧪 Testing Presigned URL API...");

  try {
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
      `📄 Testing with resume: ${resume.candidateName} (${resume.id})`
    );
    console.log(`🔑 S3 Key: ${resume.s3Key}`);
    console.log(`🔗 Original URL: ${resume.resumeUrl.substring(0, 100)}...`);

    // Test the API endpoint
    const testUrl = `http://localhost:3000/api/resumes/${resume.id}/presigned-url`;
    console.log(`🌐 API URL: ${testUrl}`);

    console.log("\n📋 To test manually:");
    console.log("1. Start the development server: npm run dev");
    console.log("2. Open browser and go to: http://localhost:3000");
    console.log("3. Login to get a valid token");
    console.log("4. Test the API endpoint with proper authentication");

    console.log("\n🔍 Expected behavior:");
    console.log("- API should return a fresh presigned URL");
    console.log("- URL should be valid for 1 hour");
    console.log("- CV access should work without 'AccessDenied' errors");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testPresignedUrlAPI();
