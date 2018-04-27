module.exports = {
  serverDbPath: (process.env.NODE_ENV === 'production')
    ? process.env.HYDRUS_SERVER_DB_PATH
    : process.env.HYDRUS_SERVER_DB_PATH_DEV,
  masterDbPath: (process.env.NODE_ENV === 'production')
    ? process.env.HYDRUS_MASTER_DB_PATH
    : process.env.HYDRUS_MASTER_DB_PATH_DEV,
  mappingsDbPath: (process.env.NODE_ENV === 'production')
    ? process.env.HYDRUS_MAPPINGS_DB_PATH
    : process.env.HYDRUS_MAPPINGS_DB_PATH_DEV
}
