import { NextResponse } from 'next/server';
import { getOrgSession } from '@/lib/orgAuth';
import connectDB from '@/lib/db';
import OrgIssueAssignment from '@/models/OrgIssueAssignment';

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

    const assignments = await OrgIssueAssignment.find({
      orgAccountId: session.orgId,
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      assignments,
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    return NextResponse.json(
      { error: 'Failed to get assignments' },
      { status: 500 }
    );
  }
}
