import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Course from '@/models/course';

export const dynamic = 'force-dynamic';

/**
 * GET /api/courses?q=BCSE202&school=SCOPE&limit=20
 *
 * Search for courses by courseId or courseName.
 * Results are ordered by relevance (text score) when a query is given,
 * otherwise returns the first `limit` courses.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() ?? '';
    const school = searchParams.get('school')?.trim();
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);

    await dbConnect();

    const filter: Record<string, any> = {};

    if (q) {
        const regex = new RegExp(q, 'i');
        filter.$or = [{ courseId: regex }, { courseName: regex }];
    }

    if (school) {
        filter.school = school;
    }

    const courses = await Course.find(filter)
        .select('-__v')
        .limit(limit)
        .lean();

    return NextResponse.json({ success: true, courses });
}
