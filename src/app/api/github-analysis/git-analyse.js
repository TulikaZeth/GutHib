// Next.js App Router API route for the GitHub Analysis tool.
// This single file handles fetching from GitHub and generating a rating via Gemini.
import { NextResponse } from 'next/server';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const API_MODEL = 'gemini-2.5-flash-preview-09-2025';

// --- Utility Functions ---

/**
 * Custom fetch wrapper with exponential backoff for resilience.
 * Includes the GitHub token for authenticated requests.
 */
async function fetchData(url, retries = 3) {
    const headers = {
        'Content-Type': 'application/json',
    };
    if (GITHUB_TOKEN) {
        headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, { headers });
            if (!response.ok) {
                // If 403 (Forbidden/Rate Limit), log and retry
                if (response.status === 403 && i < retries - 1) {
                    console.warn(`Rate limit hit or Forbidden on ${url}. Retrying in ${Math.pow(2, i)}s...`);
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
                    continue;
                }
                throw new Error(`GitHub API Error (${response.status}): ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            if (i === retries - 1) {
                throw error;
            }
            // Standard fetch error, retry with backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
}

/**
 * Aggregates all languages from a user's public repositories and finds the top 3.
 */
async function fetchTopLanguages(username) {
    let allLanguages = {};
    let page = 1;
    let repos;

    // Fetch all public repos (max 100 per page)
    while (true) {
        repos = await fetchData(`https://api.github.com/users/${username}/repos?per_page=100&page=${page}`);
        if (repos.length === 0) break;
        
        // Fetch languages for each repo in parallel (be cautious of rate limits here)
        const languagePromises = repos.map(repo => 
            fetchData(repo.languages_url).catch(e => {
                console.error(`Failed to fetch languages for ${repo.name}: ${e.message}`);
                return {}; // Return empty object on failure
            })
        );
        const repoLanguages = await Promise.all(languagePromises);

        // Aggregate language bytes
        repoLanguages.forEach(langObj => {
            for (const lang in langObj) {
                allLanguages[lang] = (allLanguages[lang] || 0) + langObj[lang];
            }
        });
        page++;
    }

    // Sort and get top 3 languages
    const sortedLanguages = Object.entries(allLanguages)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([language, bytes]) => ({ language, bytes }));

    return sortedLanguages;
}

/**
 * Fetches recent activity (commits) for the user.
 */
async function fetchRecentCommits(username) {
    // We fetch public events and filter for PushEvents to approximate recent commits
    const events = await fetchData(`https://api.github.com/users/${username}/events?per_page=100`);
    
    const commits = [];
    for (const event of events) {
        if (event.type === 'PushEvent') {
            for (const commit of event.payload.commits) {
                if (commits.length < 10) {
                    commits.push({
                        sha: commit.sha.substring(0, 7),
                        message: commit.message,
                        repo: event.repo.name,
                        date: event.created_at,
                    });
                } else {
                    break;
                }
            }
            if (commits.length >= 10) break;
        }
    }
    return commits;
}

/**
 * Fetches the count of issues where the user is listed as an assignee.
 * NOTE: This relies on public data and may not be comprehensive.
 */
async function fetchAssignedIssuesCount(username) {
    const searchUrl = `https://api.github.com/search/issues?q=assignee:${username}+state:open&per_page=1`;
    try {
        const result = await fetchData(searchUrl);
        return result.total_count || 0;
    } catch (e) {
        console.error(`Error fetching assigned issues: ${e.message}`);
        return 0;
    }
}

/**
 * Uses the Gemini API to generate a professional skill rating based on the collected data.
 */
async function getGeminiRating(data) {
    if (!GEMINI_API_KEY) {
        return { rating: 50, summary: "Gemini API key is missing. Cannot generate advanced rating." };
    }

    const { activenessSummary, topLanguages, totalPublicContributions, publicRepos, recentCommits } = data;

    const systemPrompt = `You are a world-class AI Career Analyst. Your task is to provide a comprehensive, objective rating (0-100) and a brief summary of a GitHub developer's profile based on the provided technical data.

    1. **Rating:** Generate a numerical rating on a scale of 0 to 100.
    2. **Summary:** Write a single, concise paragraph (max 4 sentences) analyzing the developer's strengths (diversity, activeness, contributions) and justifying the numerical rating.
    3. **Format:** Output the response strictly as a JSON object matching the required schema. DO NOT include any introductory or concluding text outside the JSON object.`;

    const userQuery = `Analyze the following developer profile data to assess their professional level (0-100).
    
    * **Total Public Contributions (Estimate):** ${totalPublicContributions}
    * **Public Repository Count:** ${publicRepos}
    * **Top 3 Languages (Skill Diversity):** ${topLanguages.map(l => l.language).join(', ')}
    * **Activeness Summary (based on recent events):** ${activenessSummary}
    * **Recent Commits:** ${recentCommits.length} recorded in the last 100 events.
    * **Factors to consider:** Consistency (Activeness), Skill Diversification (Languages), Total Contribution Volume, and Engagement (implied by repo count).

    Generate the rating and summary now.`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${API_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    
    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    "rating": {
                        "type": "INTEGER",
                        "description": "The professional skill rating from 0 to 100."
                    },
                    "summary": {
                        "type": "STRING",
                        "description": "A single-paragraph analysis (max 4 sentences) justifying the rating."
                    }
                },
                "propertyOrdering": ["rating", "summary"]
            }
        }
    };

    let result = null;
    let retries = 3;
    while (retries > 0) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Gemini API HTTP Error! Status: ${response.status}`);
            }

            const apiResponse = await response.json();
            const jsonString = apiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
            if (jsonString) {
                // The JSON response from Gemini is returned as a string inside the text field
                result = JSON.parse(jsonString);
                break; // Success
            } else {
                throw new Error("Gemini response was empty or malformed.");
            }
        } catch (error) {
            retries--;
            if (retries === 0) {
                console.error("Gemini API call failed after all retries:", error);
                return { rating: 50, summary: "Could not retrieve advanced rating due to an API error." };
            }
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, 3 - retries) * 1000)); // Exponential backoff
        }
    }
    
    return result;
}

/**
 * Main handler function for the Next.js App Router API route.
 * @param {Request} request - The incoming HTTP request object.
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
        return NextResponse.json(
            { message: 'Missing required parameter: username' },
            { status: 400 }
        );
    }

    try {
        // 1. Fetch Basic User Data
        const userData = await fetchData(`https://api.github.com/users/${username}`);
        const totalPublicContributions = userData.public_gists + userData.public_repos; // Proxy for contribution count
        
        // 2. Fetch Aggregated Data in Parallel
        const [
            topLanguages,
            recentCommits,
            assignedIssuesCount
        ] = await Promise.all([
            fetchTopLanguages(username),
            fetchRecentCommits(username),
            fetchAssignedIssuesCount(username)
        ]);

        // 3. Prepare Activeness Summary (Simple heuristic based on recent commits)
        const activenessScore = recentCommits.length > 5 ? "High (Consistent recent activity)" : "Moderate (Some recent activity)";

        const aggregatedData = {
            username: userData.login,
            name: userData.name,
            totalPublicContributions: totalPublicContributions,
            publicRepos: userData.public_repos,
            topLanguages: topLanguages,
            assignedIssuesCount: assignedIssuesCount,
            recentCommits: recentCommits,
            activenessSummary: activenessScore,
            profileUrl: userData.html_url
        };

        // 4. Get Gemini AI Rating
        const aiRating = await getGeminiRating(aggregatedData);

        // 5. Combine and Return Final Data
        const finalResponse = {
            status: 'success',
            username: aggregatedData.username,
            profileUrl: aggregatedData.profileUrl,
            totalPublicContributions: aggregatedData.totalPublicContributions,
            publicRepos: aggregatedData.publicRepos,
            top3Languages: aggregatedData.topLanguages.map(l => l.language),
            activeness: aggregatedData.activenessSummary,
            issuesAssigned: aggregatedData.assignedIssuesCount,
            past10Commits: aggregatedData.recentCommits,
            geminiRating: {
                ratingOutOf100: aiRating.rating,
                analysis: aiRating.summary
            }
        };

        return NextResponse.json(finalResponse, { status: 200 });

    } catch (error) {
        console.error('Analysis Error:', error.message);
        return NextResponse.json(
            { 
                message: 'Failed to analyze GitHub profile.', 
                details: error.message 
            },
            { status: 500 }
        );
    }
}