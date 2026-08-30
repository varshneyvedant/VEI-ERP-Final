import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const role = (session.user as any).role?.toLowerCase();
    if (role !== 'manager' && role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { pin } = await request.json();
    const overridePin = process.env.OVERRIDE_PIN || '1234';

    if (pin === overridePin) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid PIN' }, { status: 403 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
