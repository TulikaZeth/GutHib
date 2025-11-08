import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import OrgAccount from '@/models/OrgAccount';
import { createOrgSession } from '@/lib/orgAuth';

export async function POST(request) {
  try {
    const { email, password, orgName, githubOrgName, description } = await request.json();

    if (!email || !password || !orgName || !githubOrgName) {
      return NextResponse.json(
        { error: 'Email, password, organization name, and GitHub org name are required' },
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

    // Verify GitHub organization exists
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const ghResponse = await fetch(`https://api.github.com/orgs/${githubOrgName}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!ghResponse.ok) {
      return NextResponse.json(
        { error: 'GitHub organization not found' },
        { status: 404 }
      );
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
