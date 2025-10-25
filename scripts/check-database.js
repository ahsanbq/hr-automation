/**
 * Database connectivity check script
 * Run this to check if the database is accessible
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Check database connectivity
 */
async function checkDatabase() {
  console.log("🔍 Checking database connectivity...");
  console.log("   Database: 153.92.223.64:5432");
  console.log("   Database: recruitment_management");

  try {
    // Simple query to test connectivity
    const result = await prisma.$queryRaw`SELECT 1 as test`;

    if (result && result[0] && result[0].test === 1) {
      console.log("✅ Database is accessible!");
      return true;
    } else {
      console.log("❌ Database returned unexpected result");
      return false;
    }
  } catch (error) {
    console.log("❌ Database is not accessible:");
    console.log(`   Error: ${error.message}`);

    if (error.code === "P1001") {
      console.log(
        "   💡 This is a connection error. The database server may be down."
      );
    } else if (error.code === "P1008") {
      console.log(
        "   💡 This is a timeout error. The database may be slow to respond."
      );
    } else {
      console.log(`   💡 Error code: ${error.code}`);
    }

    return false;
  }
}

/**
 * Check if migration is needed
 */
async function checkMigrationStatus() {
  console.log("\n🔍 Checking migration status...");

  try {
    // Check if s3Key column exists
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Resume' AND column_name = 's3Key'
    `;

    if (result.length > 0) {
      console.log("✅ s3Key column exists - schema migration completed");

      // Check data migration status
      const stats = await prisma.resume.aggregate({
        _count: {
          id: true,
          s3Key: true,
        },
      });

      const totalResumes = stats._count.id;
      const resumesWithS3Key = stats._count.s3Key;

      console.log(`📊 Data migration status:`);
      console.log(`   Total resumes: ${totalResumes}`);
      console.log(`   With S3 key: ${resumesWithS3Key}`);
      console.log(
        `   Migration progress: ${
          totalResumes > 0
            ? Math.round((resumesWithS3Key / totalResumes) * 100)
            : 0
        }%`
      );

      if (resumesWithS3Key > 0) {
        console.log("✅ Data migration has been started");
      } else {
        console.log("⚠️  Data migration not yet run");
      }
    } else {
      console.log("⚠️  s3Key column not found - schema migration needed");
      console.log("   Run: npx prisma migrate dev --name add_s3_key_to_resume");
    }
  } catch (error) {
    console.log("❌ Could not check migration status:", error.message);
  }
}

/**
 * Main check function
 */
async function runCheck() {
  console.log("🔍 S3 Presigned URL Migration - Database Status Check\n");

  const isConnected = await checkDatabase();

  if (isConnected) {
    await checkMigrationStatus();
    console.log("\n✅ Database is ready for migration!");
    console.log("\n📋 Next steps:");
    console.log(
      "   1. Run schema migration: npx prisma migrate dev --name add_s3_key_to_resume"
    );
    console.log(
      "   2. Run data migration: node scripts/migrate-resume-urls.js"
    );
    console.log("   3. Test migration: node scripts/test-migration.js");
  } else {
    console.log("\n❌ Database is not accessible");
    console.log("\n💡 Please check:");
    console.log("   - Database server is running");
    console.log("   - Network connectivity to 153.92.223.64:5432");
    console.log("   - Database credentials are correct");
    console.log("   - Firewall settings allow the connection");
  }
}

// Run check if called directly
if (require.main === module) {
  runCheck()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Check failed:", error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

module.exports = { checkDatabase, checkMigrationStatus, runCheck };
