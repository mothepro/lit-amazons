import Engine, { Spot, Color, Position } from '@mothepro/amazons-engine'
import { customElement, LitElement, html, css, internalProperty, property, PropertyValues } from 'lit-element'
import type { Peer } from '@mothepro/fancy-p2p'
import type { PieceMovedEvent, SpotDestroyedEvent } from '../index.js'

import 'lit-p2p'
import 'lit-confetti'
import '../index.js'

@customElement('p2p-amazons')
export default class extends LitElement {

  protected engine = new Engine

  @property({ attribute: false })
  peers?: Peer<ArrayBuffer>[]

  @property({ attribute: false })
  broadcast?: (data: ArrayBuffer, includeSelf?: boolean) => void

  @internalProperty()
  protected confetti = 0

  static readonly styles = css`
  :host {
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
    display: flex;
    align-items: center;
    text-align: center;
    justify-content: center;
  }
  :host ::part(spot)::after {
    content: '';
    display: inline-block;
    width: 1px;
    height: 0;
    padding-bottom: 100%;
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

  protected async firstUpdated() {
    this.engine.start()
    for await (const state of this.engine.stateChange)
      this.requestUpdate()
    this.confetti = 100
    setTimeout(() => this.confetti = 0, 10 * 1000)
  }

  protected async updated(changed: PropertyValues) {
    if (changed.has('peers') && this.peers && this.peers.length == 2) {
      this.bindMessages(this.colorToPeer(Spot.BLACK)!, Spot.BLACK)
      this.bindMessages(this.colorToPeer(Spot.WHITE)!, Spot.WHITE)
    }
  }

  private async bindMessages({ message, name, close }: Peer, color: Color) {
    try {
      for await (const data of message) {
        if (!(data instanceof ArrayBuffer) || this.engine.current != color)
          throw Error(`${name} sent data when it isn't their turn: ${data}`)

        switch (data.byteLength) {
          case 1: // Destroy
            const [spot] = this.bufToPos(data)
            this.engine.destroy(spot)
            break

          case 2: // Move
            const [from, to] = this.bufToPos(data)
            this.engine.move(from, to)
            break

          default:
            throw Error(`Only expected 1 or 2 bytes, but ${name} sent ${data} (${data.byteLength} bytes)`)
        }
      }
    } catch (error) {
      error.name = name
      error.reaon = 'Lost Connection'
      this.dispatchEvent(new ErrorEvent('p2p-error', { error }))
    }
    close()
  }


  private pieceMoved({ detail: { from, to } }: PieceMovedEvent) {
    if (this.broadcast)
      this.broadcast(this.posToBuf(from, to))
    else
      this.engine.move(from, to)
  }

  private spotDestroyed({ detail: spot }: SpotDestroyedEvent) {
    if (this.broadcast)
      this.broadcast(this.posToBuf(spot))
    else
      this.engine.destroy(spot)
  }

  protected readonly render = () => html`
    <h1 part="title is-${this.engine.stateChange.isAlive ? 'ongoing' : 'over'}">${
    this.peers
      // Online
      ? this.engine.stateChange.isAlive
        ? this.colorToPeer(this.engine.current)!.isYou
          ? 'Your turn'
          : `${this.colorToPeer(this.engine.current)!.name}'s turn`
        : this.colorToPeer(this.engine.waiting)!.isYou
          ? 'You Win!'
          : `${this.colorToPeer(this.engine.waiting)!.name} Wins!`
      // Offline
      : this.engine.stateChange.isAlive
        ? `${this.colorAsString(this.engine.current)}'s turn`
        : `${this.colorAsString(this.engine.waiting)} Wins!`
    }</h1>
    <lit-amazons
      part="game"
      ?ignore=${!(this.colorToPeer(this.engine.current)?.isYou ?? true)}
      state=${this.engine.state}
      current=${this.engine.current}
      .destructible=${this.engine.destructible}
      .pieces=${this.engine.pieces}
      .board=${this.engine.board}
      @piece-moved=${this.pieceMoved}
      @spot-destroyed=${this.spotDestroyed}
    ></lit-amazons>
    <lit-confetti count=${this.confetti} gravity=1></lit-confetti>`

  // TODO: Make the following static

  private colorAsString = (color: Color) => color == Spot.BLACK
    ? 'Black'
    : 'White'

  /** Converts a */
  private colorToPeer: (color: Color) => Peer | undefined = (color: Color) =>
    this.peers
      ? color == Spot.BLACK
        ? this.peers[0]
        : this.peers[1]
      : undefined

  // Note: board must be an 8x8 or smaller
  private posToBuf = (...pos: Position[]) => new Uint8Array(
    pos.map(([x, y]) => x | y << 4))

  private bufToPos = (data: ArrayBuffer) => [...new Uint8Array(data)].map(byte => ([
    byte & 0b0000_1111,
    byte >> 4,
  ] as Position))
}
