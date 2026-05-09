const Message = require('../models/Message');

// @desc    Lichkaga xabar yozish
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res, next) => {
    try {
        const { receiverId, text } = req.body;
        if (!receiverId || !text) return res.status(400).json({ success: false, message: "Ma'lumot to'liq emas" });

        const message = await Message.create({ sender: req.user.id, receiver: receiverId, text });
        res.status(201).json({ success: true, data: message });
    } catch (error) { next(error); }
};

// @desc    Bir foydalanuvchi bilan bo'lgan barcha xabarlarni olish
// @route   GET /api/messages/:userId
// @access  Private
exports.getMessages = async (req, res, next) => {
    try {
        const myId = req.user.id;
        const otherId = req.params.userId;

        // O'qilgan qilib belgilash
        await Message.updateMany({ sender: otherId, receiver: myId, isRead: false }, { isRead: true });

        const messages = await Message.find({
            $or: [
                { sender: myId, receiver: otherId },
                { sender: otherId, receiver: myId }
            ]
        }).sort({ createdAt: 1 });

        res.status(200).json({ success: true, data: messages });
    } catch (error) { next(error); }
};

// @desc    Pochtam (Inbox) uchun barcha suhbatlarni guruhlab olish
// @route   GET /api/messages/inbox/conversations
// @access  Private
exports.getConversations = async (req, res, next) => {
    try {
        const myId = req.user.id;
        const messages = await Message.find({ $or: [{ sender: myId }, { receiver: myId }] })
            .sort({ createdAt: -1 })
            .populate('sender receiver', 'firstName lastName');

        const conversations = {};

        messages.forEach(msg => {
            const otherUser = msg.sender._id.toString() === myId ? msg.receiver : msg.sender;
            const otherId = otherUser._id.toString();

            if (!conversations[otherId]) {
                conversations[otherId] = {
                    user: otherUser,
                    lastMessage: msg,
                    unreadCount: (msg.receiver._id.toString() === myId && !msg.isRead) ? 1 : 0
                };
            } else {
                if (msg.receiver._id.toString() === myId && !msg.isRead) {
                    conversations[otherId].unreadCount += 1;
                }
            }
        });

        const sortedConversations = Object.values(conversations).sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));
        res.status(200).json({ success: true, data: sortedConversations });
    } catch (error) { next(error); }
};