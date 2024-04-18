const main = document.querySelector('main')
const form = document.querySelector('form')

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  event.submitter.textContent = '생성 중...'
  event.submitter.disabled = true

  const formData = new FormData(form)
  const response = await fetch('/image', {
    method: 'post',
    body: formData,
  })

  const imageBlob = await response.blob()
  const imageUrl = URL.createObjectURL(imageBlob)

  const resultSection = document.createElement('section')
  resultSection.classList.add('result')
  resultSection.innerHTML = `
    <h2>제조 결과</h2>
    <img src="${imageUrl}" alt="${getAltText(
    formData
  )}" width="400" height="240">
    <a href="${imageUrl}" download="명언.png">다운로드</a>
  `

  const existingResultSection = document.querySelector('.result')
  if (existingResultSection) {
    existingResultSection.remove()
  }

  main.append(resultSection)
  resultSection.scrollIntoView({ behavior: 'smooth' })

  event.submitter.textContent = '명언 생성!'
  event.submitter.disabled = false
})

const getAltText = (data) => {
  const yearOfBirth = data.get('year-of-birth')
  const yearOfDeath = data.get('year-of-death')
  const yearsInfo =
    yearOfBirth && yearOfDeath ? ` (${yearOfBirth} ~ ${yearOfDeath})` : ''

  return `가짜 명언: &quot;${data.get('quote')}&quot; - ${data.get(
    'author'
  )}${yearsInfo}`
}
