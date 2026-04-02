const { RefreshToken, sequelize } = require('../../infrastructure/repositories/models');
const { hashToken } = require('../../shared/utils/tokenHash');

class RefreshTokenService {
    async create(userId, refreshToken, transaction = null) {
        const hashed = hashToken(refreshToken);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

        await RefreshToken.create(
            {
                user_id: userId,
                token_hash: hashed,
                expires_at: expiresAt,
            },
            { transaction }
        );
    }

    async revokeAllForUser(userId, transaction = null) {
        await RefreshToken.update(
            { revoked: true },
            { where: { user_id: userId }, transaction }
        );
    }

    async findValidToken(userId, refreshToken) {
        const hashed = hashToken(refreshToken);
        const storedToken = await RefreshToken.findOne({
            where: {
                user_id: userId,
                token_hash: hashed,
                revoked: false,
            },
        });
        if (!storedToken) return null;
        if (new Date() > storedToken.expires_at) return null;
        return storedToken;
    }

    async revokeByToken(refreshToken) {
        const hashed = hashToken(refreshToken);
        await RefreshToken.update(
            { revoked: true },
            { where: { token_hash: hashed } }
        );
    }

    async rotate(userId, oldRefreshToken, newRefreshToken) {
        return await sequelize.transaction(async (t) => {
            await RefreshToken.update(
                { revoked: true },
                { where: { user_id: userId, token_hash: hashToken(oldRefreshToken) }, transaction: t }
            );
            await this.create(userId, newRefreshToken, t);
        });
    }
}



module.exports = new RefreshTokenService();