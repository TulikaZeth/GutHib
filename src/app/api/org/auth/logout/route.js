import { NextResponse } from 'next/server';
import { destroyOrgSession } from '@/lib/orgAuth';

export async function POST() {
  try {
    await destroyOrgSession();

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
