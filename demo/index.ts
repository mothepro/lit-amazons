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
    border: thin solid black;
  }

  :host lit-amazons {
    font-size: 5em;
    grid-auto-rows: 1fr;
    grid-auto-columns: 1fr;
  }
  
  :host ::part(parity-dark) {
    background-color: grey;
  }
  
  :host ::part(valid) {
    background-color: yellow;
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
    ></lit-amazons>
    <lit-confetti count=${this.confetti} gravity=1></lit-confetti>
  `
}
