const LETTER_COUNT = 6
const GUESS_COUNT = 6

const guessContainer = document.querySelector('.guess-container')
const firstGuessNode = document.querySelector('.guess')
const keyboardKeys = document.querySelectorAll('.keyboard-key')
const toggleKeys = document.querySelectorAll('.keyboard-key[data-special="toggle"]')
const modals = document.querySelectorAll('.modal')

const toggleMap = {
    1: {},
    2: {}
}
const toggled = {
    1: false,
    2: false
}

let gameOver = false

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
    initGuessContainers()

    // Setup UI keyboard click listeners
    initUIKeyboard()

    // Setup keydown listener
    initKeyDown()

    // Setup modal windows
    initModals()

    loadWordList()

}

function initGuessContainers() {
    for (let i = 1; i < GUESS_COUNT; i++) {
        let guessNodeClone = firstGuessNode.cloneNode(true)
        guessNodes.push(guessNodeClone)
        guessContainer.appendChild(guessNodeClone)
    }
}

function initUIKeyboard() {
    keyboardKeys.forEach((keyboardLetter) => {
        if (!keyboardLetter.dataset.special) {
            keyboardLetter.dataset.letter = keyboardLetter.textContent
        }
        if (keyboardLetter.dataset.toggle) {
            const key = keyboardLetter.dataset.toggleKey
            const toggleLetter = keyboardLetter.dataset.toggle
            toggleMap[key][toggleLetter] = keyboardLetter
        }

        keyboardLetter.addEventListener('click', () => {
            if (keyboardLetter.dataset.special) {
                switch (keyboardLetter.dataset.special) {
                    case 'backspace':
                        eraseLetter()
                        return
                    case 'enter':
                        makeGuess()
                        return
                    case 'toggle':
                        toggleLetters(keyboardLetter.dataset.toggleKey)
                        return
                    default:
                        return
                }
            }

            writeLetter(keyboardLetter.textContent)
        })
    })
}

function initKeyDown() {
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeAllModals()
        }
        else if (e.key === 'Backspace') {
            eraseLetter()
        }
        else if (e.key === 'Enter') {
            makeGuess()
        }
        else if (e.key === 'Dead') {
            const key = e.shiftKey ? 1 : 2
            toggleLetters(key)
        }
        // Matches only letters and non-ascii characters
        else if (e.key.match(/^[a-z]|[^\x00-\x7F]$/)) {
            writeLetter(e.key.toUpperCase())
        }
    })
}

function initModals() {
    modals.forEach((modal) => {
        modal.addEventListener('click', (e) => {
            if (modal.dataset.opened == 1) {
                toggleModal(modal.dataset.modal)
            }
        })
    })
}

function closeAllModals() {
    modals.forEach((modal) => {
        modal.dataset.opened = 0
    })
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

function toggleModal(key) {
    const modal = document.querySelector(`.modal[data-modal="${key}"]`)
    if (modal) {
        modal.dataset.opened = modal.dataset.opened == 0 ? 1 : 0
    }
}

function nextGuess() {
    activeGuessIndex++
    activeLetterIndex = 0
    activeGuess = guessNodes[activeGuessIndex]
    activeGuessLetters = activeGuess.querySelectorAll('.guess-letter')
    guessWord = ''
}

function writeLetter(letter) {
    // Game over or all letters filled
    if (gameOver || activeLetterIndex === LETTER_COUNT) {
        return
    }

    // Untoggle toggled letters
    for (const key in toggled) {
        if (toggled[key]) {
            toggleLetters(key)
        }
    }

    let activeLetter = activeGuessLetters[activeLetterIndex]
    activeLetter.textContent = letter
    activeLetter.classList.add('filled')

    guessWord += letter
    activeLetterIndex++
}

function eraseLetter() {
    // Game over or no letters filled
    if (gameOver || activeLetterIndex === 0) {
        return
    }

    let letterToErase = activeGuessLetters[activeLetterIndex - 1]
    letterToErase.textContent = ''
    letterToErase.classList.remove('filled')

    guessWord = guessWord.slice(0, -1)
    activeLetterIndex -= 1
}

function toggleLetters(key) {
    // Game over
    if (gameOver) {
        return
    }

    toggleKeys.forEach((k) => {
        if (k.dataset.toggleKey == key) {
            k.classList.toggle('toggled')
        }
    })
    toggled[key] = !toggled[key]
    for(const letter in toggleMap[key]) {
        toggleMap[key][letter].classList.toggle('hidden')
    }
}

function makeGuess() {
    // Game over
    if (gameOver) {
        return
    }

    guessWord = guessWord.toLowerCase()

    activeGuess.classList.remove('shake-animation')
    void activeGuess.offsetWidth

    if (guessWord.length !== LETTER_COUNT || !wordList.includes(guessWord)) {
        activeGuess.classList.add('shake-animation')
        return
    }

    evaluateGuess()

    nextGuess()
}

function evaluateGuess() {
    let letterIndex = -1
    let correctLetters = 0

    activeGuessLetters.forEach((guessLetter) => {
        letterIndex++

        let letter = guessLetter.textContent.toLowerCase()

        // Incorrect letter
        if (!wordOfTheDay.includes(letter)) {
            let keyboardLetters = document.querySelectorAll(`.keyboard-key[data-letter="${letter.toUpperCase()}"]`)
            keyboardLetters.forEach((letter) => {
                letter.classList.add('incorrect')
            })
            guessLetter.classList.add('incorrect')
            return
        }

        // Correct letter, wrong place
        if (wordOfTheDay.charAt(letterIndex) != guessWord.charAt(letterIndex)) {
            guessLetter.classList.add('half-correct')
            return
        }

        // Correct letter, correct place
        guessLetter.classList.add('correct')
        correctLetters++
    })

    if (correctLetters === LETTER_COUNT) {
        finishGame(true)
    }
}

function finishGame(win) {
    gameOver = true
    
    toggleModal('game-over')
}


// START THE APP
init()