$(async () => {
  const sheet = await gsheet('1PCJ1zSwm9PsjI3-czpJXeknKmYIYg_-TwhIhqS0-wUc', 'book')

  function fallbackCopyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      var successful = document.execCommand('copy');
      var msg = successful ? 'successful' : 'unsuccessful';
      console.log('Fallback: Copying text command was ' + msg);
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
  }
  function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
      fallbackCopyTextToClipboard(text);
      return;
    }
    navigator.clipboard.writeText(text).then(function() {
      console.log('Async: Copying to clipboard was successful!');
    }, function(err) {
      console.error('Async: Could not copy text: ', err);
    });
  }

  var copyBobBtn = document.querySelector('.js-copy-bob-btn'),
    copyJaneBtn = document.querySelector('.js-copy-jane-btn');


  let i = 0
  for (const item of sheet) {
    const book = $('<div>').addClass('col')
    const card = $('<div>').addClass('card mb-4 rounded-3 shadow-sm')
    const header = $('<div>').addClass('card-header py-3')
    const body = $('<div>').addClass('card-body book')
    const title = $('<h5>').addClass('my-0 fw-normal')
    const img = $('<img>').addClass('book-img')
    const btn = $('<a>').addClass('download btn btn-success').attr('type', 'button').text('open')

    title.text(item.title)
    let src = item.thumbnail ? item.thumbnail : 'noimg.png'
    img.attr('src', src)
    btn.attr('href', `./viewer/?file=${item.file}`)

    const iframe = $('<a>').append($('<i>').addClass('icon btn btn-info bi bi-clipboard').attr('type', 'button')).attr('page', i)
      .click(function () {
        const num = $(this).attr('page')
        console.log(num)
        copyTextToClipboard(`<iframe style="border: 0;box-shadow: 0 0 1px; overflow: hidden;" scrolling="no" src="https://gis.scu.edu.tw/pdfbook/iframe.html#${num}" height="550">
</iframe>`);
      })

    header.append(title)
    body.append(img)
    body.append(btn)
    body.append(iframe)
    card.append(header)
    card.append(body)
    book.append(card)
    $('.row').append(book)
    i++
  }
})
