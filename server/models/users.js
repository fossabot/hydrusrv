const crypto = require('crypto')
const argon2 = require('argon2')
const db = require('../database/database')

module.exports = {
  async create (username, password) {
    try {
      const passwordHash = await argon2.hash(password)

      db.app.prepare(
        `INSERT INTO
          users (username, password, created)
        VALUES (?, ?, ?);`
      ).run(username, passwordHash, Math.floor(Date.now() / 1000))
    } catch (err) {
      throw err
    }
  },
  async update (userId, data) {
    const placeholders = []
    const params = []

    if (data.username) {
      placeholders.push('username = ?')
      params.push(data.username)
    }

    if (data.password) {
      placeholders.push('password = ?')

      try {
        params.push(await argon2.hash(data.password))
      } catch (err) {
        throw err
      }
    }

    params.push(userId)

    db.app.prepare(
      `UPDATE
        users
      SET
        ${placeholders.join(',')}
      WHERE
        id = ?;`
    ).run(...params)
  },
  delete (userId) {
    db.app.prepare(
      `DELETE FROM
        users
      WHERE
        id = ?;`
    ).run(userId)
  },
  getById (userId) {
    return db.app.prepare(
      `SELECT
        id,
        username,
        password,
        created
      FROM
        users
      WHERE
        id = ?;`
    ).get(userId)
  },
  getByName (username) {
    return db.app.prepare(
      `SELECT
        id,
        username,
        password,
        created
      FROM
        users
      WHERE
        username = ?;`
    ).get(username)
  },
  async getValidUser (username, password) {
    const user = this.getByName(username)

    if (!user) {
      return false
    }

    try {
      if (await argon2.verify(user.password, password)) {
        return user
      }

      return false
    } catch (err) {
      throw err
    }
  },
  createToken (userId, expires) {
    const hash = crypto.randomBytes(
      Math.ceil(128 / 2)
    ).toString('hex').slice(0, 128)

    const newTokenId = db.app.prepare(
      `INSERT INTO
        tokens (user_id, hash, expires)
      VALUES (?, ?, ?);`
    ).run(userId, hash, expires).lastInsertROWID

    return this.getTokenById(newTokenId)
  },
  deleteTokens (userId, hash) {
    let where = 'user_id'
    let param = userId

    if (hash) {
      where = 'hash'
      param = hash
    }

    db.app.prepare(
      `DELETE FROM
        tokens
      WHERE
        ${where} = ?;`
    ).run(param)
  },
  getTokenById (tokenId) {
    return db.app.prepare(
      `SELECT
        id,
        user_id as userId,
        hash,
        expires
      FROM
        tokens
      WHERE
        id = ?;`
    ).get(tokenId)
  },
  getTokenByHash (hash) {
    return db.app.prepare(
      `SELECT
        id,
        user_id as userId,
        hash,
        expires
      FROM
        tokens
      WHERE
        hash = ?;`
    ).get(hash)
  }
}
