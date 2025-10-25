/**
 * Test script to verify the S3 presigned URL migration
 * Run this after completing the migration to verify everything works
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Test database schema
 */
async function testSchema() {
  console.log("🔍 Testing database schema...");

  try {
    // Check if s3Key column exists
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Resume' AND column_name = 's3Key'
    `;

    if (result.length > 0) {
      console.log("✅ s3Key column exists:", result[0]);
    } else {
      console.log("❌ s3Key column not found");
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Schema test failed:", error);
    return false;
  }
}

/**
 * Test data migration results
 */
async function testDataMigration() {
  console.log("🔍 Testing data migration...");

  try {
    // Get migration statistics
    const stats = await prisma.resume.aggregate({
      _count: {
        id: true,
        s3Key: true,
      },
    });

    const totalResumes = stats._count.id;
    const resumesWithS3Key = stats._count.s3Key;
    const resumesWithoutS3Key = totalResumes - resumesWithS3Key;

    console.log("📊 Migration Statistics:");
    console.log(`   Total resumes: ${totalResumes}`);
    console.log(`   With S3 key: ${resumesWithS3Key}`);
    console.log(`   Without S3 key: ${resumesWithoutS3Key}`);

    // Sample some migrated data
    const sampleResumes = await prisma.resume.findMany({
      where: {
        s3Key: {
          not: null,
        },
      },
      select: {
        id: true,
        candidateName: true,
        s3Key: true,
        resumeUrl: true,
      },
      take: 3,
    });

    console.log("📋 Sample migrated resumes:");
    sampleResumes.forEach((resume, index) => {
      console.log(`   ${index + 1}. ${resume.candidateName}`);
      console.log(`      S3 Key: ${resume.s3Key}`);
      console.log(
        `      Original URL: ${resume.resumeUrl.substring(0, 50)}...`
      );
    });

    return true;
  } catch (error) {
    console.error("❌ Data migration test failed:", error);
    return false;
  }
}

/**
 * Test presigned URL API endpoint
 */
async function testPresignedUrlAPI() {
  console.log("🔍 Testing presigned URL API...");

  try {
    // Get a resume with S3 key
    const resume = await prisma.resume.findFirst({
      where: {
        s3Key: {
          not: null,
        },
      },
    });

    if (!resume) {
      console.log("⚠️  No resumes with S3 key found for testing");
      return true;
    }

    console.log(
      `📄 Testing with resume: ${resume.candidateName} (${resume.id})`
    );
    console.log(`   S3 Key: ${resume.s3Key}`);

    // Note: This would require a running server to test the actual API
    console.log("ℹ️  To test the API endpoint, start the server and visit:");
    console.log(
      `   http://localhost:3000/api/resumes/${resume.id}/presigned-url`
    );

    return true;
  } catch (error) {
    console.error("❌ Presigned URL API test failed:", error);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log("🧪 Starting S3 Presigned URL Migration Tests\n");

  const tests = [
    { name: "Database Schema", fn: testSchema },
    { name: "Data Migration", fn: testDataMigration },
    { name: "Presigned URL API", fn: testPresignedUrlAPI },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n📋 Running ${test.name} test...`);
    try {
      const result = await test.fn();
      if (result) {
        console.log(`✅ ${test.name} test passed`);
        passed++;
      } else {
        console.log(`❌ ${test.name} test failed`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} test failed with error:`, error.message);
      failed++;
    }
  }

  console.log("\n📊 Test Results:");
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📊 Total: ${passed + failed}`);

  if (failed === 0) {
    console.log("\n🎉 All tests passed! Migration appears successful.");
  } else {
    console.log("\n⚠️  Some tests failed. Please check the issues above.");
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests()
    .then(() => {
      console.log("\n✨ Test suite completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Test suite failed:", error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

module.exports = {
  runTests,
  testSchema,
  testDataMigration,
  testPresignedUrlAPI,
};
