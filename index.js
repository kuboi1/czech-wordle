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
let gameWon = false

let guessNodes = [firstGuessNode]
let activeGuessIndex = 0
let activeLetterIndex = 0
let activeGuess = firstGuessNode
let activeGuessLetters = firstGuessNode.querySelectorAll('.guess-letter')

let guessWord = ''
let guessedWords = []

let localData
let wordList

function init() {
    // Load local data
    initLocalData()

    console.log(localData.wordOfTheDay)
    
    // Create guess containers
    initGuessContainers()
    
    // Setup UI keyboard click listeners
    initUIKeyboard()
    
    // Setup keydown listener
    initKeyDown()
    
    // Setup modal windows
    initModals()

    // Setup options buttons
    initOptions()
    
    setupGame()
    
}

function initGuessContainers() {
    for (let i = 1; i < GUESS_COUNT; i++) {
        let guessNodeClone = firstGuessNode.cloneNode(true)
        guessNodes.push(guessNodeClone)
        guessContainer.appendChild(guessNodeClone)
    }
}

function initUIKeyboard() {
    keyboardKeys.forEach((keyboardKey) => {
        if (!keyboardKey.dataset.special) {
            keyboardKey.dataset.letter = keyboardKey.textContent
        }
        if (keyboardKey.dataset.toggle) {
            const key = keyboardKey.dataset.toggleKey
            const toggleLetter = keyboardKey.dataset.toggle
            if (key == 3) {
                toggleMap[1][toggleLetter[0]] = keyboardKey
                toggleMap[2][toggleLetter[1]] = keyboardKey
            } else {
                toggleMap[key][toggleLetter] = keyboardKey
            }
        }

        keyboardKey.addEventListener('click', () => {
            if (keyboardKey.dataset.special) {
                switch (keyboardKey.dataset.special) {
                    case 'backspace':
                        eraseLetter()
                        return
                    case 'enter':
                        makeGuess()
                        return
                    case 'toggle':
                        toggleLetters(keyboardKey.dataset.toggleKey)
                        return
                    default:
                        return
                }
            }

            writeLetter(keyboardKey.textContent)
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

function updateStatsModal() {
    const statsModal = document.querySelector('[data-modal="stats"]')
    statsModal.querySelector('.end-modal-title').textContent = gameOver ? (gameWon ? 'DOBRÁ PRÁCE!' : 'Dnes to bohužel nevyšlo...') : 'Dnešní hru jste ještě nedohrál/a.'
    statsModal.querySelector('.end-modal-subtitle').classList.toggle('hidden', !gameOver)
    statsModal.querySelector('.end-modal-wordoftheday').textContent = localData.wordOfTheDay.toUpperCase()
    statsModal.querySelector('[data-stat="streak"]').textContent = localData.streak
    statsModal.querySelector('[data-stat="guess-today"]').textContent = guessedWords.length
    statsModal.querySelector('[data-stat="guess-average"]').textContent = (localData.guessCount / localData.gameCount).toFixed(1)
}

function initLocalData() {
    localData = window.localStorage.getItem('wordleData')

    console.log(localData)

    if (localData) {
        localData = JSON.parse(localData)
    } else {
        localData = {
            finishedToday: false,
            wordOfTheDay: null,
            gameState: [],
            streak: 0,
            guessCount: 0,
            gameCount: 0,
            lastSave: null
        }
        saveLocalData()
    }
}

function loadGameState() {
    for (const word of localData.gameState) {
        for (const letter of word) {
            writeLetter(letter.toUpperCase())
        }
        makeGuess()
    }
}

function saveLocalData() {
    localData.lastSave = getCurrentDate()
    window.localStorage.setItem('wordleData', JSON.stringify(localData))
}

function initOptions() {
    const optionsContainer = document.querySelector('.options-container')

    const statsButton = optionsContainer.querySelector('[data-options="stats"]')

    statsButton.addEventListener('click', (e) => {
        updateStatsModal()
        toggleModal('stats')
    })
}

function setupGame() {
    fetch('./data/word_list.json')
    .then(
        function(response) {
            response.json().then(function(data) {
                wordList = data['words']
                // If word of the day was not set or it is a new day
                if (!localData.wordOfTheDay || getCurrentDate() !== localData.lastSave) {
                    localData.finishedToday = false
                    localData.gameState = []
                    pickWordOfTheDay()
                    saveLocalData()
                }
                loadGameState()
            })
        }
    )
    .catch(function(err) {
        console.log('Nepodařilo se načíst list slov. Chyba: ', err)
    })
}

function pickWordOfTheDay() {
    var randomIndex = Math.floor(Math.random() * wordList.length)
    localData.wordOfTheDay = wordList[randomIndex]
}

function getCurrentDate() {
    const date = new Date()
    return `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`
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
        } else {
            k.classList.remove('toggled')
        }
    })

    const otherKey = key == 1 ? 2 : 1

    toggled[key] = !toggled[key]

    if (toggled[otherKey]) {
        for(const letter in toggleMap[otherKey]) {
            toggleMap[otherKey][letter].classList.toggle('hidden')
        }
        toggled[otherKey] = false
    }

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

    if (guessWord.length !== LETTER_COUNT || guessedWords.includes(guessWord) || !wordList.includes(guessWord)) {
        activeGuess.classList.add('shake-animation')
        return
    }

    // Save game state
    guessedWords.push(guessWord)
    localData.gameState = guessedWords
    saveLocalData()

    evaluateGuess()

    if (guessedWords.length === GUESS_COUNT && !gameOver) {
        finishGame(false)
    }

    if (!gameOver) {
        nextGuess()
    }
}

function evaluateGuess() {
    let letterIndex = -1
    let correctLetters = 0

    activeGuessLetters.forEach((guessLetter) => {
        letterIndex++

        const letter = guessLetter.textContent.toLowerCase()
        const keyboardKey = document.querySelector(`.keyboard-key[data-letter="${letter.toUpperCase()}"]`)

        // Incorrect letter
        if (!localData.wordOfTheDay.includes(letter)) {
            keyboardKey.classList.add('incorrect')
            guessLetter.classList.add('incorrect')
            return
        }

        // Correct letter, wrong place
        if (localData.wordOfTheDay.charAt(letterIndex) != guessWord.charAt(letterIndex)) {
            keyboardKey.classList.add('half-correct')
            guessLetter.classList.add('half-correct')
            return
        }

        // Correct letter, correct place
        keyboardKey.classList.add('correct')
        guessLetter.classList.add('correct')
        correctLetters++
    })

    if (correctLetters === LETTER_COUNT) {
        finishGame(true)
    }
}

function finishGame(win) {
    gameOver = true
    gameWon = win

    if (!localData.finishedToday) {
        if (win) {
            localData.streak++
        } else {
            localData.streak = 0
        }
        localData.guessCount += guessedWords.length
        localData.gameCount++
        localData.finishedToday = true
        saveLocalData()
    }

    // Set end stats
    updateStatsModal()

    toggleModal('stats')
}


// START THE APP
init()