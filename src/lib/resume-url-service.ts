/**
 * Service for handling resume URL access with fresh presigned URLs
 */

export interface ResumeWithUrl {
  id: string;
  resumeUrl: string;
  s3Key?: string;
  [key: string]: any;
}

/**
 * Get fresh presigned URL for a resume
 * @param resumeId - Resume ID
 * @returns Fresh presigned URL or original URL if no S3 key
 */
export async function getFreshResumeUrl(resumeId: string): Promise<string> {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`/api/resumes/${resumeId}/presigned-url`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to get presigned URL");
    }

    const data = await response.json();
    return data.presignedUrl;
  } catch (error) {
    console.error("Error getting fresh resume URL:", error);
    throw error;
  }
}

/**
 * Process resume data to include fresh URLs
 * @param resumes - Array of resume objects
 * @returns Promise with resumes that have fresh URLs
 */
export async function processResumesWithFreshUrls(
  resumes: ResumeWithUrl[]
): Promise<ResumeWithUrl[]> {
  const processedResumes = [];

  for (const resume of resumes) {
    try {
      if (resume.s3Key) {
        // Try to get fresh presigned URL
        const freshUrl = await getFreshResumeUrl(resume.id);
        processedResumes.push({
          ...resume,
          resumeUrl: freshUrl,
        });
      } else {
        // Use original URL (for old resumes without S3 key)
        processedResumes.push(resume);
      }
    } catch (error) {
      console.warn(`Failed to get fresh URL for resume ${resume.id}:`, error);
      // Fallback to original URL
      processedResumes.push(resume);
    }
  }

  return processedResumes;
}

/**
 * Get a single resume with fresh URL
 * @param resume - Resume object
 * @returns Resume with fresh URL
 */
export async function getResumeWithFreshUrl(
  resume: ResumeWithUrl
): Promise<ResumeWithUrl> {
  try {
    if (resume.s3Key) {
      const freshUrl = await getFreshResumeUrl(resume.id);
      return {
        ...resume,
        resumeUrl: freshUrl,
      };
    }
    return resume;
  } catch (error) {
    console.warn(`Failed to get fresh URL for resume ${resume.id}:`, error);
    return resume;
  }
}
