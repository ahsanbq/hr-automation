const { PrismaClient } = require('@prisma/client');

async function testMeetings() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    
    // Check if there are any meetings
    const meetings = await prisma.meeting.findMany({
      include: {
        resume: {
          include: {
            jobPost: true
          }
        }
      }
    });
    
    console.log(`Found ${meetings.length} meetings:`);
    meetings.forEach((meeting, index) => {
      console.log(`${index + 1}. Meeting ID: ${meeting.id}`);
      console.log(`   Resume: ${meeting.resume.candidateName}`);
      console.log(`   Job: ${meeting.resume.jobPost.jobTitle}`);
      console.log(`   Status: ${meeting.status}`);
      console.log(`   Time: ${meeting.meetingTime}`);
      console.log('---');
    });
    
    // Check if there are any jobs
    const jobs = await prisma.jobPost.findMany();
    console.log(`\nFound ${jobs.length} jobs:`);
    jobs.forEach((job, index) => {
      console.log(`${index + 1}. Job ID: ${job.id}`);
      console.log(`   Title: ${job.jobTitle}`);
      console.log(`   Company: ${job.companyName}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMeetings();
