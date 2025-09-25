const User = require('../models/User');
const Follow = require('../models/Follow'); // IMPORT Follow model

async function getPopularUsers(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const currentUserId = req.user?._id;
    
    // Creator's hashId - highest priority
    const CREATOR_HASH_ID = '0xad7dc58c35f5eee770e24fddb413493535928d56';

    if (!currentUserId) {
      // Nếu chưa đăng nhập: trả về user popular nhất với creator ở đầu
      const creatorUser = await User.findOne({ hashId: CREATOR_HASH_ID })
        .select('_id username displayName avatar followerCount hashId')
        .lean();
      
      const popularUsers = await User.find({ hashId: { $ne: CREATOR_HASH_ID } })
        .sort({ followerCount: -1, createdAt: -1 })
        .limit(limit - 1) // Reserve 1 slot for creator
        .select('_id username displayName avatar followerCount')
        .lean();
      
      const result = [];
      if (creatorUser) {
        result.push({
          ...creatorUser,
          suggestionType: 'creator',
          isFollowing: false
        });
      }
      result.push(...popularUsers.map(user => ({
        ...user,
        suggestionType: 'popular',
        isFollowing: false
      })));
      
      return res.json({ success: true, message: 'Popular users fetched', data: result });
    }

    // 0. PRIORITY HIGHEST: Creator (nếu chưa follow và không phải chính mình)
    const creatorUser = await User.findOne({ hashId: CREATOR_HASH_ID })
      .select('_id username displayName avatar followerCount hashId')
      .lean();

    // 1. Lấy danh sách người đang FOLLOW bạn (từ Follow model)
    const userFollowers = await Follow.find({ following: currentUserId })
      .populate('follower', '_id username displayName avatar followerCount')
      .lean();

    const followersList = userFollowers.map(follow => follow.follower);

    // 2. Lấy danh sách người bạn ĐANG FOLLOW (từ Follow model)
    const userFollowing = await Follow.find({ follower: currentUserId })
      .select('following')
      .lean();
    
    const followingIds = userFollowing.map(follow => follow.following.toString());

    // 3. Tìm user mới (không follow nhau, không phải chính mình, không phải creator)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsers = await User.find({
      _id: { $ne: currentUserId },
      _id: { $nin: followingIds }, // Chưa follow
      hashId: { $ne: CREATOR_HASH_ID }, // Không phải creator
      createdAt: { $gte: thirtyDaysAgo }
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('_id username displayName avatar followerCount createdAt')
      .lean();

    // 4. Tìm user popular (không follow nhau, không phải chính mình, không phải creator)
    const popularUsers = await User.find({
      _id: { $ne: currentUserId },
      _id: { $nin: followingIds }, // Chưa follow
      hashId: { $ne: CREATOR_HASH_ID }, // Không phải creator
      followerCount: { $gte: 10 } // Có ít nhất 10 followers
    })
      .sort({ followerCount: -1, createdAt: -1 })
      .limit(limit)
      .select('_id username displayName avatar followerCount')
      .lean();

    // 5. Kết hợp và Ưu tiên: Creator > Người follow bạn > User mới > User popular
    let suggestions = [];
    
    // ƯU TIÊN TUYỆT ĐỐI: Creator (nếu không phải chính mình và chưa follow)
    if (creatorUser && 
        creatorUser._id.toString() !== currentUserId.toString() && 
        !followingIds.includes(creatorUser._id.toString())) {
      suggestions.push({
        ...creatorUser,
        suggestionType: 'creator',
        isFollowing: false
      });
    }
    
    // Ưu tiên 1: Người đang follow bạn (chưa được follow back)
    const notFollowedBack = followersList.filter(follower => 
      !followingIds.includes(follower._id.toString()) &&
      follower._id.toString() !== creatorUser?._id.toString() // Tránh duplicate creator
    );
    
    const remainingSlotsAfterCreator = limit - suggestions.length;
    if (remainingSlotsAfterCreator > 0 && notFollowedBack.length > 0) {
      const slotsForFollowers = Math.min(2, remainingSlotsAfterCreator);
      suggestions.push(...notFollowedBack.slice(0, slotsForFollowers).map(user => ({
        ...user,
        suggestionType: 'follows_you',
        isFollowing: false
      })));
    }

    // Ưu tiên 2: User mới (nếu còn slot)
    const remainingSlots = limit - suggestions.length;
    if (remainingSlots > 0 && newUsers.length > 0) {
      suggestions.push(...newUsers.slice(0, remainingSlots).map(user => ({
        ...user,
        suggestionType: 'new_user',
        isFollowing: false
      })));
    }

    // Ưu tiên 3: User popular (nếu vẫn còn slot)
    const finalSlots = limit - suggestions.length;
    if (finalSlots > 0 && popularUsers.length > 0) {
      suggestions.push(...popularUsers.slice(0, finalSlots).map(user => ({
        ...user,
        suggestionType: 'popular',
        isFollowing: false
      })));
    }

    // 6. Thêm trạng thái follow (kiểm tra lại để chắc chắn)
    suggestions = suggestions.map(user => ({
      ...user,
      isFollowing: followingIds.includes(user._id.toString())
    }));

    res.json({ success: true, message: 'Popular users fetched', data: suggestions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

module.exports = {
  getPopularUsers,
};