import Engine, { Spot, Color } from '@mothepro/amazons-engine'
import { customElement, LitElement, html, css, internalProperty } from 'lit-element'
import type { PieceMovedEvent, SpotDestroyedEvent } from '../index.js'

import 'lit-confetti'
import '../index.js'

const asString = (color: Color) => color == Spot.BLACK
  ? 'Black'
  : 'White'

@customElement('amazons-offline-demo')
export default class extends LitElement {

  protected engine = new Engine

  @internalProperty()
  protected confetti = 0

  static readonly styles = css`
  :host {
    display: block;
    text-align: center;
    
    --blackSpot: '♛';
    --whiteSpot: '♕';
    --destroyedSpot: '💥';
  }

  :host lit-confetti {
    position: fixed;
  }

  :host lit-amazons {
    grid-auto-rows: 1fr;
    grid-auto-columns: 1fr;

    border: thin solid black;
    margin: 0 auto;
    width: 100%;
    max-width: 1000px;
    max-height: 1000px;
  }

  :host lit-amazons[dragging], :host ::part(symbol-draggable) {
    cursor: grabbing;
  }
  
  :host ::part(spot) {
    width: 100%
  }
  :host ::part(spot-parity-same) {
    background-color: lightgrey;
  }
  :host ::part(symbol-draggable) {
    cursor: grab;
  }
  :host ::part(symbol-draggable):active {
    color: red;
  }
  :host :not([ignore])::part(spot-valid) {
    background-color: yellow;
  }
  :host ::part(spot-valid):hover {
    cursor: pointer;
    border: thin solid red;
  }

  /* Symbol Sizing */
  :host ::part(symbol) {
    font-size: 1em;
  }
  @media (min-width: 576px) { /* bootstrap "sm" */
    :host ::part(symbol) {
      font-size: 2em;
    }
  }
  @media (min-width: 768px) { /* bootstrap "md" */
    :host ::part(symbol) {
      font-size: 3em;
    }
  }
  @media (min-width: 992px) { /* bootstrap "lg" */
    :host ::part(symbol) {
      font-size: 4em;
    }
  }
  @media (min-width: 1200px) { /* bootstrap "xl" */
    :host ::part(symbol) {
      font-size: 5em;
    }
  }`

  async firstUpdated() {
    this.engine.start()
    for await (const state of this.engine.stateChange)
      this.requestUpdate()
    this.confetti = 150
    setTimeout(() => this.confetti = 0, 10 * 1000)
  }

  protected readonly render = () => html`
    <h1>${this.engine.stateChange.isAlive
      ? `${asString(this.engine.current)}'s turn`
      : `${asString(this.engine.waiting)} Wins!`
    }</h1>
    <lit-amazons
      state=${this.engine.state}
      current=${this.engine.current}
      .destructible=${this.engine.destructible}
      .pieces=${this.engine.pieces}
      .board=${this.engine.board}
      @piece-moved=${({ detail: { from, to } }: PieceMovedEvent) => this.engine.move(from, to)}
      @spot-destroyed=${({ detail }: SpotDestroyedEvent) => this.engine.destroy(detail)}
      @piece-picked=${() => this.setAttribute('dragging', '')}
      @piece-let-go=${() => this.removeAttribute('dragging')}
    ></lit-amazons>
    <lit-confetti count=${this.confetti} gravity=1></lit-confetti>`
}
