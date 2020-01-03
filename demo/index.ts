import { customElement, LitElement, html, css } from 'lit-element'
import 'lit-confetti'
import '../index.js'

@customElement('amazons-demo')
export default class extends LitElement {

  protected confetti = 0

  protected handle?: NodeJS.Timeout

  static readonly styles = css`
  :host {
    display: block;
    text-align: center
  }

  :host lit-confetti {
    position: fixed;
  }

  :host lit-amazons {
    grid-auto-rows: 1fr;
    grid-auto-columns: 1fr;

    border: thin solid black;
    width: 1000px;
    height: 1000px;
  }
  
  :host ::part(spot) {
    width: 100%
  }
  
  :host ::part(spot-parity-same) {
    background-color: lightgrey;
  }

  :host ::part(symbol) {
    font-size: 5em;
  }

  :host ::part(symbol-draggable) {
    cursor: grab;
  }

  :host([dragging]) ::part(symbol-draggable) {
    cursor: grabbing;
  }
  
  :host ::part(spot-valid) {
    background-color: yellow;
  }

  :host ::part(spot-valid):hover {
    cursor: pointer;
    border: thin solid red;
  }
  `

  protected finished() {
    this.confetti = 150
    this.requestUpdate()

    // Display confetti for 5 seconds, before starting to remove it
    setTimeout(() =>
      this.handle = setInterval(() => {
        if (0 == --this.confetti)
          clearInterval(this.handle!)
        this.requestUpdate()
      }, 100),
      5000)
  }

  protected readonly render = () => html`
    <lit-amazons
      @game-completed=${this.finished}
      @piece-picked=${() => this.setAttribute('dragging', '')}
      @piece-let-go=${() => this.removeAttribute('dragging')}
    ></lit-amazons>
    <lit-confetti count=${this.confetti} gravity=1></lit-confetti>
  `
}
