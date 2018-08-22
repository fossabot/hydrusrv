const path = require('path')
const http = require('http')
const test = require('ava')
const fse = require('fs-extra')
const portscanner = require('portscanner')

const setup = require('./_setup')
const migrations = require('../storage/migrations/runner')

setup.setTestEnvironment()

let app, users, tokens, tags, files

let originalBaseUrl, thumbnailsBaseUrl, testTokenHash

test.before(t => {
  return new Promise(resolve => {
    portscanner.findAPortNotInUse(8000, 9000, '127.0.0.1', async (err, port) => {
      if (err || !port) {
        console.error('Could not determine open port for test instance.')

        process.exit(1)
      }

      process.env.PORT = port
      process.env.URL = `http://localhost:${port}`
      process.env.APP_DB_PATH = path.resolve(
        __dirname, `storage/app_${port}.db`
      )

      let mediaBaseUrl = `http://localhost:${process.env.PORT}/media`
      originalBaseUrl = `${mediaBaseUrl}/original`
      thumbnailsBaseUrl = `${mediaBaseUrl}/thumbnails`

      fse.copySync(
        path.resolve(__dirname, 'storage/app.db.template'),
        path.resolve(__dirname, `storage/app_${port}.db`)
      )

      await migrations.up(process.env.APP_DB_PATH)

      app = require('../app')
      users = require('../server/models/users')
      tokens = require('../server/models/tokens')
      tags = require('../server/models/tags')
      files = require('../server/models/files')

      app.set('port', port)

      const server = http.createServer(app)
      server.listen(port)

      resolve()
    })
  })
})

test.serial('database: create user', async t => {
  try {
    await users.create('johndoe', '0123456789abcdef')
  } catch (err) {
    throw err
  }

  t.truthy(users.getById(1).username === 'johndoe')
})

test.serial('database: update user', async t => {
  try {
    await users.update(
      1, { username: 'johndoes', password: 'abcdef0123456789' }
    )
  } catch (err) {
    throw err
  }

  t.truthy(users.getById(1).username === 'johndoes')
})

test.serial('database: create token', t => {
  testTokenHash = tokens.create(
    1, Math.floor(Date.now() / 1000) + 86400
  ).hash

  t.truthy(testTokenHash !== false)
})

test.serial('database: delete token', t => {
  tokens.delete(1, testTokenHash)

  t.truthy(!tokens.getByHash(testTokenHash))
})

test.serial('database: delete user', t => {
  users.delete(1)

  t.truthy(!users.getById(1))
})

test('database: get tags', t => {
  t.deepEqual(
    tags.get(1),
    [
      { name: 'namespace:e', fileCount: 1 },
      { name: 'namespace:d', fileCount: 1 },
      { name: 'namespace:c', fileCount: 1 },
      { name: 'namespace:b', fileCount: 1 },
    ]
  )
})

test('database: get tags sorted ascending', t => {
  t.deepEqual(
    tags.get(1, 'id', 'asc'),
    [
      { name: 'lorem', fileCount: 5 },
      { name: 'ipsum', fileCount: 4 },
      { name: 'dolor', fileCount: 3 },
      { name: 'sit', fileCount: 2 }
    ]
  )
})

test('database: get tags sorted by name', t => {
  t.deepEqual(
    tags.get(1, 'name'),
    [
      { name: 'amet', fileCount: 1 },
      { name: 'dolor', fileCount: 3 },
      { name: 'ipsum', fileCount: 4 },
      { name: 'lorem', fileCount: 5 }
    ]
  )
})

test('database: get tags sorted by name descending', t => {
  t.deepEqual(
    tags.get(1, 'name', 'desc'),
    [
      { name: 'sit', fileCount: 2 },
      { name: 'namespace:e', fileCount: 1 },
      { name: 'namespace:d', fileCount: 1 },
      { name: 'namespace:c', fileCount: 1 }
    ]
  )
})

test('database: get tags sorted by files', t => {
  t.deepEqual(
    tags.get(1, 'files'),
    [
      { name: 'lorem', fileCount: 5 },
      { name: 'ipsum', fileCount: 4 },
      { name: 'dolor', fileCount: 3 },
      { name: 'sit', fileCount: 2 }
    ]
  )
})

test('database: get tags sorted by files ascending', t => {
  t.deepEqual(
    tags.get(1, 'files', 'asc'),
    [
      { name: 'amet', fileCount: 1 },
      { name: 'namespace:a', fileCount: 1 },
      { name: 'namespace:b', fileCount: 1 },
      { name: 'namespace:c', fileCount: 1 }
    ]
  )
})

test('database: get tags containing', t => {
  t.deepEqual(
    tags.getContaining(1, 'lor'),
    [
      { name: 'dolor', fileCount: 3 },
      { name: 'lorem', fileCount: 5 }
    ]
  )
})

test('database: get tags containing sorted ascending', t => {
  t.deepEqual(
    tags.getContaining(1, 'lor', 'id', 'asc'),
    [
      { name: 'lorem', fileCount: 5 },
      { name: 'dolor', fileCount: 3 }
    ]
  )
})

test('database: get tags containing sorted by name', t => {
  t.deepEqual(
    tags.getContaining(1, 'lor', 'name'),
    [
      { name: 'dolor', fileCount: 3 },
      { name: 'lorem', fileCount: 5 }
    ]
  )
})

test('database: get tags containing sorted by name descending', t => {
  t.deepEqual(
    tags.getContaining(1, 'lor', 'name', 'desc'),
    [
      { name: 'lorem', fileCount: 5 },
      { name: 'dolor', fileCount: 3 }
    ]
  )
})

test('database: get tags containing sorted by files', t => {
  t.deepEqual(
    tags.getContaining(1, 'lor', 'files'),
    [
      { name: 'lorem', fileCount: 5 },
      { name: 'dolor', fileCount: 3 }
    ]
  )
})

test('database: get tags containing sorted by files ascending', t => {
  t.deepEqual(
    tags.getContaining(1, 'lor', 'files', 'asc'),
    [
      { name: 'dolor', fileCount: 3 },
      { name: 'lorem', fileCount: 5 }
    ]
  )
})

test('database: get tags containing sorted by contains', t => {
  t.deepEqual(
    tags.getContaining(1, 'lor', 'contains'),
    [
      { name: 'lorem', fileCount: 5 },
      { name: 'dolor', fileCount: 3 }
    ]
  )
})

test('database: get tags containing sorted by contains descending', t => {
  t.deepEqual(
    tags.getContaining(1, 'lor', 'contains', 'desc'),
    [
      { name: 'lorem', fileCount: 5 },
      { name: 'dolor', fileCount: 3 }
    ]
  )
})

test('database: get tags of file', t => {
  t.deepEqual(
    tags.getOfFile(1),
    [
      { name: 'amet', fileCount: 1 },
      { name: 'dolor', fileCount: 3 },
      { name: 'ipsum', fileCount: 4 },
      { name: 'lorem', fileCount: 5 },
      { name: 'namespace:e', fileCount: 1 },
      { name: 'sit', fileCount: 2 }
    ]
  )
})

test('database: tag autocompletion', t => {
  t.deepEqual(
    tags.complete('lor'),
    [
      { name: 'lorem', fileCount: 5 },
      { name: 'dolor', fileCount: 3 }
    ]
  )
})

test('database: get namespaces', t => {
  t.deepEqual(
    tags.getNamespaces(),
    [{ name: 'namespace' }]
  )
})

test('database: get total tag count', t => {
  t.deepEqual(
    tags.getTotalCount(),
    { count: 10 }
  )
})

test('database: get files', t => {
  t.deepEqual(
    files.get(1),
    [
      {
        id: 5,
        mime: 'image/png',
        size: 6672,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/d2f5788f623cde1f0fb3dc801396fee235c67ed11d9452bfd765f1331587401d',
        thumbnailUrl: thumbnailsBaseUrl +
          '/d2f5788f623cde1f0fb3dc801396fee235c67ed11d9452bfd765f1331587401d'
      },
      {
        id: 4,
        mime: 'image/png',
        size: 6665,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/6c358705afeeeb6b75ba725cba10145ae366b6c36fe79aa99c983d354926af39',
        thumbnailUrl: thumbnailsBaseUrl +
          '/6c358705afeeeb6b75ba725cba10145ae366b6c36fe79aa99c983d354926af39'
      },
      {
        id: 3,
        mime: 'image/png',
        size: 6117,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42',
        thumbnailUrl: thumbnailsBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42'
      },
      {
        id: 2,
        mime: 'image/png',
        size: 5779,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55',
        thumbnailUrl: thumbnailsBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55'
      }
    ]
  )
})

test('database: get files sorted ascending', t => {
  t.deepEqual(
    files.get(1, 'id', 'asc'),
    [
      {
        id: 1,
        mime: 'image/png',
        size: 5012,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c',
        thumbnailUrl: thumbnailsBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c'
      },
      {
        id: 2,
        mime: 'image/png',
        size: 5779,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55',
        thumbnailUrl: thumbnailsBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55'
      },
      {
        id: 3,
        mime: 'image/png',
        size: 6117,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42',
        thumbnailUrl: thumbnailsBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42'
      },
      {
        id: 4,
        mime: 'image/png',
        size: 6665,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/6c358705afeeeb6b75ba725cba10145ae366b6c36fe79aa99c983d354926af39',
        thumbnailUrl: thumbnailsBaseUrl +
          '/6c358705afeeeb6b75ba725cba10145ae366b6c36fe79aa99c983d354926af39'
      }
    ]
  )
})

test('database: get files sorted by size', t => {
  t.deepEqual(
    files.get(1, 'size'),
    [
      {
        id: 5,
        mime: 'image/png',
        size: 6672,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/d2f5788f623cde1f0fb3dc801396fee235c67ed11d9452bfd765f1331587401d',
        thumbnailUrl: thumbnailsBaseUrl +
          '/d2f5788f623cde1f0fb3dc801396fee235c67ed11d9452bfd765f1331587401d'
      },
      {
        id: 4,
        mime: 'image/png',
        size: 6665,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/6c358705afeeeb6b75ba725cba10145ae366b6c36fe79aa99c983d354926af39',
        thumbnailUrl: thumbnailsBaseUrl +
          '/6c358705afeeeb6b75ba725cba10145ae366b6c36fe79aa99c983d354926af39'
      },
      {
        id: 3,
        mime: 'image/png',
        size: 6117,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42',
        thumbnailUrl: thumbnailsBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42'
      },
      {
        id: 2,
        mime: 'image/png',
        size: 5779,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55',
        thumbnailUrl: thumbnailsBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55'
      }
    ]
  )
})

test('database: get files sorted by size ascending', t => {
  t.deepEqual(
    files.get(1, 'size', 'asc'),
    [
      {
        id: 1,
        mime: 'image/png',
        size: 5012,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c',
        thumbnailUrl: thumbnailsBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c'
      },
      {
        id: 2,
        mime: 'image/png',
        size: 5779,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55',
        thumbnailUrl: thumbnailsBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55'
      },
      {
        id: 3,
        mime: 'image/png',
        size: 6117,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42',
        thumbnailUrl: thumbnailsBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42'
      },
      {
        id: 4,
        mime: 'image/png',
        size: 6665,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/6c358705afeeeb6b75ba725cba10145ae366b6c36fe79aa99c983d354926af39',
        thumbnailUrl: thumbnailsBaseUrl +
          '/6c358705afeeeb6b75ba725cba10145ae366b6c36fe79aa99c983d354926af39'
      }
    ]
  )
})

test('database: get files sorted by width', t => {
  t.deepEqual(
    files.get(1, 'width'),
    [
      {
        id: 1,
        mime: 'image/png',
        size: 5012,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c',
        thumbnailUrl: thumbnailsBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c'
      },
      {
        id: 2,
        mime: 'image/png',
        size: 5779,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55',
        thumbnailUrl: thumbnailsBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55'
      },
      {
        id: 3,
        mime: 'image/png',
        size: 6117,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42',
        thumbnailUrl: thumbnailsBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42'
      },
      {
        id: 4,
        mime: 'image/png',
        size: 6665,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/6c358705afeeeb6b75ba725cba10145ae366b6c36fe79aa99c983d354926af39',
        thumbnailUrl: thumbnailsBaseUrl +
          '/6c358705afeeeb6b75ba725cba10145ae366b6c36fe79aa99c983d354926af39'
      }
    ]
  )
})

test('database: get files sorted by width descending', t => {
  t.deepEqual(
    files.get(1, 'width', 'desc'),
    [
      {
        id: 1,
        mime: 'image/png',
        size: 5012,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c',
        thumbnailUrl: thumbnailsBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c'
      },
      {
        id: 2,
        mime: 'image/png',
        size: 5779,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55',
        thumbnailUrl: thumbnailsBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55'
      },
      {
        id: 3,
        mime: 'image/png',
        size: 6117,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42',
        thumbnailUrl: thumbnailsBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42'
      },
      {
        id: 4,
        mime: 'image/png',
        size: 6665,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/6c358705afeeeb6b75ba725cba10145ae366b6c36fe79aa99c983d354926af39',
        thumbnailUrl: thumbnailsBaseUrl +
          '/6c358705afeeeb6b75ba725cba10145ae366b6c36fe79aa99c983d354926af39'
      }
    ]
  )
})

test('database: get files sorted by height', t => {
  t.deepEqual(
    files.get(1, 'height'),
    [
      {
        id: 1,
        mime: 'image/png',
        size: 5012,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c',
        thumbnailUrl: thumbnailsBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c'
      },
      {
        id: 2,
        mime: 'image/png',
        size: 5779,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55',
        thumbnailUrl: thumbnailsBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55'
      },
      {
        id: 3,
        mime: 'image/png',
        size: 6117,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42',
        thumbnailUrl: thumbnailsBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42'
      },
      {
        id: 4,
        mime: 'image/png',
        size: 6665,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/6c358705afeeeb6b75ba725cba10145ae366b6c36fe79aa99c983d354926af39',
        thumbnailUrl: thumbnailsBaseUrl +
          '/6c358705afeeeb6b75ba725cba10145ae366b6c36fe79aa99c983d354926af39'
      }
    ]
  )
})

test('database: get files sorted by height ascending', t => {
  t.deepEqual(
    files.get(1, 'height', 'asc'),
    [
      {
        id: 1,
        mime: 'image/png',
        size: 5012,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c',
        thumbnailUrl: thumbnailsBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c'
      },
      {
        id: 2,
        mime: 'image/png',
        size: 5779,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55',
        thumbnailUrl: thumbnailsBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55'
      },
      {
        id: 3,
        mime: 'image/png',
        size: 6117,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42',
        thumbnailUrl: thumbnailsBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42'
      },
      {
        id: 4,
        mime: 'image/png',
        size: 6665,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/6c358705afeeeb6b75ba725cba10145ae366b6c36fe79aa99c983d354926af39',
        thumbnailUrl: thumbnailsBaseUrl +
          '/6c358705afeeeb6b75ba725cba10145ae366b6c36fe79aa99c983d354926af39'
      }
    ]
  )
})

test('database: get files sorted by mime', t => {
  t.deepEqual(
    files.get(1, 'mime'),
    [
      {
        id: 1,
        mime: 'image/png',
        size: 5012,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c',
        thumbnailUrl: thumbnailsBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c'
      },
      {
        id: 2,
        mime: 'image/png',
        size: 5779,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55',
        thumbnailUrl: thumbnailsBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55'
      },
      {
        id: 3,
        mime: 'image/png',
        size: 6117,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42',
        thumbnailUrl: thumbnailsBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42'
      },
      {
        id: 4,
        mime: 'image/png',
        size: 6665,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/6c358705afeeeb6b75ba725cba10145ae366b6c36fe79aa99c983d354926af39',
        thumbnailUrl: thumbnailsBaseUrl +
          '/6c358705afeeeb6b75ba725cba10145ae366b6c36fe79aa99c983d354926af39'
      }
    ]
  )
})

test('database: get files sorted by mime descending', t => {
  t.deepEqual(
    files.get(1, 'mime', 'desc'),
    [
      {
        id: 1,
        mime: 'image/png',
        size: 5012,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c',
        thumbnailUrl: thumbnailsBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c'
      },
      {
        id: 2,
        mime: 'image/png',
        size: 5779,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55',
        thumbnailUrl: thumbnailsBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55'
      },
      {
        id: 3,
        mime: 'image/png',
        size: 6117,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42',
        thumbnailUrl: thumbnailsBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42'
      },
      {
        id: 4,
        mime: 'image/png',
        size: 6665,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/6c358705afeeeb6b75ba725cba10145ae366b6c36fe79aa99c983d354926af39',
        thumbnailUrl: thumbnailsBaseUrl +
          '/6c358705afeeeb6b75ba725cba10145ae366b6c36fe79aa99c983d354926af39'
      }
    ]
  )
})

test('database: get files sorted by namespace', t => {
  t.deepEqual(
    files.get(1, 'namespaces', null, ['namespace']),
    [
      {
        id: 5,
        mime: 'image/png',
        size: 6672,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/d2f5788f623cde1f0fb3dc801396fee235c67ed11d9452bfd765f1331587401d',
        thumbnailUrl: thumbnailsBaseUrl +
          '/d2f5788f623cde1f0fb3dc801396fee235c67ed11d9452bfd765f1331587401d'
      },
      {
        id: 4,
        mime: 'image/png',
        size: 6665,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/6c358705afeeeb6b75ba725cba10145ae366b6c36fe79aa99c983d354926af39',
        thumbnailUrl: thumbnailsBaseUrl +
          '/6c358705afeeeb6b75ba725cba10145ae366b6c36fe79aa99c983d354926af39'
      },
      {
        id: 3,
        mime: 'image/png',
        size: 6117,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42',
        thumbnailUrl: thumbnailsBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42'
      },
      {
        id: 2,
        mime: 'image/png',
        size: 5779,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55',
        thumbnailUrl: thumbnailsBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55'
      }
    ]
  )
})

test('database: get files sorted by namespace descending', t => {
  t.deepEqual(
    files.get(1, 'namespaces', 'desc', ['namespace']),
    [
      {
        id: 1,
        mime: 'image/png',
        size: 5012,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c',
        thumbnailUrl: thumbnailsBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c'
      },
      {
        id: 2,
        mime: 'image/png',
        size: 5779,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55',
        thumbnailUrl: thumbnailsBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55'
      },
      {
        id: 3,
        mime: 'image/png',
        size: 6117,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42',
        thumbnailUrl: thumbnailsBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42'
      },
      {
        id: 4,
        mime: 'image/png',
        size: 6665,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/6c358705afeeeb6b75ba725cba10145ae366b6c36fe79aa99c983d354926af39',
        thumbnailUrl: thumbnailsBaseUrl +
          '/6c358705afeeeb6b75ba725cba10145ae366b6c36fe79aa99c983d354926af39'
      }
    ]
  )
})

test('database: get files sorted by invalid namespace', t => {
  t.deepEqual(
    files.get(1, 'namespaces', null, ['invalid']),
    [
      {
        id: 5,
        mime: 'image/png',
        size: 6672,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/d2f5788f623cde1f0fb3dc801396fee235c67ed11d9452bfd765f1331587401d',
        thumbnailUrl: thumbnailsBaseUrl +
          '/d2f5788f623cde1f0fb3dc801396fee235c67ed11d9452bfd765f1331587401d'
      },
      {
        id: 4,
        mime: 'image/png',
        size: 6665,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/6c358705afeeeb6b75ba725cba10145ae366b6c36fe79aa99c983d354926af39',
        thumbnailUrl: thumbnailsBaseUrl +
          '/6c358705afeeeb6b75ba725cba10145ae366b6c36fe79aa99c983d354926af39'
      },
      {
        id: 3,
        mime: 'image/png',
        size: 6117,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42',
        thumbnailUrl: thumbnailsBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42'
      },
      {
        id: 2,
        mime: 'image/png',
        size: 5779,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55',
        thumbnailUrl: thumbnailsBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55'
      }
    ]
  )
})

test('database: get files by tags', t => {
  t.deepEqual(
    files.getByTags(1, ['lorem', 'ipsum', 'dolor', 'sit', 'amet']),
    [{
      id: 1,
      mime: 'image/png',
      size: 5012,
      width: 500,
      height: 500,
      mediaUrl: originalBaseUrl +
        '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c',
      thumbnailUrl: thumbnailsBaseUrl +
        '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c'
    }]
  )
})

test('database: get files by tags sorted ascending', t => {
  t.deepEqual(
    files.getByTags(1, ['lorem', 'ipsum', 'dolor', 'sit', 'amet'], 'asc'),
    [{
      id: 1,
      mime: 'image/png',
      size: 5012,
      width: 500,
      height: 500,
      mediaUrl: originalBaseUrl +
        '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c',
      thumbnailUrl: thumbnailsBaseUrl +
        '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c'
    }]
  )
})

test('database: get files by tags sorted by size', t => {
  t.deepEqual(
    files.getByTags(1, ['lorem', 'ipsum', 'dolor'], 'size'),
    [
      {
        id: 3,
        mime: 'image/png',
        size: 6117,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42',
        thumbnailUrl: thumbnailsBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42'
      },
      {
        id: 2,
        mime: 'image/png',
        size: 5779,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55',
        thumbnailUrl: thumbnailsBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55'
      },
      {
        id: 1,
        mime: 'image/png',
        size: 5012,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c',
        thumbnailUrl: thumbnailsBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c'
      }
    ]
  )
})

test('database: get files by tags sorted by size ascending', t => {
  t.deepEqual(
    files.getByTags(1, ['lorem', 'ipsum', 'dolor'], 'size', 'asc'),
    [
      {
        id: 1,
        mime: 'image/png',
        size: 5012,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c',
        thumbnailUrl: thumbnailsBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c'
      },
      {
        id: 2,
        mime: 'image/png',
        size: 5779,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55',
        thumbnailUrl: thumbnailsBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55'
      },
      {
        id: 3,
        mime: 'image/png',
        size: 6117,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42',
        thumbnailUrl: thumbnailsBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42'
      }
    ]
  )
})

test('database: get files by tags sorted by width', t => {
  t.deepEqual(
    files.getByTags(1, ['lorem', 'ipsum', 'dolor'], 'width'),
    [
      {
        id: 1,
        mime: 'image/png',
        size: 5012,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c',
        thumbnailUrl: thumbnailsBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c'
      },
      {
        id: 2,
        mime: 'image/png',
        size: 5779,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55',
        thumbnailUrl: thumbnailsBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55'
      },
      {
        id: 3,
        mime: 'image/png',
        size: 6117,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42',
        thumbnailUrl: thumbnailsBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42'
      }
    ]
  )
})

test('database: get files by tags sorted by width ascending', t => {
  t.deepEqual(
    files.getByTags(1, ['lorem', 'ipsum', 'dolor'], 'width', 'asc'),
    [
      {
        id: 1,
        mime: 'image/png',
        size: 5012,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c',
        thumbnailUrl: thumbnailsBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c'
      },
      {
        id: 2,
        mime: 'image/png',
        size: 5779,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55',
        thumbnailUrl: thumbnailsBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55'
      },
      {
        id: 3,
        mime: 'image/png',
        size: 6117,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42',
        thumbnailUrl: thumbnailsBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42'
      }
    ]
  )
})

test('database: get files by tags sorted by height', t => {
  t.deepEqual(
    files.getByTags(1, ['lorem', 'ipsum', 'dolor'], 'height'),
    [
      {
        id: 1,
        mime: 'image/png',
        size: 5012,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c',
        thumbnailUrl: thumbnailsBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c'
      },
      {
        id: 2,
        mime: 'image/png',
        size: 5779,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55',
        thumbnailUrl: thumbnailsBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55'
      },
      {
        id: 3,
        mime: 'image/png',
        size: 6117,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42',
        thumbnailUrl: thumbnailsBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42'
      }
    ]
  )
})

test('database: get files by tags sorted by height descending', t => {
  t.deepEqual(
    files.getByTags(1, ['lorem', 'ipsum', 'dolor'], 'height', 'desc'),
    [
      {
        id: 1,
        mime: 'image/png',
        size: 5012,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c',
        thumbnailUrl: thumbnailsBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c'
      },
      {
        id: 2,
        mime: 'image/png',
        size: 5779,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55',
        thumbnailUrl: thumbnailsBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55'
      },
      {
        id: 3,
        mime: 'image/png',
        size: 6117,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42',
        thumbnailUrl: thumbnailsBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42'
      }
    ]
  )
})

test('database: get files by tags sorted by mime', t => {
  t.deepEqual(
    files.getByTags(1, ['lorem', 'ipsum', 'dolor'], 'mime'),
    [
      {
        id: 1,
        mime: 'image/png',
        size: 5012,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c',
        thumbnailUrl: thumbnailsBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c'
      },
      {
        id: 2,
        mime: 'image/png',
        size: 5779,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55',
        thumbnailUrl: thumbnailsBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55'
      },
      {
        id: 3,
        mime: 'image/png',
        size: 6117,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42',
        thumbnailUrl: thumbnailsBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42'
      }
    ]
  )
})

test('database: get files by tags sorted by mime descending', t => {
  t.deepEqual(
    files.getByTags(1, ['lorem', 'ipsum', 'dolor'], 'mime', 'desc'),
    [
      {
        id: 1,
        mime: 'image/png',
        size: 5012,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c',
        thumbnailUrl: thumbnailsBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c'
      },
      {
        id: 2,
        mime: 'image/png',
        size: 5779,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55',
        thumbnailUrl: thumbnailsBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55'
      },
      {
        id: 3,
        mime: 'image/png',
        size: 6117,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42',
        thumbnailUrl: thumbnailsBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42'
      }
    ]
  )
})

test('database: get files by tags sorted by namespace', t => {
  t.deepEqual(
    files.getByTags(
      1, ['lorem', 'ipsum', 'dolor'], 'namespaces', null, ['namespace']
    ),
    [
      {
        id: 3,
        mime: 'image/png',
        size: 6117,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42',
        thumbnailUrl: thumbnailsBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42'
      },
      {
        id: 2,
        mime: 'image/png',
        size: 5779,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55',
        thumbnailUrl: thumbnailsBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55'
      },
      {
        id: 1,
        mime: 'image/png',
        size: 5012,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c',
        thumbnailUrl: thumbnailsBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c'
      }
    ]
  )
})

test('database: get files by tags sorted by namespace descending', t => {
  t.deepEqual(
    files.getByTags(
      1, ['lorem', 'ipsum', 'dolor'], 'namespaces', 'desc', ['namespace']
    ),
    [
      {
        id: 1,
        mime: 'image/png',
        size: 5012,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c',
        thumbnailUrl: thumbnailsBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c'
      },
      {
        id: 2,
        mime: 'image/png',
        size: 5779,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55',
        thumbnailUrl: thumbnailsBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55'
      },
      {
        id: 3,
        mime: 'image/png',
        size: 6117,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42',
        thumbnailUrl: thumbnailsBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42'
      }
    ]
  )
})

test('database: get files by tags sorted by invalid namespace', t => {
  t.deepEqual(
    files.getByTags(
      1, ['lorem', 'ipsum', 'dolor'], 'namespaces', null, ['invalid']
    ),
    [
      {
        id: 3,
        mime: 'image/png',
        size: 6117,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42',
        thumbnailUrl: thumbnailsBaseUrl +
          '/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42'
      },
      {
        id: 2,
        mime: 'image/png',
        size: 5779,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55',
        thumbnailUrl: thumbnailsBaseUrl +
          '/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55'
      },
      {
        id: 1,
        mime: 'image/png',
        size: 5012,
        width: 500,
        height: 500,
        mediaUrl: originalBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c',
        thumbnailUrl: thumbnailsBaseUrl +
          '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c'
      }
    ]
  )
})

test('database: get file by id', t => {
  t.deepEqual(
    files.getById(1),
    {
      id: 1,
      mime: 'image/png',
      size: 5012,
      width: 500,
      height: 500,
      mediaUrl: originalBaseUrl +
        '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c',
      thumbnailUrl: thumbnailsBaseUrl +
        '/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c'
    }
  )
})

test('database: get total file count', t => {
  t.deepEqual(
    files.getTotalCount(),
    { count: 5 }
  )
})

test.after(t => {
  fse.removeSync(path.resolve(__dirname, `storage/app_${process.env.PORT}.db`))
})
