const fs = require('fs')
const path = require('path')
const fse = require('fs-extra')

/**
 * Options for restoreEmlFiles() function
 * @param minDate of file that will be copied
 * @param maxDate of file that will be copied
 * @constructor
 */
function Options (minDate, maxDate) {
  this.overwrite = false
  this.preserveTimestamps = true
  this.minMs = new Date(minDate).getTime()
  // add 24h because getTime() returns the very beginning of the day
  this.maxMs = new Date(maxDate).getTime() + 86400

  // check if ctime of file in the range (minDate, maxDate)
  // TODO add *.eml extension to the condition
  this.filter = function (srcFile) {
    try {
      const stat = fs.statSync(srcFile)
      console.log('check file', srcFile)
      return ((stat.mtimeMs >= this.minMs) && (stat.mtimeMs <= this.maxMs))
    } catch (error) { console.log(error) }
  }
}

/**
 * Recursively copy files matching the condition options.filter()
 * if you copy file srcDir/path/to/file, the new path will be
 * destDir/srcDir/path/to/file,
 * @param srcDir - source folder
 * @param destDir - destination folder
 * @param options - object with copy`s options
 * @returns {Promise<void>}
 */
async function restoreEmlFiles (srcDir, destDir, options) {
  let srcFile = null
  let destFile = null
  let subDir = null

  const dirents = await fs.promises.opendir(srcDir)
  for await (const dirent of dirents) {
    if (dirent.isDirectory()) {
      subDir = path.join(srcDir, dirent.name)
      await restoreEmlFiles(subDir, destDir, options)
    }
    if (dirent.isFile()) {
      srcFile = path.join(srcDir, dirent.name)
      destFile = path.join(destDir, srcFile)
      try {
        await fse.copy(srcFile, destFile, options)
      } catch (error) {
        console.log(error)
      }
    }
  }
}

// what about memory ??????????
async function restoreEmlFiles2 (srcDir, destDir, options) {
  const dirents = await fs.promises.readdir(srcDir, { withFileTypes: true })
  return Promise.all(dirents.map(dirent => {
    console.log(dirent.name)
    if (dirent.isDirectory()) {
      const subDir = path.join(srcDir, dirent.name)
      return restoreEmlFiles2(subDir, destDir, options)
    }
    if (dirent.isFile()) {
      const srcFile = path.join(srcDir, dirent.name)
      const destFile = path.join(destDir, srcFile)
      return fse.copy(srcFile, destFile, options)
    }
  }))
}

(async () => {
  const options = new Options('2020-07-20', '2020-07-23')
  await restoreEmlFiles2('./temp/dir1', './temp/dest', options)
  process.exit(0)
})()
