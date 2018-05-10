# hydrusrv [![Build status][travis-badge]][travis-url] [![Known vulnerabilities][snyk-badge]][snyk-url]

> A small application for serving media managed with
> [hydrus server][hydrus-server] via API

hydrusrv is a small application based on [Express][express] that can serve
media managed with [hydrus server][hydrus-server] over a REST-like API. It
accesses the databases and files of hydrus server directly, therefore
circumventing its native access key authentication. Instead, hydrusrv provides
its own (simple) user handling and token-based authentication (stored in a
separate database).

The application is only intended as a way to to read and serve hydrus server
data, not as an alternative way to manage it. It therefore does not have any
features that require more than read access.

A [Vue][vue]-based Web client for hydrusrv called [hydrusrvue][hydrusrvue] is
currently in (early) development.

## Table of contents

+ [Install](#install)
  + [Dependencies](#dependencies)
  + [Updating](#updating)
+ [Usage](#usage)
  + [Configuration](#configuration)
  + [Running the server](#running-the-server)
  + [API](#api)
    + [General](#general)
    + [Authentication](#authentication)
    + [Errors](#errors)
    + [Routes](#routes)
      + [Base](#base)
      + [Users](#users)
        + [Creating users](#creating-users)
        + [Updating users](#updating-users)
        + [Deleting users](#deleting-users)
      + [Tokens](#tokens)
        + [Creating tokens](#creating-tokens)
        + [Deleting tokens](#deleting-tokens)
      + [Info](#info)
      + [Namespaces](#namespaces)
      + [Tags](#tags)
        + [Listing tags](#listing-tags)
        + [Autocompleting tags](#autocompleting-tags)
      + [Files](#files)
        + [Listing files](#listing-files)
        + [Viewing files](#viewing-files)
      + [Media](#files)
        + [Getting media originals](#getting-media-originals)
        + [Getting media thumbnails](#getting-media-thumbnails)
  + [Caveats](#caveats)
+ [Donate](#donate)
+ [Maintainer](#maintainer)
+ [Contribute](#contribute)
+ [License](#license)

## Install

The easiest way to install is via cloning this repository:

```zsh
user@local:~$ git clone https://github.com/mserajnik/hydrusrv.git
user@local:~$ cd hydrusrv
user@local:hydrusrv$ npm i
```

If you encounter any errors during installation, those are likely caused by
two packages hydrusrv uses that both utilize [node-gyp][node-gyp] to compile
their underlying libraries.

Please take a look at the following resources and contact the maintainers of
those packages directly if you cannnot resolve your issues:

+ [better-sqlite3][better-sqlite3]
+ [node-argon2][node-argon2]

### Dependencies

+ [hydrus server][hydrus-server] (installing and running the server is quite
  difficult and not recommended for people who have no prior experience with
  hydrus; see [here][hydrus-server-installation] for installation instructions)
+ [Node.js][node-js] (tested on `9.10.0`+)
+ [npm][npm] (tested on `5.6.0`+)
+ [node-gyp][node-gyp] (likely required for Windows, hydrusrv seems to install
  fine without it being globally installed on macOS and Linux)

### Updating

If you have installed via cloning the repository, you can update via Git:

```zsh
user@local:hydrusrv$ git pull
user@local:hydrusrv$ npm i
```

Always make sure to run `npm i` after updating to install any packages you
might be missing.

hydrusrv follows [Semantic Versioning][semantic-versioning] and any breaking
changes that require additional attention will be released under a new major
version (e.g., `2.0.0`). Minor version updates (e.g., `1.1.0` or `1.2.0`) are
therefore always safe to simply install via the routine mentioned before.

When necessary, this section will be expanded with upgrade guides to new major
versions.

## Usage

### Configuration

After installing, the first thing you want to do is duplicating the application
database template you can find under `storage/app.db.template`. This
[SQLite][sqlite] database is used to store users and tokens for authentication.
The default (and recommended) location of the database is `storage/app.db`, but
you are free to put it wherever you want and can rename it to your liking.

Next, you also need to duplicate `.env.example` to `.env`. This file is used to
configure hydrusrv and needs to be located in the root directory of the
application.

After copying it, you can edit `.env` and change hydrusrv's configuration. The
following are all the available settings (along with their default values):

+ `NODE_ENV=development`: defines the environment hydrusrv is running in.
  It currently does not affect anything besides the logging but it should be
  set to `production` in a live environment and `development` when developing.
+ `URL=https://example.com`: the URL under which hydrusrv is accessible. Used
  to generate correct media paths. __No trailing slashes.__
+ `PORT=8000`: the port hydrusrv is listening on. This can be different than
  the port used to access it from outside when proxying via [nginx][nginx]
  (recommended) or similar solutions.
+ `API_BASE=/api`: the base path of all the API routes. __No trailing__
  __slashes.__
+ `MEDIA_BASE=/media`: the base path of all the media routes. __No trailing__
  __slashes.__
+ `APP_DB_PATH=./storage/app.db`: the application database path. Database must
  exist and the file must be read-/writeable for hydrusrv.
  __Absolute path required when deviating from the default.__
+ `REGISTRATION_ENABLED=true`: setting this to `false` disables the creation of
  new users.
+ `MIN_PASSWORD_LENGTH=16`: sets the minimum password length when creating or
  updating users.
+ `LOGGING_ENABLED=true`: setting this to `false` disables access logging when
  `NODE_ENV=production` is set.
+ `OVERRIDE_LOGFILE_PATH=`: overrides the default logfile location
  (`logs/access.log`. Logging to a file is only enabled with
  `LOGGING_ENABLED=true` and `NODE_ENV=production`. With
  `NODE_ENV=development`, hydrusrv logs to the console instead.
  __Absolute path required.__
+ `HYDRUS_SERVER_DB_PATH=`: sets the path to the hydrus server main database
  (called `server.db`). __Absolute path required.__
+ `HYDRUS_MASTER_DB_PATH=`: sets the path to the hydrus server master database
  (called `server.master.db`). __Absolute path required.__
+ `HYDRUS_MAPPINGS_DB_PATH=`: sets the path to the hydrus server mappings
  database (called `server.mappings.db`). __Absolute path required.__
+ `HYDRUS_FILES_PATH=`: sets the path to the hydrus server files directory
  (called `server_files`).  __Absolute path required.__
+ `HYDRUS_TAG_REPOSITORY=`: the ID of the hydrus server tag repository hydrusrv
  should use.
+ `HYDRUS_FILE_REPOSITORY=`: the ID of the hydrus server file repository
  hydrusrv should use.
+ `HYDRUS_SUPPORTED_MIME_TYPES=1,2,3,4,14,21,23`: the IDs of the MIME types
  hydrusrv should support. See [here][supported-mime-types] for the complete
  list of MIME types hydrusrv can handle.
+ `HYDRUS_RESULTS_PER_PAGE=42`: the results per page when dealing with
  paginated lists (files and tags).

### Running the server

First of all, you have several options to start the server:

+ `npm run start-dev`: starts the server in development mode using
  [nodemon][nodemon] to watch for file changes and restarts when necessary.
+ `npm run start`: starts the server in production mode.
+ `./bin/www`: the file that is run when using both, `start-dev` and `start`.
  You can also execute it directly to start the server in production mode.

For running in production mode, you will likely want to set up both a reverse
proxy (I recommend [nginx][nginx]) and a way to autostart hydrusrv when booting
your machine (I personally use [Supervisor][supervisor]).

When running in production mode, I highly recommend using HTTP/2.

### API

hydrusrv provides a REST-like API that a client can connect to to request data
from the server. Such a client could for example be a simple script that
"syncs" the media of a hydrus server installation with your local machine or an
application with a GUI that behaves like a booru (like
[hydrusrvue][hydrusrvue], which is currently in development).

#### General

Request and response bodies are always in JSON format (except when sending the
actual files). Single resources (e.g., a file or an actual media file) will
return an error with status code `404` when they do not exist while lists
(e.g., of tags or files) simply return an empty array when nothing is found.

#### Authentication

All the routes except the base route (`/api`) and the ones for registering new
users and creating tokens are protected with a token-based authentication. In
order to access these routes, a valid token must be provided via an
`Authorization: Bearer <token>` header.

When updating or deleting users and tokens, the provided authentication token
is also used to identify which user/token(s) are to be modified/deleted.

#### Errors

When a resource is not available or an issue occurs, hydrusrv will return one
of several possible errors which are always in the same format:

```json5
{
  "error": <error name>
}
```

hydrusrv responds after the first error occurs so multiple errors might have to
be dealt with one after another.

#### Routes

##### Base

__Route:__ `GET /api`

__Input:__ None

__Output on success:__

```json5
{
  "hydrusrv": {
    "version": <version number of hydrusrv installation>
  }
}
```

__Possible errors:__

+ `InternalServerError`

##### Users

###### Creating users

__Route:__ `POST /api/users`

__Input:__

```json5
{
  "username": <desired username>,
  "password": <desired password>
}
```

__Output on success:__

```json5
{
  "createdUser": true
}
```

__Possible errors:__

+ `RegistrationDisabledError`
+ `MissingUsernameFieldError`
+ `InvalidUsernameFieldError`
+ `MissingPasswordFieldError`
+ `InvalidPasswordFieldError`
+ `UsernameExistsError`
+ `InternalServerError`

###### Updating users

__Route:__ `PUT /api/users`

__Input:__

```json5
{
  "username": <new username>, // optional – at least one of the two required
  "password": <new password> // optional – at least one of the two required
}
```

__Output on success:__

```json5
{
  "updatedUser": true
}
```

__Possible errors:__

+ `MissingTokenError`
+ `InvalidTokenError`
+ `NoUpdateFieldsError`
+ `MissingUsernameFieldError`
+ `InvalidUsernameFieldError`
+ `MissingPasswordFieldError`
+ `InvalidPasswordFieldError`
+ `UsernameExistsError`
+ `InternalServerError`

###### Deleting users

__Route:__ `DELETE /api/users`

__Input:__ None

__Output on success:__

```json5
{
  "deletedUser": true
}
```

__Possible errors:__

+ `MissingTokenError`
+ `InvalidTokenError`
+ `InternalServerError`

##### Tokens

###### Creating tokens

__Route:__ `POST /api/tokens`

__Input:__

```json5
{
  "username": <username>,
  "password": <password>,
  "long": true // optional – sets the token expiration time to 90 days instead of the default 1 day
}
```

__Output on success:__

```json5
{
  "token": <token>
}
```

__Possible errors:__

+ `MissingUsernameFieldError`
+ `InvalidUsernameFieldError`
+ `MissingPasswordFieldError`
+ `InvalidPasswordFieldError`
+ `InvalidLongFieldError`
+ `InvalidUserError`
+ `InternalServerError`

###### Deleting tokens

__Route:__ `DELETE /api/tokens`

__Input:__

```json5
{
  "all": true // optional – deletes all tokens of the user instead of only the one used for authentication
}
```

__Output on success:__

```json5
{
  "deletedTokens": true
}
```

__Possible errors:__

+ `MissingTokenError`
+ `InvalidTokenError`
+ `InvalidAllFieldError`
+ `InternalServerError`

##### Info

__Route:__ `GET /api/info`

__Input:__ None

__Output on success:__

```json5
{
  "tagCount": <total amount of tags in the tag repository>,
  "fileCount": <total amount of files in the files repository>
}
```

__Possible errors:__

+ `MissingTokenError`
+ `InvalidTokenError`
+ `InternalServerError`

##### Namespaces

__Route:__ `GET /api/namespaces`

__Input:__ None

__Output on success:__

```json5
[
  {
    name: <name of the namespace>
  }
  // […]
]
```

__Possible errors:__

+ `MissingTokenError`
+ `InvalidTokenError`
+ `InternalServerError`

##### Tags

###### Listing tags

__Route:__ `GET /api/tags?page=<page>`

__Input:__ None

__Output on success:__

```json5
[
  {
    name: <name of the tag>
  }
  // […]
]
```

__Possible errors:__

+ `MissingTokenError`
+ `InvalidTokenError`
+ `MissingPageParameterError`
+ `InvalidPageParameterError`
+ `InternalServerError`

###### Autocompleting tags

__Route:__ `POST /api/autocomplete-tag`

__Input:__

```json5
{
  "partialTag": <name of the partial tag>
}
```

__Output on success:__

```json5
[
  {
    name: <name of the tag>
  }
  // […]
]
```

__Possible errors:__

+ `MissingTokenError`
+ `InvalidTokenError`
+ `MissingPartialTagFieldError`
+ `InvalidPartialTagFieldError`
+ `InternalServerError`

##### Files

###### Listing files

__Route:__ `GET /api/files?page=<page>&tags[]=<tag>&sort=<namespace>`

__Info:__

The `tags[]` parameter is optional and takes an arbitrary amount of tags (a
single tag per `&tag[]=`), each one limiting the result set further.

The `sort` parameter is also optional and used to sort the results by a given
namespace (e.g., files with tag `creator:a` would come before `creator:b` if
sorted by `creator`, independent of their ID which is the default sort method).

Defining a namespace to sort by also limits the set to files that have a tag in
that namespace (in addition to any tags already limiting the set via `tags[]`).

This route returns the same data for each file as when
[viewing a file](#viewing-files) but omits the tags to reduce the response size
when dealing with possible cases where many files that each have many tags are
displayed on a single page.

__Input:__ None

__Output on success:__

```json5
[
  {
    "fileId": <file ID>,
    "mimeType": <MIME type>,
    "size": <file size in bytes>,
    "width": <width in pixel>,
    "height": <height in pixel>,
    "mediaUrl": <original media URL>,
    "thumbnailUrl": <thumbnail URL>
  }
  // […]
]
```

__Possible errors:__

+ `MissingTokenError`
+ `InvalidTokenError`
+ `MissingPageParameterError`
+ `InvalidPageParameterError`
+ `MissingTagsParameterError`
+ `InvalidTagsParameterError`
+ `MissingSortParameterError`
+ `InvalidSortParameterError`
+ `InternalServerError`

###### Viewing files

__Route:__ `GET /api/files/<file id>`

__Info:__

This route returns the same data as when [listing files](#listing-files) but
also includes a files' tags.

__Input:__ None

__Output on success:__

```json5
[
  {
    "fileId": <file ID>,
    "mimeType": <MIME type>,
    "size": <file size in bytes>,
    "width": <width in pixel>,
    "height": <height in pixel>,
    "mediaUrl": <original media URL>,
    "thumbnailUrl": <thumbnail URL>,
    "tags": [
      {
        "name": <name of the tag>
      }
      // […]
    ]
  }
  // […]
]
```

__Possible errors:__

+ `MissingTokenError`
+ `InvalidTokenError`
+ `MissingFileIdParameterError`
+ `InvalidFileIdParameterError`
+ `NotFoundError`
+ `InternalServerError`

##### Media

###### Getting media originals

__Route:__ `GET /media/originals/<media hash>`

__Input:__ None

__Output on success:__ The requested media file

__Possible errors:__

+ `MissingTokenError`
+ `InvalidTokenError`
+ `MissingMediaHashParameterError`
+ `InvalidMediaHashParameterError`
+ `NotFoundError`
+ `InternalServerError`

###### Getting media thumbnails

__Route:__ `GET /media/thumbnails/<media hash>`

__Input:__ None

__Output on success:__ The requested media thumbnail

__Possible errors:__

+ `MissingTokenError`
+ `InvalidTokenError`
+ `MissingMediaHashParameterError`
+ `InvalidMediaHashParameterError`
+ `NotFoundError`
+ `InternalServerError`

### Caveats

hydrusrv was mainly developed for my personal use and might therefore lack some
features others might want to see. Some of these could be:

+ The user management is very basic. There are no roles, no rights and no way
  to delete a user other than using an access token that belongs to that user
  (aside from doing it directly via database of course).
+ hydrusrv __needs__ one tag and one file repository to work. Trying to run it
  without either will result in errors. It also cannot support additional
  repositories.
+ hydrus server supports many more MIME types than the ones I have limited
  hydrusrv to. This is due to the fact that determining the MIME type of a file
  is rather difficult in hydrus server and I wanted to keep it as simple as
  possible (I personally only need support for the basic media types).
+ The available API routes are currently limited to what I personally need. I
  might expand these in the future (e.g., user listing, token listing etc.) but
  I am also happy to accept pull requests.
+ hydrus client/server is updated frequently (usually once a week) and while I
  will try to keep hydrusrv up-to-date with any database changes (that
  thankfully do not occur very frequently), I cannot promise anything. However,
  you can always figure out the latest hydrus server version hydrusrv has been
  tested with by taking a look in the `tests` directory. The number at the end
  of the `tests/hydrus-server-dummy-xxx` directory indicates the version.

## Donate

If you like hydrusrv and want to buy me a coffee, feel free to donate via
PayPal:

[![Donate via PayPal][paypal-image]][paypal-url]

Alternatively, you can also send me BTC:

![Donate BTC][btc-image]  
`13jRyroNn8QF4mbGZxKS6mR3PsxjYTsGsu`

Donations are unnecessary, but very much appreciated. :)

## Maintainer

[mserajnik][maintainer-url]

## Contribute

You are welcome to help out!

[Open an issue][issues-url] or submit a pull request.

## License

[MIT](LICENSE.md) © Michael Serajnik

[travis-url]: https://travis-ci.org/mserajnik/hydrusrv
[travis-badge]: https://img.shields.io/travis/mserajnik/hydrusrv/master.svg

[snyk-url]: https://snyk.io/test/github/mserajnik/hydrusrv
[snyk-badge]: https://snyk.io/test/github/mserajnik/hydrusrv/badge.svg

[express]: https://expressjs.com/
[hydrus-server]: http://hydrusnetwork.github.io/hydrus
[hydrus-server-installation]: http://hydrusnetwork.github.io/hydrus/help/server.html
[vue]: https://vuejs.org/
[hydrusrvue]: https://github.com/mserajnik/hydrusrvue
[better-sqlite3]: https://github.com/JoshuaWise/better-sqlite3/wiki/Troubleshooting-installation
[node-argon2]: https://github.com/ranisalt/node-argon2#before-installing
[node-js]: https://nodejs.org/en/
[npm]: https://www.npmjs.com/get-npm
[node-gyp]: https://github.com/nodejs/node-gyp
[semantic-versioning]: https://semver.org/
[sqlite]: https://www.sqlite.org/
[nginx]: https://nginx.org/
[supported-mime-types]: https://github.com/mserajnik/hydrusrv/blob/master/server/config/hydrus.js#L2-L14
[nodemon]: https://github.com/remy/nodemon
[supervisor]: http://supervisord.org/

[paypal-url]: https://www.paypal.me/mserajnik
[paypal-image]: https://www.paypalobjects.com/webstatic/en_US/i/btn/png/blue-rect-paypal-26px.png
[btc-image]: https://mserajnik.at/external/btc.png

[maintainer-url]: https://github.com/mserajnik
[issues-url]: https://github.com/mserajnik/hydrusrv/issues/new
