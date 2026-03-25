import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Timetable from '@/models/timetable';

// Prevent Next.js from caching this route
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    await dbConnect();

    const shareId = req.nextUrl.pathname.split('/').pop();

    if (!shareId) {
        return NextResponse.json({ error: 'Missing shareId' }, { status: 400 });
    }

    try {
        const timetable = await Timetable.findOne({ shareId });

        if (!timetable) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const NO_STORE_HEADERS = {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
        };

        // Any timetable with a shareId can be viewed via share link.
        // The shareId itself acts as access control.
        return NextResponse.json({
            success: true,
            timetable: {
                title: timetable.title,
                slots: timetable.slots,
                owner: timetable.owner,
                shareId: timetable.shareId,
            },
        }, { headers: NO_STORE_HEADERS });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
