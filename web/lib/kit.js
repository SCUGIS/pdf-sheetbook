const gsheet = async (sheetId, tabName) => {
  const sheetData = []
	let json = await $.get(`https://gis.scu.edu.tw/jsonapi?id=${sheetId}&sheet=${tabName}`)

  json.rows.map(data => {
    sheetData.push(data)
  })

  return sheetData
}

const filter = (sheet, tags) => {
  const fmtSheet = []
  sheet.forEach((item) => {
    let status = false

    for (const key in tags) {
      if (item[key]) {
        const arr = item[key].split(',')
        tags[key].forEach((tag) => {
          if (arr.indexOf(tag) !== -1) {
            status = true
          }
        })
      }
    }

    if (status) {
      fmtSheet.push(item)
    }
  })

  return fmtSheet
}

window.filter = filter
window.gsheet = gsheet
