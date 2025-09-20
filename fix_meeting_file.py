#!/usr/bin/env python3

import re

# Read the file
with open('src/pages/meeting/[jobId].tsx', 'r') as f:
    content = f.read()

# Fix the first fetch request - remove the misplaced column definition
# Pattern to match the problematic first fetch request
pattern1 = r'(\s+const response = await fetch\("/api/generate-interview-agenda", \{\s+method: "POST",\s+headers: \{\s+"Content-Type": "application/json",\s+"Authorization": `Bearer \$\{localStorage\.getItem\("token"\)\}`\s+\},\s+)\{\s+title: "Phone",\s+dataIndex: "candidatePhone",\s+key: "candidatePhone",\s+width: 120,\s+render: \(phone: string\) =>\s+phone \? \(\s+<a\s+href=\{`tel:\$\{phone\}`\}\s+style=\{\{ color: "#1890ff", fontSize: "12px" \}\}\s+>\s+\{phone\}\s+</a>\s+\) : \(\s+<span style=\{\{ color: "#999", fontSize: "12px" \}\}>N/A</span>\s+\),\s+\},\s+body: JSON\.stringify\(\{\s+resumeId: selectedResume\.id,\s+interview_type: "Technical" // Default to Technical, can be made dynamic\s+\}\)\s+\}\);)'

replacement1 = r'\1body: JSON.stringify({\n          resumeId: selectedResume.id,\n          interview_type: "Technical" // Default to Technical, can be made dynamic\n        })\n      });'

content = re.sub(pattern1, replacement1, content, flags=re.DOTALL)

# Fix the second fetch request - remove the misplaced column definition
pattern2 = r'(\s+const response = await fetch\(\'/api/meetings\', \{\s+method: \'POST\',\s+headers: \{\s+\'Content-Type\': \'application/json\',\s+\'Authorization\': `Bearer \$\{localStorage\.getItem\(\'token\'\)\}`\s+\},\s+)\{\s+title: "Phone",\s+dataIndex: "candidatePhone",\s+key: "candidatePhone",\s+width: 120,\s+render: \(phone: string\) =>\s+phone \? \(\s+<a\s+href=\{`tel:\$\{phone\}`\}\s+style=\{\{ color: "#1890ff", fontSize: "12px" \}\}\s+>\s+\{phone\}\s+</a>\s+\) : \(\s+<span style=\{\{ color: "#999", fontSize: "12px" \}\}>N/A</span>\s+\),\s+\},\s+body: JSON\.stringify\(\{\s+meetingTime: meetingTime\.toISOString\(\),\s+meetingLink: values\.meetingLink,\s+meetingType: values\.meetingType \|\| \'TECHNICAL\',\s+interviewType: values\.interviewType \|\| \'TECHNICAL\',\s+agenda: generatedAgenda, // Include the generated agenda\s+status: \'SCHEDULED\',\s+resumeId: selectedResume\.id,\s+jobId: jobId\s+\}\)\s+\}\);)'

replacement2 = r'\1body: JSON.stringify({\n          meetingTime: meetingTime.toISOString(),\n          meetingLink: values.meetingLink,\n          meetingType: values.meetingType || \'TECHNICAL\',\n          interviewType: values.interviewType || \'TECHNICAL\',\n          agenda: generatedAgenda, // Include the generated agenda\n          status: \'SCHEDULED\',\n          resumeId: selectedResume.id,\n          jobId: jobId\n        })\n      });'

content = re.sub(pattern2, replacement2, content, flags=re.DOTALL)

# Write the fixed content back
with open('src/pages/meeting/[jobId].tsx', 'w') as f:
    f.write(content)

print("Fixed the syntax errors in the meeting file")
