#!/usr/bin/env node

/**
 * Database Sequence Fix Script
 *
 * This script fixes PostgreSQL sequence values that may get out of sync
 * with the actual data in the database. This commonly happens when:
 * - Data is inserted manually
 * - Seeds are run multiple times
 * - Database migrations don't handle sequences properly
 *
 * Run this script whenever you encounter unique constraint errors
 * on auto-increment fields.
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function fixAllSequences() {
  try {
    console.log("🔧 Fixing all database sequences...");

    // Fix companies sequence
    const maxCompanyId = await prisma.$queryRaw`
      SELECT MAX(id) as max_id FROM companies;
    `;

    if (maxCompanyId[0].max_id) {
      await prisma.$executeRaw`
        SELECT setval('companies_id_seq', ${maxCompanyId[0].max_id});
      `;
      console.log("✅ Companies sequence reset to:", maxCompanyId[0].max_id);
    }

    // Fix users sequence
    const maxUserId = await prisma.$queryRaw`
      SELECT MAX(id) as max_id FROM "User";
    `;

    if (maxUserId[0].max_id) {
      await prisma.$executeRaw`
        SELECT setval('"User_id_seq"', ${maxUserId[0].max_id});
      `;
      console.log("✅ Users sequence reset to:", maxUserId[0].max_id);
    }

    // Fix other sequences if they exist
    const sequences = [
      "JobPost_id_seq",
      "Resume_id_seq",
      "Interview_id_seq",
      "Question_id_seq",
      "InterviewAttempt_id_seq",
      "Answer_id_seq",
      "ActivityLog_id_seq",
      "Recording_id_seq",
      "AssessmentStage_id_seq",
      "MCQAssessment_id_seq",
      "AvatarAssessment_id_seq",
      "ManualMeeting_id_seq",
      "MCQTemplate_id_seq",
      "MCQQuestion_id_seq",
      "MCQAnswer_id_seq",
      "AvatarRecording_id_seq",
      "CandidateInteraction_id_seq",
      "OfferLetter_id_seq",
      "SystemConfig_id_seq",
      "AuditLog_id_seq",
    ];

    for (const seqName of sequences) {
      try {
        const tableName = seqName.replace("_id_seq", "");
        const maxId = await prisma.$queryRaw`
          SELECT MAX(id) as max_id FROM "${tableName}";
        `;

        if (maxId[0] && maxId[0].max_id) {
          await prisma.$executeRaw`
            SELECT setval('${seqName}', ${maxId[0].max_id});
          `;
          console.log(`✅ ${seqName} reset to:`, maxId[0].max_id);
        }
      } catch (error) {
        // Table or sequence doesn't exist, skip
        console.log(`⏭️ Skipping ${seqName} (table/sequence not found)`);
      }
    }

    console.log("🎉 All sequences fixed successfully!");
  } catch (error) {
    console.error("❌ Error fixing sequences:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixAllSequences();
