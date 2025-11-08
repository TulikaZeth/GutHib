import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import OrgAccount from '@/models/OrgAccount';
import { createOrgSession } from '@/lib/orgAuth';

export async function POST(request) {
  try {
    const { email, password, orgName, githubOrgName, description } = await request.json();

    if (!email || !password || !orgName) {
      return NextResponse.json(
        { error: 'Email, password, and organization name are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if organization already exists
    const existingOrg = await OrgAccount.findOne({ email: email.toLowerCase() });
    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization already exists' },
        { status: 400 }
      );
    }

    // Verify GitHub organization exists (optional - only if GitHub token is available)
    if (githubOrgName && process.env.GITHUB_TOKEN) {
      try {
        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const ghResponse = await fetch(`https://api.github.com/orgs/${githubOrgName}`, {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });

        // Only warn if org not found, but continue with registration
        if (!ghResponse.ok) {
          console.warn(`GitHub organization '${githubOrgName}' not found, but continuing with registration`);
        }
      } catch (error) {
        // If GitHub verification fails, just log and continue
        console.warn('GitHub verification failed:', error.message);
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create organization account
    const orgAccount = await OrgAccount.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      orgName,
      githubOrgName,
      description: description || '',
    });

    // Create session
    await createOrgSession({
      orgId: orgAccount._id.toString(),
      email: orgAccount.email,
      type: 'organization',
    });

    return NextResponse.json({
      success: true,
      message: 'Organization registered successfully',
      organization: {
        id: orgAccount._id,
        email: orgAccount.email,
        orgName: orgAccount.orgName,
        githubOrgName: orgAccount.githubOrgName,
      },
    });
  } catch (error) {
    console.error('Organization registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register organization', details: error.message },
      { status: 500 }
    );
  }
}
