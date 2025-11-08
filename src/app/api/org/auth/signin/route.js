import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import OrgAccount from '@/models/OrgAccount';
import { createOrgSession } from '@/lib/orgAuth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find organization
    const orgAccount = await OrgAccount.findOne({ email: email.toLowerCase() });
    if (!orgAccount) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, orgAccount.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create session
    await createOrgSession({
      orgId: orgAccount._id.toString(),
      email: orgAccount.email,
      type: 'organization',
    });

    return NextResponse.json({
      success: true,
      message: 'Signed in successfully',
      organization: {
        id: orgAccount._id,
        email: orgAccount.email,
        orgName: orgAccount.orgName,
        githubOrgName: orgAccount.githubOrgName,
      },
    });
  } catch (error) {
    console.error('Organization signin error:', error);
    return NextResponse.json(
      { error: 'Failed to sign in', details: error.message },
      { status: 500 }
    );
  }
}
