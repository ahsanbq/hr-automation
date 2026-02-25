import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import {
  AIResumeService,
  ResumeAnalysisRequest,
  ResumeAnalysisItem,
} from "@/lib/ai-resume-service";
import { updateProgress } from "@/lib/progress-store";

/** Filter out null-like strings from arrays */
function cleanArray(arr: string[]): string[] {
  return arr.filter(
    (v) =>
      v &&
      typeof v === "string" &&
      v.trim() !== "" &&
      v.trim().toLowerCase() !== "null",
  );
}

/** Sanitize a nullable string — convert "null" to actual null */
function cleanNullable(val: string | null | undefined): string | null {
  if (!val || val.trim() === "" || val.trim().toLowerCase() === "null")
    return null;
  return val.trim();
}

/**
 * Save a single analysis result to the database.
 * Returns the saved resume or null on failure.
 */
async function saveAnalysisToDb(
  analysis: any,
  jobPostId: string,
  userId: number,
) {
  // Convert education array to JSON string if it's an array
  let educationStr: string | null = null;
  if (analysis.candidate.education) {
    if (Array.isArray(analysis.candidate.education)) {
      educationStr = JSON.stringify(analysis.candidate.education);
    } else if (typeof analysis.candidate.education === "string") {
      educationStr = analysis.candidate.education;
    }
  }

  // Extract filter-specific arrays from AI response (sanitised)
  const filterData = analysis.filter || {};
  const degrees: string[] = cleanArray(
    Array.isArray(filterData.degree) ? filterData.degree : [],
  );
  const institutes: string[] = cleanArray(
    Array.isArray(filterData.institute) ? filterData.institute : [],
  );
  const certificates: string[] = cleanArray(
    Array.isArray(filterData.certificate) ? filterData.certificate : [],
  );

  // Extract languages from candidate data (sanitised)
  const languages: string[] = cleanArray(
    Array.isArray(analysis.candidate.languages)
      ? analysis.candidate.languages.map((l: any) =>
          typeof l === "string" ? l : l?.language || "",
        )
      : [],
  );

  return prisma.resume.create({
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
      location: cleanNullable(analysis.candidate.location),
      linkedinUrl: cleanNullable(analysis.candidate.linkedin_url),
      githubUrl: cleanNullable(analysis.candidate.github_url),
      currentJobTitle: cleanNullable(analysis.candidate.current_job_title),
      processingMethod: analysis.candidate.processing_method,
      analysisTimestamp: new Date(analysis.candidate.analysis_timestamp),
      fileName: analysis.analysis.file_name,
      fileSizeMb: analysis.analysis.file_size_mb,
      processingTime: analysis.analysis.processing_time,
      matchedSkills: analysis.analysis.matched_skills,
      // Filter-specific columns
      degrees,
      institutes,
      certificates,
      languages,
      portfolioUrl: cleanNullable(analysis.candidate.portfolio_url),
      jobPostId,
      uploadedById: userId,
      updatedAt: new Date(),
    },
  });
}

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
  let isUploadedFiles = false;

  if (resume_paths && Array.isArray(resume_paths) && resume_paths.length > 0) {
    pathsToAnalyze = resume_paths;
    isUploadedFiles = false; // URL batch → v3-background
  } else if (
    uploaded_files &&
    Array.isArray(uploaded_files) &&
    uploaded_files.length > 0
  ) {
    // Extract S3 URLs from uploaded files
    pathsToAnalyze = uploaded_files.map((file: any) => file.s3Url);
    isUploadedFiles = true; // Uploaded files → single v2 processing
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
      mode: isUploadedFiles ? "single-v2" : "batch-v3-background",
    });

    // Initialize progress
    updateProgress(user.userId, jobIdString, {
      total: pathsToAnalyze.length,
      processed: 0,
      successful: 0,
      failed: 0,
      currentBatch: 0,
      totalBatches: isUploadedFiles ? pathsToAnalyze.length : 1,
      isComplete: false,
      currentFile: null,
      percentage: 0,
    });

    // Convert JobPost to format expected by external AI API
    const jobReq = AIResumeService.mapJobPostToJobReq(jobPost);

    const savedResumes: any[] = [];
    const failedResumes: any[] = [];
    let processedCount = 0;

    if (isUploadedFiles) {
      // ─── UPLOADED FILES: process each one individually via v2 (single CV) ───
      console.log(
        `🔄 Processing ${pathsToAnalyze.length} uploaded files individually via v2 API`,
      );

      for (let i = 0; i < pathsToAnalyze.length; i++) {
        const resumePath = pathsToAnalyze[i];
        const fileName =
          resumePath.split("/").pop()?.split("?")[0] || `File ${i + 1}`;

        updateProgress(user.userId, jobIdString, {
          currentBatch: i + 1,
          currentFile: `Analyzing ${fileName}...`,
        });

        try {
          const singleResponse = await AIResumeService.analyzeResumes({
            resume_paths: [resumePath],
            job_req: jobReq,
          });

          for (const analysis of singleResponse.analyses) {
            processedCount++;
            const currentPercentage = Math.round(
              (processedCount / pathsToAnalyze.length) * 100,
            );

            updateProgress(user.userId, jobIdString, {
              processed: processedCount,
              percentage: currentPercentage,
              currentFile: fileName,
            });

            if (analysis.success) {
              try {
                const resume = await saveAnalysisToDb(
                  analysis,
                  jobPost.id,
                  user.userId,
                );
                savedResumes.push(resume);
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
              updateProgress(user.userId, jobIdString, {
                failed: failedResumes.length,
                percentage: currentPercentage,
              });
              console.log(
                `❌ Failed resume ${processedCount}/${pathsToAnalyze.length}: ${analysis.resume_path}`,
              );
            }
          }
        } catch (singleError) {
          processedCount++;
          console.error(
            `❌ Single analysis failed for ${fileName}:`,
            singleError,
          );
          failedResumes.push({
            resume_path: resumePath,
            error:
              singleError instanceof Error
                ? singleError.message
                : "Unknown error",
          });
          updateProgress(user.userId, jobIdString, {
            processed: processedCount,
            failed: failedResumes.length,
            percentage: Math.round(
              (processedCount / pathsToAnalyze.length) * 100,
            ),
          });
        }

        // Small delay between individual requests
        if (i < pathsToAnalyze.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    } else {
      // ─── URL BATCH: use v3-background API ───
      console.log(
        `🚀 Submitting ${pathsToAnalyze.length} resumes to v3-background API`,
      );

      updateProgress(user.userId, jobIdString, {
        currentBatch: 1,
        currentFile: "Submitting batch to AI service...",
      });

      try {
        const results = await AIResumeService.analyzeResumesBackground(
          { resume_paths: pathsToAnalyze, job_req: jobReq },
          (msg) => {
            console.log(`📡 Background: ${msg}`);
            updateProgress(user.userId, jobIdString, {
              currentFile: msg,
            });
          },
        );

        console.log(
          `✅ Background analysis returned ${results.analyses.length} results`,
        );

        // Process all results from the background job
        for (const analysis of results.analyses) {
          processedCount++;
          const currentPercentage = Math.round(
            (processedCount / pathsToAnalyze.length) * 100,
          );

          updateProgress(user.userId, jobIdString, {
            processed: processedCount,
            percentage: currentPercentage,
            currentFile:
              analysis.resume_path.split("/").pop()?.split("?")[0] ||
              "Unknown file",
          });

          if (analysis.success) {
            try {
              const resume = await saveAnalysisToDb(
                analysis,
                jobPost.id,
                user.userId,
              );
              savedResumes.push(resume);
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
            updateProgress(user.userId, jobIdString, {
              failed: failedResumes.length,
              percentage: currentPercentage,
            });
            console.log(
              `❌ Failed resume ${processedCount}/${pathsToAnalyze.length}: ${analysis.resume_path}`,
            );
          }

          // Small delay for smoother progress updates
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      } catch (bgError) {
        console.error("❌ Background analysis failed:", bgError);
        // Mark all as failed
        for (const resumePath of pathsToAnalyze) {
          failedResumes.push({
            resume_path: resumePath,
            error:
              bgError instanceof Error
                ? bgError.message
                : "Background processing failed",
          });
        }
        processedCount = pathsToAnalyze.length;
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
