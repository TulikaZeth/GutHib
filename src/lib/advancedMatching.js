/**
 * Advanced Developer-Issue Matching System
 * Intelligently matches developers to issues based on:
 * - Tech stack and role inference
 * - Skills and proficiency levels
 * - Resume data and experience
 * - Issue complexity and requirements
 */

// Role definitions based on tech stack patterns
const ROLE_PATTERNS = {
  backend: {
    languages: ['python', 'java', 'go', 'ruby', 'php', 'c#', 'rust', 'kotlin', 'scala'],
    frameworks: ['django', 'flask', 'fastapi', 'spring', 'spring boot', 'express', 'nestjs', 'laravel', 'rails', 'asp.net'],
    keywords: ['api', 'backend', 'server', 'database', 'rest', 'graphql', 'microservices', 'authentication'],
  },
  frontend: {
    languages: ['javascript', 'typescript', 'html', 'css'],
    frameworks: ['react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt', 'gatsby', 'tailwind', 'bootstrap'],
    keywords: ['ui', 'ux', 'frontend', 'component', 'design', 'responsive', 'interface', 'web'],
  },
  fullstack: {
    languages: ['javascript', 'typescript', 'python'],
    frameworks: ['next.js', 'nuxt', 'django', 'rails', 'meteor'],
    keywords: ['fullstack', 'full-stack', 'end-to-end', 'mern', 'mean', 'lamp'],
  },
  mobile: {
    languages: ['swift', 'kotlin', 'java', 'dart', 'javascript', 'typescript'],
    frameworks: ['react native', 'flutter', 'ionic', 'xamarin', 'swiftui'],
    keywords: ['mobile', 'ios', 'android', 'app', 'native'],
  },
  ml: {
    languages: ['python', 'r', 'julia'],
    frameworks: ['tensorflow', 'pytorch', 'scikit-learn', 'keras', 'pandas', 'numpy'],
    keywords: ['machine learning', 'ml', 'ai', 'deep learning', 'neural', 'model', 'data science', 'nlp'],
  },
  devops: {
    tools: ['docker', 'kubernetes', 'jenkins', 'gitlab ci', 'github actions', 'terraform', 'ansible'],
    cloudPlatforms: ['aws', 'azure', 'gcp', 'digitalocean', 'heroku'],
    keywords: ['devops', 'ci/cd', 'deployment', 'infrastructure', 'cloud', 'pipeline', 'container'],
  },
  data: {
    languages: ['python', 'sql', 'r'],
    tools: ['spark', 'hadoop', 'airflow', 'kafka'],
    databases: ['postgresql', 'mongodb', 'redis', 'elasticsearch', 'cassandra'],
    keywords: ['data', 'analytics', 'etl', 'pipeline', 'warehouse', 'big data'],
  },
};

/**
 * Infer developer roles from their tech stack
 */
export function inferDeveloperRoles(userProfile) {
  const roles = new Set();
  const techStack = userProfile.techStack || {};
  const skills = userProfile.skills || [];
  
  // Normalize all data to lowercase for comparison
  const normalizedLangs = (techStack.languages || []).map(l => l.toLowerCase());
  const normalizedFrameworks = (techStack.frameworks || []).map(f => f.toLowerCase());
  const normalizedTools = (techStack.tools || []).map(t => t.toLowerCase());
  const normalizedDatabases = (techStack.databases || []).map(d => d.toLowerCase());
  const normalizedCloudPlatforms = (techStack.cloudPlatforms || []).map(c => c.toLowerCase());
  const normalizedSkills = skills.map(s => (s.skill || s.name || '').toLowerCase());
  
  // Check each role pattern
  for (const [role, patterns] of Object.entries(ROLE_PATTERNS)) {
    let matchCount = 0;
    let totalChecks = 0;
    
    // Check languages
    if (patterns.languages) {
      const langMatches = normalizedLangs.filter(lang => 
        patterns.languages.some(pl => lang.includes(pl) || pl.includes(lang))
      ).length;
      matchCount += langMatches;
      totalChecks += patterns.languages.length;
    }
    
    // Check frameworks
    if (patterns.frameworks) {
      const frameworkMatches = normalizedFrameworks.filter(fw => 
        patterns.frameworks.some(pf => fw.includes(pf) || pf.includes(fw))
      ).length;
      matchCount += frameworkMatches;
      totalChecks += patterns.frameworks.length;
    }
    
    // Check tools
    if (patterns.tools) {
      const toolMatches = normalizedTools.filter(tool => 
        patterns.tools.some(pt => tool.includes(pt) || pt.includes(tool))
      ).length;
      matchCount += toolMatches;
      totalChecks += patterns.tools.length;
    }
    
    // Check databases
    if (patterns.databases) {
      const dbMatches = normalizedDatabases.filter(db => 
        patterns.databases.some(pd => db.includes(pd) || pd.includes(db))
      ).length;
      matchCount += dbMatches;
      totalChecks += patterns.databases.length;
    }
    
    // Check cloud platforms
    if (patterns.cloudPlatforms) {
      const cloudMatches = normalizedCloudPlatforms.filter(cloud => 
        patterns.cloudPlatforms.some(pc => cloud.includes(pc) || pc.includes(cloud))
      ).length;
      matchCount += cloudMatches;
      totalChecks += patterns.cloudPlatforms.length;
    }
    
    // Check skills against keywords
    if (patterns.keywords) {
      const keywordMatches = normalizedSkills.filter(skill => 
        patterns.keywords.some(kw => skill.includes(kw) || kw.includes(skill))
      ).length;
      matchCount += keywordMatches;
      totalChecks += 1; // Count keyword matching as one check
    }
    
    // Add role if match percentage is > 30%
    if (totalChecks > 0 && (matchCount / totalChecks) > 0.3) {
      roles.add(role);
    }
  }
  
  return Array.from(roles);
}

/**
 * Calculate comprehensive match score between developer and issue
 */
export async function calculateAdvancedMatchScore(issue, userProfile, geminiApiKey) {
  try {
    // Infer developer roles
    const developerRoles = inferDeveloperRoles(userProfile);
    
    // Prepare comprehensive developer profile
    const skills = userProfile.skills || [];
    const techStack = userProfile.techStack || {};
    const experience = userProfile.totalExperience || 0;
    const confidenceLevel = userProfile.confidenceLevel || 'medium';
    const summary = userProfile.summary || '';
    
    // Build skill categorization
    const skillsByCategory = {};
    skills.forEach(skill => {
      const category = skill.category || 'general';
      if (!skillsByCategory[category]) {
        skillsByCategory[category] = [];
      }
      skillsByCategory[category].push({
        name: skill.skill || skill.name,
        score: skill.score || skill.level || 50,
        description: skill.description || ''
      });
    });
    
    // Create a detailed prompt for Gemini
    const matchingPrompt = `You are an expert technical recruiter analyzing if a developer is a good match for a GitHub issue.

**ISSUE DETAILS:**
Title: ${issue.title}
Description: ${issue.body || 'No description provided'}
Labels: ${issue.labels?.map(l => l.name).join(', ') || 'None'}
Repository: ${issue.repository || 'Unknown'}

**DEVELOPER PROFILE:**

Inferred Roles: ${developerRoles.length > 0 ? developerRoles.join(', ') : 'Not determined'}

Professional Summary:
${summary || 'No summary available'}

Total Experience: ${experience} years
Confidence Level: ${confidenceLevel}

Tech Stack:
- Languages: ${techStack.languages?.join(', ') || 'None listed'}
- Frameworks: ${techStack.frameworks?.join(', ') || 'None listed'}
- Tools: ${techStack.tools?.join(', ') || 'None listed'}
- Databases: ${techStack.databases?.join(', ') || 'None listed'}
- Cloud Platforms: ${techStack.cloudPlatforms?.join(', ') || 'None listed'}
- Libraries: ${techStack.libraries?.join(', ') || 'None listed'}

Skills by Category:
${Object.entries(skillsByCategory).map(([category, categorySkills]) => 
  `${category.toUpperCase()}: ${categorySkills.map(s => `${s.name} (${s.score}%)`).join(', ')}`
).join('\n')}

**MATCHING CRITERIA:**

1. **Role Alignment (30%)**: Does the developer's inferred role(s) match what's needed for this issue?
   - Consider if a backend dev is suited for backend issues, frontend for UI tasks, etc.
   - ML devs should match data science/AI issues
   - DevOps devs should match infrastructure/deployment issues

2. **Technical Stack Match (30%)**: Do the required technologies align with their tech stack?
   - Look at languages, frameworks, and tools mentioned in the issue
   - Consider labels and keywords in title/description

3. **Skill Proficiency (25%)**: Do they have the specific skills needed?
   - Match skills from their profile to requirements
   - Weight by skill score/proficiency level

4. **Experience Level (15%)**: Is their experience appropriate?
   - Junior issues for less experienced devs
   - Senior/complex issues for experienced devs
   - Consider confidence level from resume analysis

**OUTPUT FORMAT:**
Return ONLY a valid JSON object (no markdown, no extra text):
{
  "matchScore": <number 0-100>,
  "primaryReason": "<one sentence explaining the main reason for this score>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "concerns": ["<concern 1 if any>"],
  "recommendedAction": "<assign|consider|skip>"
}

**SCORING GUIDELINES:**
- 80-100: Excellent match - strong alignment across all criteria
- 60-79: Good match - solid alignment with minor gaps
- 40-59: Moderate match - some alignment but notable gaps
- 20-39: Weak match - limited alignment
- 0-19: Poor match - little to no alignment

Be realistic and consider the complete profile. Most matches should fall in the 30-70 range.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: matchingPrompt }] }],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('Gemini API error:', await response.text());
      return { matchScore: 0, analysis: null };
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
      const responseText = data.candidates[0]?.content?.parts?.[0]?.text || '{}';
      
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        const matchScore = Math.min(100, Math.max(0, analysis.matchScore || 0));
        
        return {
          matchScore,
          analysis: {
            primaryReason: analysis.primaryReason || 'No specific reason provided',
            strengths: analysis.strengths || [],
            concerns: analysis.concerns || [],
            recommendedAction: analysis.recommendedAction || 'consider',
            inferredRoles: developerRoles,
          }
        };
      }
    }
    
    return { matchScore: 0, analysis: null };
  } catch (error) {
    console.error('Error in advanced match calculation:', error);
    return { matchScore: 0, analysis: null };
  }
}

/**
 * Generate personalized approach/solution for the issue
 */
export async function generatePersonalizedApproach(issue, userProfile, matchAnalysis, geminiApiKey) {
  try {
    const developerRoles = matchAnalysis?.inferredRoles || [];
    const strengths = matchAnalysis?.strengths || [];
    
    const solutionPrompt = `Generate a brief, professional approach for solving this GitHub issue based on the developer's profile.

**Issue:** ${issue.title}
**Description:** ${issue.body || 'No description'}
**Labels:** ${issue.labels?.map(l => l.name).join(', ') || 'None'}

**Developer Context:**
- Roles: ${developerRoles.join(', ')}
- Key Strengths: ${strengths.join(', ')}
- Experience: ${userProfile.totalExperience || 0} years
- Main Skills: ${(userProfile.skills || []).slice(0, 5).map(s => s.skill || s.name).join(', ')}

Write a 2-3 sentence approach that:
1. Shows understanding of the issue
2. Mentions specific technologies/methods they would use
3. Sounds professional and confident

Do NOT include greetings, signatures, or fluff. Just the technical approach.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: solutionPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 256,
          },
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.candidates && data.candidates.length > 0) {
        const solutionText = data.candidates[0]?.content?.parts?.[0]?.text || '';
        return solutionText.trim();
      }
    }
    
    return "I will analyze the requirements and implement a solution leveraging my technical expertise in " + 
           (developerRoles.join(' and ') || 'software development') + ".";
  } catch (error) {
    console.error('Error generating personalized approach:', error);
    return "I will implement a solution using best practices and my technical skills.";
  }
}
