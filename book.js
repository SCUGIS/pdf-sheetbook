const fs = require('fs')
const readline = require('readline')
const {google} = require('googleapis')
const {GoogleSpreadsheet} = require('google-spreadsheet')
const sharp = require('sharp')
const pdf = require('pdf-parse')
const { exec } = require('child_process')
const sleepTime = 200
const config = require('./config.js')
const sheetId = config.sheetId
const galleryId = config.galleryId

const fromPath = require('pdf2pic').fromPath

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
]

const creds = require('./client_secret.json')
const serviceCreds = require('./gisscu.json')
const TOKEN_PATH = 'token.json'

console.log(`pdf max length: ${process.argv[2]}`)
console.log(`update image mode: ${process.argv[3]}`)
authorize(api)

async function sleep(ms = 0) {
  return new Promise(r => setTimeout(r, ms))
}

function authorize(callback) {
  const {client_secret, client_id, redirect_uris} = creds.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0])

  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback)
    oAuth2Client.setCredentials(JSON.parse(token))
    callback(oAuth2Client)
  })
}

function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  })
  console.log('Authorize this app by visiting this url:', authUrl)
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close()
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err)
      oAuth2Client.setCredentials(token)
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err)
        console.log('Token stored to', TOKEN_PATH)
      })
      callback(oAuth2Client)
    })
  })
}

function read(path) {
	return new Promise((resolve, reject) => {
		fs.readFile(path, 'utf-8', (err, data) => {
			if (err) {
				reject(err)
			} else {
				resolve(data)
			}
		})
	})
}

function write(path, text) {
	return new Promise((resolve, reject) => {
		fs.writeFile(path, text, (err, data) => {
			if (err) {
				reject(err)
      }
      resolve(data)
		})
	})
}

function func(cmd) {
	return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(stdout)
    });
  })
}

async function api(auth) {
  const drive = google.drive({version: 'v3', auth})
  let doc = new GoogleSpreadsheet(sheetId)
  let sheet
  let regex = /\/d\/(\S*)\/view/

  let getFile = (fileId) => {
    return new Promise((resolve, reject) => {
      console.log(fileId)
      drive.files.get(
        {
          fileId,
          alt: 'media',
          supportsAllDrives: true
        },
        { responseType: 'stream' },
        function(err, res) {
          // console.log(fileId)
          if (err) {
            console.log('The API returned an error: ' + err.message)
            return getFile(fileId)
          }

          let buf = []
          res.data.on('data', function(e) {
            buf.push(e)
          })
          res.data.on('end', function() {
            const buffer = Buffer.concat(buf)
            // fs.writeFile('filename', buffer, err => console.log(err)) // For testing
            resolve({ data: buffer, mimeType: res.headers['content-type']})
          })
        }
      )
    })
  }

  await doc.useServiceAccountAuth(serviceCreds)
  await doc.loadInfo()

  sheet = doc.sheetsById[galleryId]

  let galleryRows = await sheet.getRows()
  console.log('updated on ' + doc.title + ', sheet: ' + sheet.title)

  for (let i = 0; i < galleryRows.length; i++) {
    let row = galleryRows[i]
    if (regex.exec(row.media)) {
      let fileId = regex.exec(row.media)[1]
      let res = await getFile(fileId)
      let file = res.data
      let fileMeta = res.mimeType
      let addr = `./pdf/${fileId}.pdf`

      if (file && fileMeta.match('pdf')) {
        await write(addr, file)
        const options = {
          density: 100,
          saveFilename: fileId,
          savePath: './img',
          format: 'jpg',
          width: 400,
          // height: 600,
        }
        const storeAsImage = fromPath(addr, options)
        const pageToConvertAsImage = 1
        const img = await storeAsImage(pageToConvertAsImage)
        row.thumbnail = `./img/${img.name}`
        row.file = `.${addr}`
      }
      await row.save()
      await sleep(sleepTime)
    }
  }
}

module.exports = {
  SCOPES,
  api,
}
