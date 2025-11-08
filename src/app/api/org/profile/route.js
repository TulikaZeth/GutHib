import { NextResponse } from 'next/server';
import { getOrgSession } from '@/lib/orgAuth';
import connectDB from '@/lib/db';
import OrgAccount from '@/models/OrgAccount';

export async function GET() {
  try {
    const session = await getOrgSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const orgAccount = await OrgAccount.findById(session.orgId).select('-password');
    
    if (!orgAccount) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      organization: orgAccount,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: 500 }
    );
  }
}
