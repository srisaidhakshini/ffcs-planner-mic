/**
 * Seed script: populates the Course collection from all data/ school files.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import mongoose from 'mongoose';
import { getCourseType } from '../lib/course_codes_map';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// ── Import school data ────────────────────────────────────────────────────────

import { SCOPE_LIST } from '../data/SCOPE/index';
import { SCOPE_F } from '../data/SCOPE_F/index';
import { SCORE_LIST } from '../data/SCORE/index';
import { SCORE_F } from '../data/SCORE_F/index';
import { SBST_LIST } from '../data/SBST/index';
import { SBST_F } from '../data/SBST_F/index';
import { SCE_LIST } from '../data/SCE/index';
import { SENSE_LIST } from '../data/SENSE/index';
import { SENSE_F } from '../data/SENSE_F/index';
import { SELECT_LIST } from '../data/SELECT/index';
import { SELECT_F } from '../data/SELECT_F/index';
import { SHINE_LIST } from '../data/SHINE/index';
import { SHINE_F } from '../data/SHINE_F/index';
import { SMEC_LIST } from '../data/SMEC/index';
import { SMEC_F } from '../data/SMEC_F/index';
import { SCHEME_LIST } from '../data/SCHEME/index';
import { MTech_SCOPE } from '../data/MTech_SCOPE/index';
import { MIS_LIST } from '../data/MTech_SCORE/index';

// ── Types ───────────────────────────────────────────────────────────────────

type Offering = { slot: string; venue: string; faculty: string };
type SchoolCategoryMap = Record<string, Offering[]>;
type SchoolList = Record<string, SchoolCategoryMap>;

interface CourseDoc {
    courseId: string;
    courseName: string;
    school: string;
    courseType: 'th' | 'lab' | 'both';
    offerings: Offering[];
}

// ── School registry ─────────────────────────────────────────────────────────

const ALL_SCHOOLS: Record<string, SchoolList> = {
    SCOPE: SCOPE_LIST as SchoolList,
    SCOPE_F: SCOPE_F as SchoolList,
    SCORE: SCORE_LIST as SchoolList,
    SCORE_F: SCORE_F as SchoolList,
    SBST: SBST_LIST as SchoolList,
    SBST_F: SBST_F as SchoolList,
    SCE: SCE_LIST as SchoolList,
    SENSE: SENSE_LIST as SchoolList,
    SENSE_F: SENSE_F as SchoolList,
    SELECT: SELECT_LIST as SchoolList,
    SELECT_F: SELECT_F as SchoolList,
    SHINE: SHINE_LIST as SchoolList,
    SHINE_F: SHINE_F as SchoolList,
    SMEC: SMEC_LIST as SchoolList,
    SMEC_F: SMEC_F as SchoolList,
    SCHEME: SCHEME_LIST as SchoolList,
    MTech_SCOPE: MTech_SCOPE as SchoolList,
    MTech_SCORE: MIS_LIST as SchoolList,
};

/**
 * Parses "BCSE202L - Data Structures and Algorithms" into
 * { courseId: "BCSE202L", courseName: "Data Structures and Algorithms" }
 */
function parseKey(key: string): { courseId: string; courseName: string } {
    const dashIdx = key.indexOf(' - ');
    if (dashIdx === -1) return { courseId: key.trim(), courseName: key.trim() };
    return {
        courseId: key.slice(0, dashIdx).trim(),
        courseName: key.slice(dashIdx + 3).trim(),
    };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI is not set in .env.local');
        process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);

    const courseSchema = new mongoose.Schema({
        courseId: { type: String, required: true },
        courseName: { type: String, required: true },
        school: { type: String, required: true },
        courseType: { type: String, enum: ['th', 'lab', 'both'], default: 'th' },
        offerings: [{ faculty: String, slot: String, venue: String, _id: false }],
    });
    courseSchema.index({ courseId: 1, school: 1 }, { unique: true });
    courseSchema.index({ courseId: 'text', courseName: 'text' });

    const CourseModel =
        (mongoose.models.Course as mongoose.Model<typeof courseSchema>) ||
        mongoose.model('Course', courseSchema);

    const docs: CourseDoc[] = [];

    for (const [school, categories] of Object.entries(ALL_SCHOOLS)) {
        for (const categoryMap of Object.values(categories)) {
            for (const [key, offerings] of Object.entries(categoryMap)) {
                const { courseId, courseName } = parseKey(key);
                docs.push({
                    courseId,
                    courseName,
                    school,
                    courseType: getCourseType(courseId),
                    offerings: offerings as Offering[],
                });
            }
        }
    }

    console.log(`Seeding ${docs.length} course entries...`);

    await CourseModel.deleteMany({});
    await CourseModel.insertMany(docs, { ordered: false });

    console.log(`Successfully seeded ${docs.length} courses into MongoDB.`);
    await mongoose.disconnect();
}

main().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
