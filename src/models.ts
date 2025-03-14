import mongoose from 'mongoose';

const linkSchema = new mongoose.Schema({
    url: { type: String, required: true },
    slugs: [{ type: String, required: true }],
    description: { type: String, required: false },
    password: { type: String, required: false, default: null },
    createdAt: { type: Date, required: true, default: Date.now },
    clicks: { type: Number, required: false, default: 0 },
});

const Link = mongoose.model('Link', linkSchema);

export { Link };
