import mongoose, { Schema, InferSchemaType, Model } from 'mongoose';

const offeringSchema = new Schema(
    {
        faculty: { type: String, required: true },
        slot: { type: String, required: true },
        venue: { type: String, default: '' },
    },
    { _id: false }
);

const courseSchema = new Schema(
    {
        courseId: { type: String, required: true },
        courseName: { type: String, required: true },
        school: { type: String, required: true },
        courseType: { type: String, enum: ['th', 'lab', 'both'], default: 'th' },
        offerings: [offeringSchema],
    },
    { timestamps: false }
);

courseSchema.index({ courseId: 1 });

courseSchema.index({ courseId: 1, school: 1 }, { unique: true });

courseSchema.index({ courseId: 'text', courseName: 'text' });

export type ICourse = InferSchemaType<typeof courseSchema>;

const Course: Model<ICourse> =
    mongoose.models.Course || mongoose.model<ICourse>('Course', courseSchema);

export default Course;
