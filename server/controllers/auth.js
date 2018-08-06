const users = require('../models/users')
const tokens = require('../models/tokens')

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
  async getValidUser (nameOrId, password, getByName = false) {
    try {
      if (getByName) {
        return await users.getValid(nameOrId, password, true)
      }

      return await users.getValid(nameOrId, password)
    } catch (err) {
      throw err
    }
  },
  createToken (userId, long) {
    let expires = Math.floor(Date.now() / 1000) + 86400

    if (long) {
      expires = Math.floor(Date.now() / 1000) + 7776000
    }

    return tokens.create(userId, expires)
  },
  deleteTokens (userId, hash, all) {
    if (all) {
      tokens.delete(userId)
    }

    tokens.delete(userId, hash)
  },
  validateTokenAndGetUserId (hash) {
    const token = tokens.getByHash(hash)

    if (
      !token ||
      (token.expires && token.expires < Math.floor(Date.now() / 1000))
    ) {
      return false
    }

    return users.getById(token.userId).id
  },
  isValidMediaToken (hash) {
    const token = tokens.getByMediaHash(hash)

    if (
      !token ||
      (token.expires && token.expires < Math.floor(Date.now() / 1000))
    ) {
      return false
    }

    return true
  }
}
