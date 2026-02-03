import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import {
  AIResumeService,
  ResumeAnalysisRequest,
} from "@/lib/ai-resume-service";
import { updateProgress } from "@/lib/progress-store";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { jobId } = req.query;
  if (!jobId || typeof jobId !== "string") {
    return res.status(400).json({ error: "Job ID required" });
  }

  const jobIdString: string = jobId;

  // Verify job exists and user has access
  const jobPost = await prisma.jobPost.findFirst({
    where: {
      id: jobIdString,
      createdById: user.userId,
    },
    include: {
      companies: true,
    },
  });

  if (!jobPost) {
    return res.status(404).json({ error: "Job not found" });
  }

  const { resume_paths, uploaded_files, batch_size = 5 } = req.body;

  // Support both URL-based and file upload analysis
  let pathsToAnalyze: string[] = [];

  if (resume_paths && Array.isArray(resume_paths) && resume_paths.length > 0) {
    pathsToAnalyze = resume_paths;
  } else if (
    uploaded_files &&
    Array.isArray(uploaded_files) &&
    uploaded_files.length > 0
  ) {
    // Extract S3 URLs from uploaded files
    pathsToAnalyze = uploaded_files.map((file: any) => file.s3Url);
  }

  if (pathsToAnalyze.length === 0) {
    return res.status(400).json({
      error: "Either resume_paths array or uploaded_files array is required",
    });
  }

  try {
    console.log("📋 Batch Resume Analysis Request:", {
      jobId: jobPost.id,
      jobTitle: jobPost.jobTitle,
      total_resumes: pathsToAnalyze.length,
      batch_size,
    });

    // Initialize progress
    updateProgress(user.userId, jobIdString, {
      total: pathsToAnalyze.length,
      processed: 0,
      successful: 0,
      failed: 0,
      currentBatch: 0,
      totalBatches: Math.ceil(pathsToAnalyze.length / batch_size),
      isComplete: false,
      currentFile: null,
      percentage: 0,
    });

    // Convert JobPost to format expected by external AI API
    const jobReq = AIResumeService.mapJobPostToJobReq(jobPost);

    // Split resumes into batches
    const batches = [];
    for (let i = 0; i < pathsToAnalyze.length; i += batch_size) {
      batches.push(pathsToAnalyze.slice(i, i + batch_size));
    }

    console.log(
      `🔄 Processing ${pathsToAnalyze.length} resumes in ${batches.length} batches of ${batch_size}`,
    );

    const savedResumes = [];
    const failedResumes = [];
    let processedCount = 0;

    // Process each batch sequentially
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      console.log(
        `📦 Processing batch ${batchIndex + 1}/${batches.length} (${
          batch.length
        } resumes)`,
      );

      // Update progress for current batch
      updateProgress(user.userId, jobIdString, {
        currentBatch: batchIndex + 1,
        currentFile: `Processing batch ${batchIndex + 1}/${batches.length}...`,
      });

      try {
        // Call external AI API for this batch
        const batchAnalysisResponse = await AIResumeService.analyzeResumes({
          resume_paths: batch,
          job_req: jobReq,
        });

        // Process the batch response
        for (const analysis of batchAnalysisResponse.analyses) {
          processedCount++;
          const currentPercentage = Math.round(
            (processedCount / pathsToAnalyze.length) * 100,
          );

          // Update current file being processed
          updateProgress(user.userId, jobIdString, {
            processed: processedCount,
            percentage: currentPercentage,
            currentFile:
              analysis.resume_path.split("/").pop()?.split("?")[0] ||
              "Unknown file",
          });

          if (analysis.success) {
            try {
              // Convert education array to JSON string if it's an array
              let educationStr: string | null = null;
              if (analysis.candidate.education) {
                if (Array.isArray(analysis.candidate.education)) {
                  educationStr = JSON.stringify(analysis.candidate.education);
                } else if (typeof analysis.candidate.education === "string") {
                  educationStr = analysis.candidate.education;
                }
              }

              const resume = await prisma.resume.create({
                data: {
                  id: crypto.randomUUID(),
                  resumeUrl: analysis.resume_path,
                  candidateName: analysis.candidate.name,
                  candidateEmail: analysis.candidate.email,
                  candidatePhone: analysis.candidate.phone,
                  matchScore: analysis.candidate.match_score,
                  recommendation: analysis.analysis.recommendation,
                  skills: analysis.candidate.skills,
                  experienceYears: analysis.candidate.experience_years,
                  education: educationStr,
                  summary: analysis.candidate.summary,
                  location: analysis.candidate.location,
                  linkedinUrl: analysis.candidate.linkedin_url,
                  githubUrl: analysis.candidate.github_url,
                  currentJobTitle: analysis.candidate.current_job_title,
                  processingMethod: analysis.candidate.processing_method,
                  analysisTimestamp: new Date(
                    analysis.candidate.analysis_timestamp,
                  ),
                  fileName: analysis.analysis.file_name,
                  fileSizeMb: analysis.analysis.file_size_mb,
                  processingTime: analysis.analysis.processing_time,
                  matchedSkills: analysis.analysis.matched_skills,
                  jobPostId: jobPost.id,
                  uploadedById: user.userId,
                  updatedAt: new Date(),
                },
              });
              savedResumes.push(resume);

              // Update progress with success
              updateProgress(user.userId, jobIdString, {
                successful: savedResumes.length,
                percentage: currentPercentage,
              });

              console.log(
                `✅ Saved resume ${processedCount}/${pathsToAnalyze.length}: ${analysis.candidate.name}`,
              );
            } catch (dbError) {
              console.error("Database error saving resume:", dbError);
              failedResumes.push({
                resume_path: analysis.resume_path,
                error:
                  "Database error: " +
                  (dbError instanceof Error
                    ? dbError.message
                    : "Unknown error"),
              });

              // Update progress with failure
              updateProgress(user.userId, jobIdString, {
                failed: failedResumes.length,
                percentage: currentPercentage,
              });
            }
          } else {
            failedResumes.push({
              resume_path: analysis.resume_path,
              error: "Analysis failed",
            });

            // Update progress with failure
            updateProgress(user.userId, jobIdString, {
              failed: failedResumes.length,
              percentage: currentPercentage,
            });

            console.log(
              `❌ Failed resume ${processedCount}/${pathsToAnalyze.length}: ${analysis.resume_path}`,
            );
          }

          // Small delay between each resume for smoother progress updates
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        // Add a small delay between batches to prevent overwhelming the external API
        if (batchIndex < batches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
        }
      } catch (batchError) {
        console.error(`❌ Batch ${batchIndex + 1} failed:`, batchError);
        // Mark all resumes in this batch as failed
        for (const resumePath of batch) {
          failedResumes.push({
            resume_path: resumePath,
            error: `Batch processing failed: ${
              batchError instanceof Error ? batchError.message : "Unknown error"
            }`,
          });
        }
        processedCount += batch.length;

        // Update progress with batch failure
        updateProgress(user.userId, jobIdString, {
          processed: processedCount,
          failed: failedResumes.length,
          errors: failedResumes.slice(-5).map((f) => ({
            file:
              f.resume_path.split("/").pop()?.split("?")[0] || "Unknown file",
            error: f.error,
          })),
        });
      }
    }

    // Mark as complete
    updateProgress(user.userId, jobIdString, {
      isComplete: true,
      currentFile: null,
      percentage: 100,
    });

    console.log(
      `🎉 Batch processing complete: ${savedResumes.length}/${pathsToAnalyze.length} successful`,
    );

    return res.status(200).json({
      success: true,
      message: `Batch processing complete: ${
        savedResumes.length
      } resumes analyzed and saved${
        failedResumes.length > 0 ? `, ${failedResumes.length} failed` : ""
      }`,
      resumes: savedResumes,
      failedResumes,
      summary: {
        total: pathsToAnalyze.length,
        successful: savedResumes.length,
        failed: failedResumes.length,
        batches_processed: batches.length,
        batch_size,
      },
      progress: 100,
    });
  } catch (error: any) {
    console.error("Batch resume analysis error:", error);
    return res.status(500).json({
      error: "Failed to analyze resumes in batch",
      details: error.message,
    });
  }
}
