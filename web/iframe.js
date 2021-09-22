$(async () => {
  const sheet = await gsheet('1PCJ1zSwm9PsjI3-czpJXeknKmYIYg_-TwhIhqS0-wUc', 'book')

  const hash = window.location.hash
  const page = hash.split('#')[1]
  const item = sheet[page]

  const book = $('<div>').addClass('col iframe')
  const card = $('<div>').addClass('card mb-4 rounded-3 shadow-sm')
  const header = $('<div>').addClass('card-header py-3')
  const body = $('<div>').addClass('card-body book')
  const title = $('<h5>').addClass('my-0 fw-normal')
  const img = $('<img>').addClass('book-img')
  const btn = $('<a>').addClass('download btn btn-lg btn-success').attr('type', 'button').text('open')

  title.text(item.title)
  let src = item.thumbnail ? item.thumbnail : 'noimg.png'
  img.attr('src', src)
  btn.attr('href', `./viewer/?file=${item.file}`)

  header.append(title)
  body.append(img)
  body.append(btn)
  card.append(header)
  card.append(body)
  book.append(card)
  $('.row').append(book)
})
