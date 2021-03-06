const upash = require('upash')

const db = require('../database')

upash.install('argon2', require('@phc/argon2'))

module.exports = {
  async create (username, password) {
    try {
      const passwordHash = await upash.hash(password)

      db.app.prepare(
        'INSERT INTO users (username, password, created) VALUES (?, ?, ?)'
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
        params.push(await upash.hash(data.password))
      } catch (err) {
        throw err
      }
    }

    params.push(userId)

    db.app.prepare(
      `UPDATE users SET ${placeholders.join(',')} WHERE id = ?`
    ).run(...params)
  },
  delete (userId) {
    db.app.prepare('DELETE FROM users WHERE id = ?').run(userId)
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
        id = ?`
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
        username = ?`
    ).get(username)
  },
  async getValid (nameOrId, password, getByName = false) {
    const user = getByName ? this.getByName(nameOrId) : this.getById(nameOrId)

    if (!user) {
      return false
    }

    try {
      if (await upash.verify(user.password, password)) {
        return user
      }

      return false
    } catch (err) {
      throw err
    }
  }
}
