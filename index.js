const LETTER_COUNT = 6
const GUESS_COUNT = 6

const guessContainer = document.querySelector('.guess-container')
const firstGuessNode = document.querySelector('.guess')
const keyboardLetters = document.querySelectorAll('.keyboard-letter')

let guessNodes = [firstGuessNode]
let activeGuessIndex = 0
let activeLetterIndex = 0
let activeGuess = firstGuessNode
let activeGuessLetters = firstGuessNode.querySelectorAll('.guess-letter')

let guessWord = ''

let wordList
let wordOfTheDay

function init() {
    // Create guess containers
    for (let i = 1; i < GUESS_COUNT; i++) {
        let guessNodeClone = firstGuessNode.cloneNode(true)
        guessNodes.push(guessNodeClone)
        guessContainer.appendChild(guessNodeClone)
    }

    // Setup UI keyboard click listeners
    keyboardLetters.forEach(keyboardLetter => {
        if (keyboardLetter.textContent.length === 1) {
            keyboardLetter.dataset.letter = keyboardLetter.textContent
        }
    
        keyboardLetter.addEventListener('click', () => {
            if (keyboardLetter.classList.contains('backspace')) {
                eraseLetter()
                return
            }
            if (keyboardLetter.classList.contains('enter')) {
                makeGuess()
                return
            }

            writeLetter(keyboardLetter.textContent)
        })
    })

    // Setup keydown listener
    document.addEventListener('keydown', e => {
        if (e.key === 'Backspace') {
            eraseLetter()
        }
        else if (e.key === 'Enter') {
            makeGuess()
        }
        // Matches only letters and non-ascii characters
        else if (e.key.match(/^[a-z]|[^\x00-\x7F]$/)) {
            writeLetter(e.key.toUpperCase())
        }
    })

    loadWordList()

}

function loadWordList() {
    fetch('./data/word_list.json')
    .then(
        function(response) {
            response.json().then(function(data) {
                wordList = data['words']
                pickWordOfTheDay()
            })
        }
    )
    .catch(function(err) {
        console.log('Nepodařilo se načíst list slov. Chyba: ', err)
    })
}

function pickWordOfTheDay() {
    var randomIndex = Math.floor(Math.random() * wordList.length)
    wordOfTheDay = wordList[randomIndex]
    console.log(wordOfTheDay)
}

function nextGuess() {
    activeGuessIndex++
    activeLetterIndex = 0
    activeGuess = guessNodes[activeGuessIndex]
    activeGuessLetters = activeGuess.querySelectorAll('.guess-letter')
    guessWord = ''
}

function writeLetter(letter) {
    // All letters filled
    if (activeLetterIndex === LETTER_COUNT) {
        return
    }

    let activeLetter = activeGuessLetters[activeLetterIndex]
    activeLetter.textContent = letter
    activeLetter.classList.add('filled')

    guessWord += letter
    activeLetterIndex++
}

function eraseLetter() {
    // No letters filled
    if (activeLetterIndex === 0) {
        return
    }

    let letterToErase = activeGuessLetters[activeLetterIndex - 1]
    letterToErase.textContent = ''
    letterToErase.classList.remove('filled')

    guessWord = guessWord.slice(0, -1)
    activeLetterIndex -= 1
}

function makeGuess() {
    if (guessWord.length !== LETTER_COUNT) {
        alert('Nebylo vyplněno 6 písmen!')
        return
    }

    guessWord = guessWord.toLowerCase()

    activeGuess.classList.remove('shake-animation')
    void activeGuess.offsetWidth

    if (!wordList.includes(guessWord)) {
        activeGuess.classList.add('shake-animation')
        return
    }

    evaluateGuess()

    nextGuess()
}

function evaluateGuess() {
    let letterIndex = -1
    activeGuessLetters.forEach(guessLetter => {
        letterIndex++

        let letter = guessLetter.textContent.toLowerCase()

        // Incorrect letter
        if (!wordOfTheDay.includes(letter)) {
            let keyboardLetter = document.querySelector('.keyboard-letter[data-letter="' + letter.toUpperCase() + '"]')
            guessLetter.classList.add('incorrect')
            keyboardLetter.classList.add('incorrect')
            return
        }

        // Correct letter, wrong place
        if (wordOfTheDay.charAt(letterIndex) != guessWord.charAt(letterIndex)) {
            guessLetter.classList.add('half-correct')
            return
        }

        // Correct letter, correct place
        guessLetter.classList.add('correct')
    })
}


init()