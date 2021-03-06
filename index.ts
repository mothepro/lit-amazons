import { customElement, LitElement, property, html, css } from 'lit-element'
import { styleMap } from 'lit-html/directives/style-map.js'
import { Position, Board, Color, State, Spot } from '@mothepro/amazons-engine'
import type LooseMap from '@mothepro/loose-map'
import type LooseSet from '@mothepro/loose-set'

export type SpotDestroyedEvent = CustomEvent<Position>
export type PiecePickedEvent = CustomEvent<{
  color: Color
  position: Position
  moves: Set<Position>
}>
export type PieceMovedEvent = CustomEvent<{
  from: Position,
  to: Position
}>
export type PieceLetGoEvent = CustomEvent<void>

declare global {
  interface HTMLElementEventMap {
    ['spot-destroyed']: SpotDestroyedEvent
    ['piece-picked']: PiecePickedEvent
    ['piece-moved']: PieceMovedEvent
    ['piece-let-go']: PieceLetGoEvent
  }
}

@customElement('lit-amazons')
export default class extends LitElement {
  /** Whether the actions can not be preformed by the current user. */
  @property({ type: Boolean })
  ignore = false

  /** Whether a piece is currently being dragged. */
  @property({ type: Boolean, reflect: true })
  dragging = false

  @property({ type: Number })
  state = State.WAITING

  @property({ type: Number })
  current: Color = Spot.BLACK

  @property({ attribute: false })
  destructible?: LooseSet<Position>

  @property({ attribute: false })
  pieces?: LooseMap<Position, {
    color: Color,
    moves: LooseSet<Position>
  }>

  @property({ type: Array, reflect: true })
  board: Board = []

  /** The piece that is currently being dragged */
  private picked?: Position

  static readonly styles = css`
  :host {
    display: grid;
    user-select: none;
    grid-auto-rows: 1fr;
    grid-auto-columns: 1fr;
  }
  :host [part~=symbol-${Spot.BLACK}]:before {
    content: var(--blackSpot, '♛');
  }
  :host [part~=symbol-${Spot.WHITE}]:before {
    content: var(--whiteSpot, '♕');
  }
  :host [part~=symbol-${Spot.DESTROYED}]:before {
    content: var(--destroyedSpot, '💥');
  }`

  /** Whether a spot is valid to be played on in this state. */
  protected isValid = ([x, y]: Position) => {
    switch (this.state) {
      case State.DESTROY:
        return this.destructible?.has([x, y]) ?? false

      case State.MOVE:
        return this.pieces?.get(this.picked!)?.moves.has([x, y]) ?? false
    }
    return false
  }

  /** Gets the position from an Event's target. */
  protected getPosition = ({ target }: Event): Position => [
    parseInt((target as EventTarget & Element).getAttribute('x')!),
    parseInt((target as EventTarget & Element).getAttribute('y')!),
  ]

  /** Attempt to destory a spot on the board. */
  protected destroy(event: MouseEvent) {
    const detail = this.getPosition(event)
    if (!this.ignore && this.state == State.DESTROY && this.isValid(detail))
      this.dispatchEvent(new CustomEvent('spot-destroyed', { detail }))
  }

  protected canPickupPiece = ([x, y]: Position) => !this.ignore
    && !!this.board && !!this.pieces // shouldn't be needed
    && this.state == State.MOVE
    && this.current == this.board[y][x]
    && this.pieces?.has([x, y])

  protected pickupPiece(event: DragEvent | TouchEvent) {
    this.dispatchEvent(new CustomEvent('piece-picked', { detail: this.picked = this.getPosition(event) }))
    this.dragging = true
  }

  protected dropPiece(event: DragEvent | TouchEvent) {
    const to = this.getPosition(event)
    if (this.picked && this.picked?.toString() != to.toString()) {
      this.dispatchEvent(new CustomEvent('piece-moved', { detail: { from: this.picked, to } }))
      this.letGoPiece()
    }
  }

  protected letGoPiece() {
    delete this.picked
    this.dispatchEvent(new CustomEvent('piece-let-go'))
    this.dragging = false
  }

  protected readonly render = () => html`${this.board?.map((row, y) => row.map((spot, x) => html`
    <div
      part="spot
        spot-x-${x} spot-y-${y}
        spot-${spot}
        spot-${this.isValid([x, y]) ? 'valid' : 'invalid'}
        spot-parity-${y % 2 == x % 2 ? 'same' : 'different'}"
      x=${x} y=${y}
      @dragover=${(event: DragEvent) => this.isValid([x, y]) && event.preventDefault()}
      @dragend=${this.letGoPiece}
      @drop=${this.dropPiece}
      @click=${this.destroy}
      @touchend=${this.dropPiece}
      style=${styleMap({ gridArea: `${y + 1} / ${x + 1}` })}>
      ${spot == Spot.DESTROYED || spot == Spot.BLACK || spot == Spot.WHITE ? html`
        <span
          part="symbol
            symbol-${spot}
            symbol-${this.canPickupPiece([x, y]) ? 'draggable' : 'not-draggable'}"
          x=${x} y=${y}
          draggable=${this.canPickupPiece([x, y]).toString() as 'true' | 'false'}
          @touchend=${(e: TouchEvent) => this.canPickupPiece([x, y]) && this.pickupPiece(e)}
          @dragstart=${this.pickupPiece}
        ></span>` : ''}
    </div>`))}`
}
