import mongoose from 'mongoose';

const linkSchema = new mongoose.Schema({
    url: { type: String, required: true },
    slugs: [{ type: String, required: true }],
    description: { type: String, required: false },
    public: { type: Boolean, required: false, default: true },
    password: { type: String, required: false, default: undefined },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    icon: { type: String, required: false, default: undefined },
    token: { type: String, required: false, default: undefined },
    admin: { type: Boolean, required: false, default: false },
});

const Link = mongoose.model('Link', linkSchema);
const User = mongoose.model('User', userSchema);

export { Link, User };
