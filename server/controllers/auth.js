const users = require('../models/users')

module.exports = {
  async createUser (username, password) {
    try {
      await users.create(username, password)
    } catch (err) {
      throw err
    }
  },
  async updateUser (userId, data) {
    try {
      await users.update(userId, data)
    } catch (err) {
      throw err
    }
  },
  deleteUser (userId) {
    users.delete(userId)
  },
  getUserByName (username) {
    return users.getByName(username)
  },
  async getValidUser (username, password) {
    try {
      return await users.getValidUser(username, password)
    } catch (err) {
      throw err
    }
  },
  createToken (userId, long) {
    let expires = Math.floor(Date.now() / 1000) + 86400 // 1 day

    if (long) {
      expires = Math.floor(Date.now() / 1000) + 7776000 // 90 days
    }

    return users.createToken(userId, expires)
  },
  deleteTokens (userId, hash, all) {
    if (all) {
      users.deleteTokens(userId)
    }

    users.deleteTokens(userId, hash)
  },
  validateTokenAndGetUserId (hash) {
    const token = users.getTokenByHash(hash)

    if (
      !token ||
      (token.expires && token.expires < Math.floor(Date.now() / 1000))
    ) {
      return false
    }

    return users.getById(token.userId).id
  }
}
