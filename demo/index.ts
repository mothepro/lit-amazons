import { customElement, LitElement, html, css } from 'lit-element'
import 'lit-confetti'
import '../index.js'

@customElement('amazons-demo')
export default class extends LitElement {

  protected confetti = 0

  protected handle?: NodeJS.Timeout

  static readonly styles = css`
  :host ::part(spot) {
    display: inline-block;
    width: 50px;
    height: 50px;
    margin: 0;
    background: grey
  }
  `

  protected finished() {
    this.confetti = 150

    // Display confetti for 5 seconds, before starting to remove it
    setTimeout(() =>
      this.handle = setInterval(() =>
        --this.confetti
        || clearInterval(this.handle!),
        100),
      10000)
  }

  protected readonly render = () => html`
    <lit-amazons
      @game-completed=${this.finished}
    ></lit-amazons>
    <lit-confetti count=${this.confetti} gravity=1></lit-confetti>
  `
}
