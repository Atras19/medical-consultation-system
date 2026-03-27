const { User, Comment, Reservation, Availability } = require('../database');
const { Op } = require('sequelize');

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        await user.destroy();
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// comments
exports.getAllComments = async (req, res) => {
    try {
        const comments = await Comment.findAll();
        res.json(comments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const comment = await Comment.findByPk(commentId);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });
        
        await comment.destroy();
        res.status(204).send();
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
}

exports.addComment = async (req, res) => {
    try {
        if (req.user.isBanned) {
            return res.status(403).json({ error: 'Twoje konto jest zablokowane. Nie możesz dodawać opinii.' });
        }

        const { doctorId, content, rating } = req.body;
        const authorId = req.user.id;

        // Check if patient had a visit with the doctor
        const hasVisit = await Reservation.findOne({
            where: {
                patientId: authorId,
                doctorId: doctorId,
                status: 'confirmed',
                endDateTime: { [Op.lt]: new Date() }
            }
        });

        if (!hasVisit) {
             return res.status(403).json({ error: 'Only patients who had a visit can comment.' });
        }

        const existing = await Comment.findOne({ where: { doctorId, authorId } });
        if (existing) {
             return res.status(409).json({ error: 'You have already rated this doctor.' });
        }

        const comment = await Comment.create({
            doctorId,
            authorId,
            authorName: `${req.user.firstName} ${req.user.lastName}`,
            content,
            rating,
            date: new Date().toISOString()
        });

        res.status(201).json(comment);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getDoctorComments = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const comments = await Comment.findAll({ where: { doctorId } });
        res.json(comments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Reply to comment (Doctor)
exports.replyToComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { reply } = req.body;
        const doctorId = req.user.id;

        const comment = await Comment.findByPk(commentId);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });

        if (comment.doctorId !== doctorId) {
            return res.status(403).json({ error: 'You can only reply to comments on your profile.' });
        }

        comment.reply = reply;
        await comment.save();
        
        res.json(comment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Admin Bans
exports.banUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.role === 'doctor') {
            return res.status(400).json({ error: 'Cannot ban doctors' });
        }

        user.isBanned = true;
        await user.save();
        
        res.json({ message: 'User banned' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.unbanUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.isBanned = false;
        await user.save();
        
        res.json({ message: 'User unbanned' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({ attributes: { exclude: ['password', 'refreshToken', 'lastSessionId'] } });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
