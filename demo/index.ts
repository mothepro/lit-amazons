import Engine from '@mothepro/amazons-engine'
import { customElement, LitElement, html, css } from 'lit-element'
import 'lit-confetti'
import '../index.js'
import { PieceMovedEvent, SpotDestroyedEvent } from '../index.js' // Seperate import since this is only for types

@customElement('amazons-demo')
export default class extends LitElement {

  protected engine = new Engine

  protected confetti = 0

  static readonly styles = css`
  :host {
    display: block;
    text-align: center;
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

  :host ::part(symbol-1):before {
    content: '♛';
  }
  :host ::part(symbol-2):before {
    content: '♕';
  }
  :host ::part(symbol-4):before {
    content: '💥';
  }
  `

  async firstUpdated() {
    this.engine.winner.once(() => {
      this.confetti = 150
      this.requestUpdate() // Must update to show new value
      setTimeout(() => !(this.confetti = 0) && this.requestUpdate(), 10000)
    })

    // TODO, both of these aren't needed
    this.engine.boardChanged.on(() => this.requestUpdate())
    this.engine.stateChange.on(() => this.requestUpdate())
    
    this.engine.start()
  }

  protected readonly render = () => html`
    <lit-amazons
      .engine=${{...this.engine}}
      @piece-moved=${({ detail: { from, to } }: PieceMovedEvent) => this.engine.move(from, to)}
      @spot-destroyed=${({ detail }: SpotDestroyedEvent) => this.engine.destroy(detail)}
      @piece-picked=${() => this.setAttribute('dragging', '')}
      @piece-let-go=${() => this.removeAttribute('dragging')}
    ></lit-amazons>
    <lit-confetti count=${this.confetti} gravity=1></lit-confetti>
    `
}
