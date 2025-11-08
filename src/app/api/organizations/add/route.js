import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectDB from '@/lib/db';
import Organization from '@/models/Organization';
import User from '@/models/User';

const secret = new TextEncoder().encode(process.env.AUTH0_SECRET || 'your-secret-key-min-32-chars-long!');

/**
 * POST /api/organizations/add
 * Add a GitHub organization to track
 */
export async function POST(request) {
  try {
    // Get session
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, secret);
    
    if (!payload || !payload.email) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const { orgName, orgUrl } = await request.json();

    if (!orgName || !orgUrl) {
      return NextResponse.json(
        { error: 'Organization name and URL are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user
    const user = await User.findOne({ email: payload.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if organization already exists for this user
    const existingOrg = await Organization.findOne({
      userId: user._id,
      orgName,
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization already added' },
        { status: 400 }
      );
    }

    // Verify organization exists on GitHub
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const ghResponse = await fetch(`https://api.github.com/orgs/${orgName}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!ghResponse.ok) {
      return NextResponse.json(
        { error: 'Organization not found on GitHub' },
        { status: 404 }
      );
    }

    // Create organization
    const organization = await Organization.create({
      userId: user._id,
      orgName,
      orgUrl,
      lastPolled: new Date(),
    });

    // Trigger initial issue fetch
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/organizationsdetails/${orgName}/poll`, {
      method: 'POST',
    }).catch(err => console.error('Initial poll failed:', err));

    return NextResponse.json({
      success: true,
      message: `Organization ${orgName} added successfully`,
      organization: {
        id: organization._id,
        name: orgName,
        url: orgUrl,
        addedAt: organization.createdAt,
      },
    });
  } catch (error) {
    console.error('Add organization error:', error);
    return NextResponse.json(
      { error: 'Failed to add organization', details: error.message },
      { status: 500 }
    );
  }
}
