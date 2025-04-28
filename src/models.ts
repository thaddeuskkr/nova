import mongoose from 'mongoose';

export const linkSchema = new mongoose.Schema({
    url: { type: String, required: true },
    slugs: [{ type: String, required: true }],
    description: { type: String, required: false },
    password: { type: String, required: false, default: null },
    createdAt: { type: Date, required: true, default: Date.now },
    expiry: { type: Date, required: false, default: null },
    clicks: { type: Number, required: false, default: 0 },
});

export const userSchema = new mongoose.Schema({
    sub: { type: String, required: true },
    name: { type: String, required: false },
    given_name: { type: String, required: false },
    family_name: { type: String, required: false },
    picture: { type: String, required: false },
    email: { type: String, required: true },
    email_verified: { type: Boolean, required: true },
    token: { type: String, required: false },
});

const Link = mongoose.model('Link', linkSchema);
const User = mongoose.model('User', userSchema);

export { Link, User };
