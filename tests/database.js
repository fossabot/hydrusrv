const http = require('http')
const { test } = require('ava')
const portscanner = require('portscanner')
const setup = require('./_setup')

setup.setTestEnvironment()

let app, tags, files

test.before(t => {
  return new Promise(resolve => {
    portscanner.findAPortNotInUse(8000, 9000, '127.0.0.1', (err, port) => {
      if (err || !port) {
        console.error('Could not determine open port for test instance.')

        process.exit(1)
      }

      process.env.PORT = port
      process.env.URL = `localhost:${port}`

      app = require('../app')
      tags = require('../server/models/tags')
      files = require('../server/models/files')

      app.set('port', port)

      const server = http.createServer(app)
      server.listen(port)

      resolve()
    })
  })
})

test('database: get tags', t => {
  t.deepEqual(
    tags.get(1),
    [
      { name: 'amet' },
      { name: 'dolor' },
      { name: 'ipsum' },
      { name: 'lorem' }
    ]
  )
})

test('database: get tags of file', t => {
  t.deepEqual(
    tags.getOfFile(1),
    [
      { name: 'amet' },
      { name: 'dolor' },
      { name: 'ipsum' },
      { name: 'lorem' },
      { name: 'namespace:e' },
      { name: 'sit' }
    ]
  )
})

test('database: tag autocompletion', t => {
  t.deepEqual(
    tags.autocomplete('lor'),
    [
      { name: 'dolor' },
      { name: 'lorem' }
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
        fileId: 1,
        thumbnailUrl: `localhost:${process.env.PORT}/media/thumbnails/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c`
      },
      {
        fileId: 2,
        thumbnailUrl: `localhost:${process.env.PORT}/media/thumbnails/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55`
      },
      {
        fileId: 3,
        thumbnailUrl: `localhost:${process.env.PORT}/media/thumbnails/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42`
      },
      {
        fileId: 4,
        thumbnailUrl: `localhost:${process.env.PORT}/media/thumbnails/6c358705afeeeb6b75ba725cba10145ae366b6c36fe79aa99c983d354926af39`
      }
    ]
  )
})

test('database: get files by tags', t => {
  t.deepEqual(
    files.getByTags(1, ['lorem', 'ipsum', 'dolor', 'sit', 'amet']),
    [{
      fileId: 1,
      thumbnailUrl: `localhost:${process.env.PORT}/media/thumbnails/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c`
    }]
  )
})

test('database: get files sorted by namespace', t => {
  t.deepEqual(
    files.getSortedByNamespace(1, 'namespace'),
    [
      {
        fileId: 5,
        thumbnailUrl: `localhost:${process.env.PORT}/media/thumbnails/d2f5788f623cde1f0fb3dc801396fee235c67ed11d9452bfd765f1331587401d`
      },
      {
        fileId: 4,
        thumbnailUrl: `localhost:${process.env.PORT}/media/thumbnails/6c358705afeeeb6b75ba725cba10145ae366b6c36fe79aa99c983d354926af39`
      },
      {
        fileId: 3,
        thumbnailUrl: `localhost:${process.env.PORT}/media/thumbnails/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42`
      },
      {
        fileId: 2,
        thumbnailUrl: `localhost:${process.env.PORT}/media/thumbnails/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55`
      }
    ]
  )
})

test('database: get files by tags sorted by namespace', t => {
  t.deepEqual(
    files.getByTagsSortedByNamespace(
      1, ['lorem', 'ipsum', 'dolor'], 'namespace'
    ),
    [
      {
        fileId: 3,
        thumbnailUrl: `localhost:${process.env.PORT}/media/thumbnails/31426ccc8101461ad30806840b29432fb88bb84687ef9e002976551c8aa08e42`
      },
      {
        fileId: 2,
        thumbnailUrl: `localhost:${process.env.PORT}/media/thumbnails/5ef2eac48dd171cf98793df1e123238a61fb8ed766e862042b25467066fabe55`
      },
      {
        fileId: 1,
        thumbnailUrl: `localhost:${process.env.PORT}/media/thumbnails/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c`
      }
    ]
  )
})

test('database: get file by id', t => {
  t.deepEqual(
    files.getById(1),
    {
      fileId: 1,
      mimeType: 'image/png',
      size: 5012,
      width: 500,
      height: 500,
      mediaUrl: `localhost:${process.env.PORT}/media/original/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c`,
      thumbnailUrl: `localhost:${process.env.PORT}/media/thumbnails/2acedf8e20512a10fc07cceca8d16923e790369b90acebf9efcd926f50dd5c0c`
    }
  )
})

test('database: get total file count', t => {
  t.deepEqual(
    files.getTotalCount(),
    { count: 5 }
  )
})