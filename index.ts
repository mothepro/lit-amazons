import { customElement, LitElement, property, html, css } from 'lit-element'
import { styleMap } from 'lit-html/directives/style-map.js'
import type LooseMap from '@mothepro/loose-map'
import type LooseSet from '@mothepro/loose-set'
import type { Position, Board, Color, State, Spot } from '@mothepro/amazons-engine'

export type PiecePickedEvent = CustomEvent<{
  color: Spot.BLACK | Spot.WHITE
  position: Position
  moves: Set<Position>
}>
export type PieceMovedEvent = CustomEvent<{
  from: Position,
  to: Position
}>
export type PieceLetGoEvent = CustomEvent<void>

@customElement('lit-amazons')
export default class extends LitElement {
  /**
   * The current state of the game.
   * It will only take a few properties from the real game engine.
   */
  @property()
  private engine!: Pick<Engine, 'state' | 'destructible' | 'pieces' | 'current' | 'board'>

  /** The piece that is currently being dragged */
  private picked?: Position

  static readonly styles = css`
  :host {
    display: grid;
    user-select: none;
  }`

  /** Whether a spot is valid to be played on in this state. */
  protected isValid = ([x, y]: Position) => {
    switch (this.engine.state) {
      case State.DESTROY:
        return this.engine.destructible.has([x, y])
      
      case State.MOVE:
        return this.engine.pieces.get(this.picked!)?.moves.has([x, y]) ?? false
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
    const position = this.getPosition(event)
    if (this.engine.state == State.DESTROY && this.isValid(position))
      this.dispatchEvent(new CustomEvent('spot-destroyed', { detail: position }))
  }

  protected canPickupPiece = ([x, y]: Position) =>
    this.engine.state == State.MOVE
    && this.engine.current == this.engine.board[y][x]
    && this.engine.pieces.has([x, y])

  protected pickupPiece(event: DragEvent) {
    this.dispatchEvent(new CustomEvent('piece-picked', { detail: this.picked = this.getPosition(event) }))
    this.requestUpdate()
  }

  protected dropPiece(event: DragEvent) {
    this.dispatchEvent(new CustomEvent('piece-moved', {
      detail: {
        from: this.picked,
        to: this.getPosition(event)!
      }
    }))
    this.letGoPiece()
  }

  protected letGoPiece() {
    delete this.picked
    this.dispatchEvent(new CustomEvent('piece-let-go'))
    this.requestUpdate()
  }

  protected readonly render = () => html`${this.engine?.board.map((row, y) => row.map((spot, x) => html`
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
      style=${styleMap({
        gridArea: `${y + 1} / ${x + 1}`
      })}>
      ${spot == Spot.DESTROYED || spot == Spot.BLACK || spot == Spot.WHITE ? html`
        <span
          part="symbol
            symbol-${spot}
            symbol-${this.canPickupPiece([x, y]) ? 'draggable' : 'not-draggable'}"
          x=${x} y=${y}
          draggable=${this.canPickupPiece([x, y]).toString() as 'true' | 'false'}
          @dragstart=${this.pickupPiece}
        ></span>` : ''}
    </div>`))}`
}
