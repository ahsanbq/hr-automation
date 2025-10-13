-- CreateEnum
CREATE TYPE "public"."ExperienceLevel" AS ENUM ('ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE');

-- CreateEnum
CREATE TYPE "public"."InterviewType" AS ENUM ('TECHNICAL', 'BEHAVIORAL', 'EASY', 'COMPLEX', 'MEDIUM');

-- CreateEnum
CREATE TYPE "public"."JobType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE');

-- CreateEnum
CREATE TYPE "public"."MeetingStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "public"."MeetingType" AS ENUM ('TECHNICAL', 'BEHAVIORAL', 'SITUATIONAL');

-- CreateEnum
CREATE TYPE "public"."UserType" AS ENUM ('ADMIN', 'MANAGER', 'COMPANY_USER');

-- CreateEnum
CREATE TYPE "public"."InterviewStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."InterviewAttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'SUBMITTED', 'EXPIRED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "public"."QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'ESSAY', 'FILL_BLANK');

-- CreateEnum
CREATE TYPE "public"."LogSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."LogType" AS ENUM ('INTERVIEW_STARTED', 'INTERVIEW_COMPLETED', 'QUESTION_ANSWERED', 'TAB_SWITCH', 'FOCUS_LOST', 'WEBCAM_OFF', 'SCREEN_OFF', 'VIOLATION', 'RECORDING_STARTED', 'RECORDING_STOPPED');

-- CreateEnum
CREATE TYPE "public"."StageType" AS ENUM ('MCQ', 'AVATAR', 'MANUAL');

-- CreateEnum
CREATE TYPE "public"."StageStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "public"."MCQDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "public"."InteractionType" AS ENUM ('MEETING', 'AI_INTERVIEW', 'MCQ_EXAM');

-- CreateEnum
CREATE TYPE "public"."InteractionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."ApiLog" (
    "id" TEXT NOT NULL,
    "functionName" TEXT NOT NULL,
    "companyName" TEXT,
    "invokedTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GeneratedJobPost" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "aiModel" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobPostId" TEXT NOT NULL,
    "generatedById" INTEGER NOT NULL,

    CONSTRAINT "GeneratedJobPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobPost" (
    "id" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "experienceLevel" TEXT NOT NULL,
    "salaryRange" TEXT,
    "skillsRequired" TEXT NOT NULL,
    "jobDescription" TEXT,
    "keyResponsibilities" TEXT,
    "qualifications" TEXT,
    "benefits" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,

    CONSTRAINT "JobPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Resume" (
    "id" TEXT NOT NULL,
    "resumeUrl" TEXT NOT NULL,
    "matchScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobPostId" TEXT NOT NULL,
    "analysisTimestamp" TIMESTAMP(3),
    "candidateEmail" TEXT,
    "candidateName" TEXT NOT NULL,
    "candidatePhone" TEXT,
    "currentJobTitle" TEXT,
    "education" TEXT,
    "experienceYears" INTEGER,
    "fileName" TEXT,
    "fileSizeMb" DOUBLE PRECISION,
    "githubUrl" TEXT,
    "linkedinUrl" TEXT,
    "location" TEXT,
    "matchedSkills" TEXT[],
    "processingMethod" TEXT,
    "processingTime" DOUBLE PRECISION,
    "recommendation" TEXT,
    "skills" TEXT[],
    "summary" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "uploadedById" INTEGER,

    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "type" "public"."UserType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."companies" (
    "id" SERIAL NOT NULL,
    "companyUuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "logo" TEXT,
    "mapLocation" TEXT,
    "linkedinProfile" TEXT,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."meetings" (
    "id" TEXT NOT NULL,
    "meetingTime" TIMESTAMP(3) NOT NULL,
    "meetingLink" TEXT,
    "meetingSummary" TEXT,
    "meetingRating" TEXT,
    "meetingType" "public"."MeetingType",
    "agenda" TEXT,
    "status" "public"."MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resumeId" TEXT NOT NULL,
    "createdById" INTEGER NOT NULL,
    "interviewType" "public"."InterviewType",
    "jobId" TEXT NOT NULL,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."interviews" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "status" "public"."InterviewStatus" NOT NULL DEFAULT 'DRAFT',
    "attempted" BOOLEAN NOT NULL DEFAULT false,
    "sessionStart" TIMESTAMP(3),
    "sessionEnd" TIMESTAMP(3),
    "candidateEmail" TEXT,
    "sessionPassword" TEXT,
    "jobPostId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."questions" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "type" "public"."QuestionType" NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB,
    "correct" JSONB NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."interview_attempts" (
    "id" TEXT NOT NULL,
    "interviewerId" INTEGER NOT NULL,
    "interviewId" TEXT NOT NULL,
    "status" "public"."InterviewAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "timeSpent" INTEGER,
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "violations" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "interview_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."answers" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" JSONB NOT NULL,
    "isCorrect" BOOLEAN,
    "pointsEarned" DOUBLE PRECISION,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activity_logs" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT,
    "type" "public"."LogType" NOT NULL,
    "severity" "public"."LogSeverity" NOT NULL DEFAULT 'MEDIUM',
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."recordings" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileSize" INTEGER,
    "duration" INTEGER,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "s3Key" TEXT,
    "s3Bucket" TEXT,

    CONSTRAINT "recordings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."assessment_stages" (
    "id" TEXT NOT NULL,
    "type" "public"."StageType" NOT NULL,
    "jobPostId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "interviewerId" INTEGER,
    "status" "public"."StageStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "resultScore" DOUBLE PRECISION,
    "notes" TEXT,
    "metadata" JSONB,
    "sequenceOrder" INTEGER,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."mcq_assessments" (
    "id" TEXT NOT NULL,
    "assessmentStageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "timeLimit" INTEGER,
    "passingScore" DOUBLE PRECISION,
    "difficulty" "public"."MCQDifficulty" NOT NULL DEFAULT 'MEDIUM',
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mcq_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."avatar_assessments" (
    "id" TEXT NOT NULL,
    "assessmentStageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "avatarType" TEXT,
    "interviewScript" TEXT,
    "recordingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "timeLimit" INTEGER,
    "evaluationCriteria" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "avatar_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."manual_meetings" (
    "id" TEXT NOT NULL,
    "assessmentStageId" TEXT NOT NULL,
    "meetingLink" TEXT,
    "agenda" TEXT,
    "meetingType" "public"."MeetingType",
    "meetingSummary" TEXT,
    "meetingRating" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manual_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."mcq_questions" (
    "id" TEXT NOT NULL,
    "mcqAssessmentId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctAnswer" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "category" TEXT,
    "difficulty" "public"."MCQDifficulty" NOT NULL DEFAULT 'MEDIUM',
    "explanation" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mcq_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."mcq_answers" (
    "id" TEXT NOT NULL,
    "mcqAssessmentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedAnswer" INTEGER,
    "isCorrect" BOOLEAN,
    "pointsEarned" DOUBLE PRECISION,
    "timeSpent" INTEGER,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mcq_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."avatar_recordings" (
    "id" TEXT NOT NULL,
    "avatarAssessmentId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileSize" INTEGER,
    "duration" INTEGER,
    "s3Key" TEXT,
    "s3Bucket" TEXT,
    "transcription" TEXT,
    "analysis" JSONB,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avatar_recordings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CandidateInteraction" (
    "id" TEXT NOT NULL,
    "type" "public"."InteractionType" NOT NULL,
    "status" "public"."InteractionStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "sequenceOrder" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resumeId" TEXT NOT NULL,
    "jobPostId" TEXT NOT NULL,
    "createdById" INTEGER NOT NULL,
    "meetingId" TEXT,
    "interviewId" TEXT,

    CONSTRAINT "CandidateInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedJobPost_jobPostId_version_key" ON "public"."GeneratedJobPost"("jobPostId", "version");

-- CreateIndex
CREATE INDEX "Resume_candidateEmail_idx" ON "public"."Resume"("candidateEmail");

-- CreateIndex
CREATE INDEX "Resume_jobPostId_matchScore_idx" ON "public"."Resume"("jobPostId", "matchScore");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "companies_companyUuid_key" ON "public"."companies"("companyUuid");

-- CreateIndex
CREATE UNIQUE INDEX "meetings_resumeId_key" ON "public"."meetings"("resumeId");

-- CreateIndex
CREATE UNIQUE INDEX "interview_attempts_interviewerId_interviewId_key" ON "public"."interview_attempts"("interviewerId", "interviewId");

-- CreateIndex
CREATE UNIQUE INDEX "answers_attemptId_questionId_key" ON "public"."answers"("attemptId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "public"."system_config"("key");

-- CreateIndex
CREATE INDEX "assessment_stages_jobPostId_resumeId_idx" ON "public"."assessment_stages"("jobPostId", "resumeId");

-- CreateIndex
CREATE INDEX "assessment_stages_type_status_idx" ON "public"."assessment_stages"("type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "mcq_assessments_assessmentStageId_key" ON "public"."mcq_assessments"("assessmentStageId");

-- CreateIndex
CREATE UNIQUE INDEX "avatar_assessments_assessmentStageId_key" ON "public"."avatar_assessments"("assessmentStageId");

-- CreateIndex
CREATE UNIQUE INDEX "manual_meetings_assessmentStageId_key" ON "public"."manual_meetings"("assessmentStageId");

-- CreateIndex
CREATE UNIQUE INDEX "mcq_answers_mcqAssessmentId_questionId_key" ON "public"."mcq_answers"("mcqAssessmentId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateInteraction_meetingId_key" ON "public"."CandidateInteraction"("meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateInteraction_interviewId_key" ON "public"."CandidateInteraction"("interviewId");

-- AddForeignKey
ALTER TABLE "public"."GeneratedJobPost" ADD CONSTRAINT "GeneratedJobPost_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeneratedJobPost" ADD CONSTRAINT "GeneratedJobPost_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "public"."JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobPost" ADD CONSTRAINT "JobPost_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobPost" ADD CONSTRAINT "JobPost_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Resume" ADD CONSTRAINT "Resume_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "public"."JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Resume" ADD CONSTRAINT "Resume_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meetings" ADD CONSTRAINT "meetings_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meetings" ADD CONSTRAINT "meetings_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meetings" ADD CONSTRAINT "meetings_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "public"."Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."interviews" ADD CONSTRAINT "interviews_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "public"."JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."interviews" ADD CONSTRAINT "interviews_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "public"."Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."interviews" ADD CONSTRAINT "interviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."questions" ADD CONSTRAINT "questions_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "public"."interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."interview_attempts" ADD CONSTRAINT "interview_attempts_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "public"."interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."interview_attempts" ADD CONSTRAINT "interview_attempts_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."answers" ADD CONSTRAINT "answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "public"."interview_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."answers" ADD CONSTRAINT "answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "public"."interview_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recordings" ADD CONSTRAINT "recordings_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "public"."interview_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assessment_stages" ADD CONSTRAINT "assessment_stages_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "public"."JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assessment_stages" ADD CONSTRAINT "assessment_stages_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "public"."Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assessment_stages" ADD CONSTRAINT "assessment_stages_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mcq_assessments" ADD CONSTRAINT "mcq_assessments_assessmentStageId_fkey" FOREIGN KEY ("assessmentStageId") REFERENCES "public"."assessment_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."avatar_assessments" ADD CONSTRAINT "avatar_assessments_assessmentStageId_fkey" FOREIGN KEY ("assessmentStageId") REFERENCES "public"."assessment_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."manual_meetings" ADD CONSTRAINT "manual_meetings_assessmentStageId_fkey" FOREIGN KEY ("assessmentStageId") REFERENCES "public"."assessment_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mcq_questions" ADD CONSTRAINT "mcq_questions_mcqAssessmentId_fkey" FOREIGN KEY ("mcqAssessmentId") REFERENCES "public"."mcq_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mcq_answers" ADD CONSTRAINT "mcq_answers_mcqAssessmentId_fkey" FOREIGN KEY ("mcqAssessmentId") REFERENCES "public"."mcq_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mcq_answers" ADD CONSTRAINT "mcq_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."mcq_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."avatar_recordings" ADD CONSTRAINT "avatar_recordings_avatarAssessmentId_fkey" FOREIGN KEY ("avatarAssessmentId") REFERENCES "public"."avatar_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CandidateInteraction" ADD CONSTRAINT "CandidateInteraction_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "public"."Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CandidateInteraction" ADD CONSTRAINT "CandidateInteraction_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "public"."JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CandidateInteraction" ADD CONSTRAINT "CandidateInteraction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CandidateInteraction" ADD CONSTRAINT "CandidateInteraction_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "public"."meetings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CandidateInteraction" ADD CONSTRAINT "CandidateInteraction_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "public"."interviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;
