// Next.js App Router API route for the GitHub Analysis tool.
// This file was moved here so the App Router recognizes the GET handler.
import { NextResponse } from 'next/server';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const API_MODEL = 'gemini-2.5-flash-preview-09-2025';

// --- Utility Functions ---

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
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
}

async function fetchTopLanguages(username) {
    // Fetch all repos and aggregate languages (reuse same pattern as fetchAllRepos)
    const repos = await fetchData(`https://api.github.com/users/${username}/repos?per_page=100`);
    if (!Array.isArray(repos)) return [];

    const allLanguages = {};
    const languagePromises = repos.map(repo =>
        fetchData(repo.languages_url).catch(e => {
            console.error(`Failed to fetch languages for ${repo.name}: ${e.message}`);
            return {};
        })
    );
    const repoLanguages = await Promise.all(languagePromises);

    repoLanguages.forEach(langObj => {
        for (const lang in langObj) {
            allLanguages[lang] = (allLanguages[lang] || 0) + langObj[lang];
        }
    });

    const sortedLanguages = Object.entries(allLanguages)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([language, bytes]) => ({ language, bytes }));

    return sortedLanguages;
}

async function fetchAllRepos(username) {
    const repos = [];
    let page = 1;
    while (page <= 3) {
        const batch = await fetchData(`https://api.github.com/users/${username}/repos?per_page=100&page=${page}`);
        if (!Array.isArray(batch) || batch.length === 0) break;
        repos.push(...batch);
        if (batch.length < 100) break;
        page++;
    }
    return repos;
}

async function fetchGitHub(url, extraHeaders = {}, retries = 3) {
    const headers = {
        'Content-Type': 'application/json',
        ...extraHeaders
    };
    if (GITHUB_TOKEN) headers['Authorization'] = `token ${GITHUB_TOKEN}`;

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, { headers });
            if (!response.ok) {
                if (response.status === 403 && i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
                    continue;
                }
                throw new Error(`GitHub API Error (${response.status}): ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
}

/**
 * Get commits across all repos by this author since `sinceDate` (ISO string).
 */
async function fetchCommitsSince(username, sinceDate) {
    const repos = await fetchAllRepos(username);
    const commits = [];
    const sinceParam = encodeURIComponent(sinceDate);

    // Limit parallelism to avoid rate limit bursts: process sequentially here for reliability.
    for (const repo of repos) {
        const owner = repo.owner?.login;
        const name = repo.name;
        if (!owner || !name) continue;
        try {
            const url = `https://api.github.com/repos/${owner}/${name}/commits?author=${encodeURIComponent(username)}&since=${sinceParam}&per_page=100`;
            const repoCommits = await fetchGitHub(url);
            if (Array.isArray(repoCommits)) {
                for (const c of repoCommits) {
                    commits.push({
                        sha: c.sha?.substring(0, 7) || null,
                        message: c.commit?.message || null,
                        repo: `${owner}/${name}`,
                        date: c.commit?.author?.date || c.commit?.committer?.date || null,
                        url: c.html_url || null
                    });
                }
            }
        } catch (e) {
            // ignore repo errors but log
            console.error(`Failed to fetch commits for ${repo.name}: ${e.message}`);
        }
    }

    // sort by date desc
    commits.sort((a, b) => new Date(b.date) - new Date(a.date));
    return commits;
}

/**
 * Use the Search Commits API to estimate total commits by author (requires auth for reliable results).
 */
async function fetchTotalCommits(username) {
    try {
        const url = `https://api.github.com/search/commits?q=author:${encodeURIComponent(username)}&per_page=1`;
        // Search commits requires a special Accept header
        const res = await fetchGitHub(url, { Accept: 'application/vnd.github.cloak-preview+json' });
        if (res && typeof res.total_count === 'number') return res.total_count;
    } catch (e) {
        console.error('Search commits failed:', e.message);
    }
    return null; // unknown
}

async function fetchRecentCommits(username) {
    const events = await fetchData(`https://api.github.com/users/${username}/events?per_page=100`);
    // Ensure events is an array
    if (!Array.isArray(events)) return [];

    const commits = [];
    for (const event of events) {
        // Guard: event and payload must exist and commits must be an array
        if (event && event.type === 'PushEvent' && event.payload && Array.isArray(event.payload.commits)) {
            for (const commit of event.payload.commits) {
                if (commits.length >= 10) break;

                // Be defensive: commit may be an object or a string in some cases
                const rawSha = commit && (commit.sha || commit.id || '');
                const sha = rawSha ? String(rawSha).substring(0, 7) : null;
                const message = commit && (commit.message || (typeof commit === 'string' ? commit : ''));

                commits.push({
                    sha,
                    message,
                    repo: event.repo?.name || null,
                    date: event.created_at || null,
                });
            }
        }

        if (commits.length >= 10) break;
    }

    return commits;
}

/**
 * Fallback: fetch recent commits per repo (no 'since') until we collect `limit` commits.
 */
async function fetchRecentCommitsFallback(username, limit = 10) {
    const repos = await fetchAllRepos(username);
    const commits = [];
    for (const repo of repos) {
        if (commits.length >= limit) break;
        const owner = repo.owner?.login;
        const name = repo.name;
        if (!owner || !name) continue;
        try {
            const url = `https://api.github.com/repos/${owner}/${name}/commits?author=${encodeURIComponent(username)}&per_page=5`;
            const repoCommits = await fetchGitHub(url);
            if (Array.isArray(repoCommits)) {
                for (const c of repoCommits) {
                    if (commits.length >= limit) break;
                    commits.push({
                        sha: c.sha?.substring(0, 7) || null,
                        message: c.commit?.message || null,
                        repo: `${owner}/${name}`,
                        date: c.commit?.author?.date || c.commit?.committer?.date || null,
                        url: c.html_url || null
                    });
                }
            }
        } catch (e) {
            console.error(`Fallback commit fetch failed for ${repo.name}: ${e.message}`);
        }
    }
    commits.sort((a, b) => new Date(b.date) - new Date(a.date));
    return commits;
}

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

async function getGeminiRating(data) {
    if (!GEMINI_API_KEY) {
        return { rating: 50, summary: "Gemini API key is missing. Cannot generate advanced rating." };
    }

    const {
        activenessSummary,
        topLanguages,
        totalPublicContributions,
        publicRepos,
        recentCommits,
        commitsLast30Days,
        commitsLast30DaysCount,
        topRepos
    } = data;

    const systemPrompt = `You are a world-class AI Career Analyst. Your task is to provide a comprehensive, objective rating (0-100) and a clear, actionable summary of a GitHub developer's profile based on the provided technical data. Use the quantitative signals (commit counts, recent activity, top languages, repo quality) to justify your rating. Keep the summary concise (max 4 sentences) and output strictly as a JSON object with properties: rating (integer 0-100) and summary (string).`;

    const userQuery = `Analyze this developer profile and produce a rating (0-100) and a concise summary (max 4 sentences). Provide evidence-based reasoning referencing these metrics:

* Total public commits (estimate): ${totalPublicContributions ?? 'unknown'}
* Public repository count: ${publicRepos}
* Top 3 languages: ${topLanguages.map(l => l.language).join(', ')}
* Commits in the last 30 days: ${commitsLast30DaysCount}
* Recent activity description: ${activenessSummary}
* Top repositories by stars (up to 3): ${topRepos.map(r => `${r.name} (⭐${r.stargazers_count})`).join('; ') || 'none'}

Also consider the sample of most recent commits (presented separately) when judging code quality, consistency, and momentum.`;

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
                result = JSON.parse(jsonString);
                break;
            } else {
                throw new Error("Gemini response was empty or malformed.");
            }
        } catch (error) {
            retries--;
            if (retries === 0) {
                console.error("Gemini API call failed after all retries:", error);
                return { rating: 50, summary: "Could not retrieve advanced rating due to an API error." };
            }
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, 3 - retries) * 1000));
        }
    }
    
    return result;
}

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
        const userData = await fetchData(`https://api.github.com/users/${username}`);
        const totalPublicContributions = userData.public_gists + userData.public_repos;

        // Gather richer data in parallel where possible
        const [ topLanguages, recentCommits, assignedIssuesCount, allRepos ] = await Promise.all([
            fetchTopLanguages(username),
            fetchRecentCommits(username),
            fetchAssignedIssuesCount(username),
            fetchAllRepos(username)
        ]);

        // Try to compute total commits via Search API (may return null if not available)
        const totalCommitsAvailable = await fetchTotalCommits(username);

        // Commits in last 30 days
        const sinceDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const commitsLast30Days = await fetchCommitsSince(username, sinceDate);
        const commitsLast30DaysCount = commitsLast30Days.length;

        const activenessScore = commitsLast30DaysCount > 5 ? "High (Consistent recent activity in last 30 days)" : (recentCommits.length > 5 ? "Moderate (Some recent activity)" : "Low (Little recent activity)");

        // Top repos by stars
        const topRepos = (Array.isArray(allRepos) ? allRepos.sort((a,b)=> (b.stargazers_count||0) - (a.stargazers_count||0)).slice(0,3) : []);

        // Build a combined recent commits list (last 30 days + push events), dedupe and sort
        const combined = [...commitsLast30Days, ...recentCommits].filter(Boolean);
        const uniqueMap = new Map();
        for (const c of combined) {
            const key = c.sha || `${c.repo}:${c.message}:${c.date}`;
            if (!uniqueMap.has(key)) uniqueMap.set(key, c);
        }
        let combinedCommits = Array.from(uniqueMap.values()).sort((a,b)=> new Date(b.date) - new Date(a.date));

        // If not enough commits, use fallback to fetch recent commits per-repo
        if (combinedCommits.length < 10) {
            const needed = 10 - combinedCommits.length;
            const fallback = await fetchRecentCommitsFallback(username, needed);
            for (const c of fallback) {
                const key = c.sha || `${c.repo}:${c.message}:${c.date}`;
                if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, c);
                }
            }
            combinedCommits = Array.from(uniqueMap.values()).sort((a,b)=> new Date(b.date) - new Date(a.date));
        }

        const past10Commits = combinedCommits.slice(0, 10);

        const aggregatedData = {
            username: userData.login,
            name: userData.name,
            // prefer total commits estimate if available
            totalPublicContributions: totalCommitsAvailable !== null ? totalCommitsAvailable : totalPublicContributions,
            publicRepos: userData.public_repos,
            topLanguages: topLanguages,
            assignedIssuesCount: assignedIssuesCount,
            recentCommits: recentCommits,
            commitsLast30Days: commitsLast30Days,
            commitsLast30DaysCount: commitsLast30DaysCount,
            activenessSummary: activenessScore,
            topRepos: topRepos,
            past10Commits: past10Commits,
            profileUrl: userData.html_url
        };

        const aiRating = await getGeminiRating(aggregatedData);

        const finalResponse = {
            status: 'success',
            username: aggregatedData.username,
            profileUrl: aggregatedData.profileUrl,
            totalPublicContributions: aggregatedData.totalPublicContributions,
            publicRepos: aggregatedData.publicRepos,
            top3Languages: aggregatedData.topLanguages.map(l => l.language),
            activeness: aggregatedData.activenessSummary,
            issuesAssigned: aggregatedData.assignedIssuesCount,
            past10Commits: aggregatedData.past10Commits,
            commitsLast30DaysCount: aggregatedData.commitsLast30DaysCount,
            commitsLast30DaysSample: aggregatedData.commitsLast30Days.slice(0, 10),
            topRepos: aggregatedData.topRepos.map(r => ({ name: r.name, stargazers_count: r.stargazers_count, url: r.html_url })),
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
