import '../index.js'
import 'lit-confetti'

const confetti = document.getElementsByTagName('lit-confetti')[0]
const amazons = document.getElementsByTagName('lit-amazons')[0]

amazons.addEventListener('game-completed', () => confetti.setAttribute('count', 100))
