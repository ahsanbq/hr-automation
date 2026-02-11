# AI Interview Module — Refactor & API Integration Spec

## Overview
Refactor the existing AI Interview module in the production application. The module already works but follows a slightly different flow. Update it to support the new scheduled interview workflow and integrate the AI question generation API. Do NOT rebuild from scratch. Extend and modify existing logic while maintaining backward compatibility.

## Refactor Constraints
- Do not rewrite module from zero
- main refactor on create ai interview button modla worklfow 
- Add DB migrations only if required
- Prefer service-layer additions
- Allow feature flag for new flow

## Target User Flow
1. User opens AI Interview module
2. User open the create ai interview modal
3. User selects Job Post ten next
3. User selects Candidate then next 
4. User clicks Create Interview Session then next
5. Open Session Setup from from next
6. Modal collects interview_date, start_time, end_time by manual useer input 
7. then user genertae question by pressing genetrat question form that one api 
8. then send button to send the interview info to the candidate 
9. mail body onctains Inertveiew ttle interview interview id session paswrod email and start time and end time 
and start now button 

db ussage 
check teh shcema 
on interview model there is a filed name interview title so make that to Ai interview 
and session password to save shash password on only db and normal password send to candidate  

## System Actions On Confirm
- Build API payload from job + candidate models
- Call POST /generate-simple-interview-questions
- Create InterviewSession record
- Store generated questions
- Set question_type = essay
- Send secure candidate email
- Update generation and email status flags

## Question Generation API Endpoint
POST /generate-simple-interview-questions

## Required Request Body (Exact Shape)
```json
{
  "jobRequirement": {
    "title": job.title,
    "company": job.company_name,
    "location": job.location,
    "job_type": job.job_type,
    "experience_level": job.experience_level,
    "skills_required": job.skills,
    "responsibilities": job.responsibilities,
    "qualifications": job.qualifications,
    "description": job.description,
    "salary_range": job.salary_range,
    "benefits": job.benefits
  },
  "candidate": {
    "resume_path": candidate.resume_path,
    "name": candidate.name,
    "email": candidate.email,
    "phone": candidate.phone,
    "skills": candidate.skills,
    "experience_years": candidate.experience_years,
    "education": candidate.education,
    "match_score": candidate.match_score,
    "summary": candidate.summary,
    "location": candidate.location,
    "linkedin_url": candidate.linkedin_url,
    "github_url": candidate.github_url,
    "github_username": candidate.github_username,
    "portfolio_url": candidate.portfolio_url,
    "current_job_title": candidate.current_job_title,
    "work_experience": candidate.work_experience,
    "projects": candidate.projects,
    "certifications": candidate.certifications,
    "publications": candidate.publications,
    "languages": candidate.languages,
    "awards": candidate.awards,
    "volunteer_experience": candidate.volunteer_experience,
    "interests": candidate.interests,
    "processing_method": candidate.processing_method,
    "analysis_timestamp": candidate.analysis_timestamp
  }
}
