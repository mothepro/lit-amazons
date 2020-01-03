import { customElement, LitElement, property, html, css, PropertyValues } from 'lit-element'
import { styleMap } from 'lit-html/directives/style-map.js'
import Engine, { Position, Spot, Action } from '@mothepro/amazons-engine'

export type TurnStartedEvent = CustomEvent<Spot.BLACK | Spot.WHITE>
export type BoardChangedEvent = CustomEvent
export type GameCompletedEvent = CustomEvent<Spot.BLACK | Spot.WHITE>
export type SpotDestroyedEvent = CustomEvent<Position>
export type PiecePickedEvent = CustomEvent<{
  color: Spot.BLACK | Spot.WHITE
  position: Position
  moves: Set<Position>
}>
export type PieceMovedEvent = CustomEvent<{
  from: Position,
  to: Position
}>
export type PieceLetGoEvent = CustomEvent

@customElement('lit-amazons')
export default class extends LitElement {
  @property({ type: Engine })
  private engine!: Engine

  /** The piece that is currently being dragged */
  private picked?: {
    startingPosition: Position
    validMoves: Set<string>
  }

  static readonly styles = css`
  :host {
    display: grid;
    user-select: none;
  }
  `

  async updated(oldProps: PropertyValues) {
    if (oldProps.has('engine')) {
      this.engine.boardChanged.on(() => this.requestUpdate() && this.dispatchEvent(new CustomEvent('board-changed')))
      this.engine.stateChange.on(() => this.requestUpdate())
      this.engine.turn.on(detail => this.dispatchEvent(new CustomEvent('turn-started', { detail })))
      this.engine.moved.on(detail => {
        this.picked = {
          startingPosition: detail.position,
          validMoves: new Set([...detail.destructible].map(pos => pos.toString())),
        }
        this.requestUpdate()
      })
      this.engine.winner.once(detail => this.dispatchEvent(new CustomEvent('game-completed', { detail })))
      this.engine.start()
      await this.engine.stateChange.next
      this.requestUpdate()
    }
  }

  /** Whether a spot on the board (piece) can be moved. */
  protected canMove = ([x, y]: Position) =>
    this.engine.actionNeeded == Action.MOVE
    && this.engine.current == this.engine.board[y][x]
    && this.engine.pieces.has([x, y].toString())

  /** Whether a spot is valid to be played on in this state. */
  protected isValid = ([x, y]: Position) =>
    this.picked?.validMoves.has([x, y].toString()) ?? false

  protected getTargetPosition = (target: EventTarget | null): Position => [
    parseInt((target as EventTarget & { getAttribute(s: string): string }).getAttribute('x')),
    parseInt((target as EventTarget & { getAttribute(s: string): string }).getAttribute('y')),
  ]

  /** Attempt to destory a spot on the board. */
  protected destroy(event: MouseEvent) {
    const position = this.getTargetPosition(event.target)
    if (this.engine.actionNeeded == Action.DESTROY && this.picked?.validMoves.has(position.toString())) {
      delete this.picked
      this.dispatchEvent(new CustomEvent('spot-destroyed', { detail: position }))
    }
  }

  protected pickupPiece({ target }: DragEvent) {
    const detail = this.engine.pieces.get(this.getTargetPosition(target).toString())!
    this.picked = {
      startingPosition: detail.position,

      // stringify the positions so we can check valid positions in constant time
      // This is because [] !== []. Set's use this comparision.
      validMoves: new Set([...detail.moves].map(pos => pos.toString())),
    }
    this.dispatchEvent(new CustomEvent('piece-picked', { detail }))
    this.requestUpdate()
  }

  /** Currently dragging a piece over a potential spot. `preventDefault` to mark as valid. */
  protected checkSpotValid = (event: DragEvent) =>
    this.picked?.validMoves.has(this.getTargetPosition(event.target)!.toString())
    && event.preventDefault()

  /** A piece has been dropped to a valid position */
  protected async dropPiece({ target }: DragEvent) {
    this.dispatchEvent(new CustomEvent('piece-moved', {
      detail: {
        from: this.picked!.startingPosition,
        to: this.getTargetPosition(target)!
      }
    }))
    this.letGoPiece()
  }

  protected letGoPiece() {
    delete this.picked
    this.dispatchEvent(new CustomEvent('piece-let-go'))
    this.requestUpdate()
  }

  protected symbol(spot: Spot) {
    switch (spot) {
      case Spot.BLACK:
        return '♛'
      case Spot.WHITE:
        return '♕'
      case Spot.DESTROYED:
        return '💣'
    }
  }

  protected readonly render = () => this.engine && html`
    ${this.engine.board.map((row, y) => row.map((spot, x) => html`
    <div
      part="spot spot-${spot} spot-${this.isValid([x, y]) ? 'valid' : 'invalid'} spot-x-${x} spot-y-${y} spot-parity-${y % 2 == x % 2 ? 'same' : 'different'}"
      x=${x} y=${y}
      @dragover=${this.checkSpotValid}
      @dragend=${this.letGoPiece}
      @drop=${this.dropPiece}
      @click=${this.destroy}
      style=${styleMap({ gridArea: `${y + 1} / ${x + 1}` })}>
      ${this.symbol(spot) /* we have something to display */ ? html`
        <span
          part="symbol symbol-${this.canMove([x, y]) ? 'draggable' : 'not-draggable'}"
          draggable=${this.canMove([x, y]).toString() as 'true' | 'false'}
          x=${x} y=${y}
          @dragstart=${this.pickupPiece}
        >${this.symbol(spot)}</span>` : ''}
    </div>`))}
  `
}
