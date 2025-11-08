import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import OrgAccount from '@/models/OrgAccount';
import { getOrgSession } from '@/lib/orgAuth';

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

    const orgAccount = await OrgAccount.findById(session.orgId);
    if (!orgAccount) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      repositories: orgAccount.repositories || [],
    });
  } catch (error) {
    console.error('Get repositories error:', error);
    return NextResponse.json(
      { error: 'Failed to get repositories' },
      { status: 500 }
    );
  }
}
