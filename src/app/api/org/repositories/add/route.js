import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import OrgAccount from '@/models/OrgAccount';
import { getOrgSession } from '@/lib/orgAuth';

export async function POST(request) {
  try {
    const session = await getOrgSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { repoUrl } = await request.json();

    if (!repoUrl) {
      return NextResponse.json(
        { error: 'Repository URL is required' },
        { status: 400 }
      );
    }

    // Parse GitHub URL
    const urlPattern = /github\.com\/([^\/]+)\/([^\/]+)/;
    const match = repoUrl.match(urlPattern);

    if (!match) {
      return NextResponse.json(
        { error: 'Invalid GitHub repository URL' },
        { status: 400 }
      );
    }

    const repoOwner = match[1];
    const repoName = match[2].replace('.git', '');
    const fullName = `${repoOwner}/${repoName}`;

    await connectDB();

    // Get organization account
    const orgAccount = await OrgAccount.findById(session.orgId);
    if (!orgAccount) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if repository already added
    const existingRepo = orgAccount.repositories.find(
      r => r.repoName === fullName
    );

    if (existingRepo) {
      return NextResponse.json(
        { error: 'Repository already added' },
        { status: 400 }
      );
    }

    // Verify repository exists on GitHub
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const ghResponse = await fetch(`https://api.github.com/repos/${fullName}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!ghResponse.ok) {
      return NextResponse.json(
        { error: 'Repository not found on GitHub' },
        { status: 404 }
      );
    }

    const repoData = await ghResponse.json();

    // Add repository to organization
    orgAccount.repositories.push({
      repoName: fullName,
      repoUrl: repoData.html_url,
      addedAt: new Date(),
    });

    await orgAccount.save();

    return NextResponse.json({
      success: true,
      message: 'Repository added successfully',
      repository: {
        repoName: fullName,
        repoUrl: repoData.html_url,
      },
    });
  } catch (error) {
    console.error('Add repository error:', error);
    return NextResponse.json(
      { error: 'Failed to add repository', details: error.message },
      { status: 500 }
    );
  }
}
