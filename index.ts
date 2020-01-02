import { customElement, LitElement, property, html, css } from 'lit-element'
import { styleMap } from 'lit-html/directives/style-map.js'
import Engine, { Board, Position, Spot } from '@mothepro/amazons-engine'

@customElement('lit-amazons')
export default class extends LitElement {
  private engine = new Engine

  /** The piece that is currently being dragged */
  private pickedPiece?: {
    color: Spot.BLACK | Spot.WHITE
    position: Position
    moves: Set<string>
  }

  /** This should not be accessed. The board should be obtained thru the engine. */
  @property({ type: Array })
  board?: Board

  static readonly styles = css`
  :host {
    display: grid;
  }
  `

  private bindEngine() {
    // Update what is rendered when board changes.
    this.engine.boardChanged.on(() => this.requestUpdate() && this.dispatchEvent(new CustomEvent('board-changed')))
    this.engine.turn.on(detail => this.dispatchEvent(new CustomEvent('turn-started', { detail })))
    this.engine.moved.on(detail => this.dispatchEvent(new CustomEvent('piece-moved', { detail })))
    this.engine.winner.once(detail => this.dispatchEvent(new CustomEvent('game-completed', { detail })))
    this.engine.start()
  }

  firstUpdated() {
    this.bindEngine()
  }

  updated(oldProps: Map<string, any>) {
    if (oldProps.has('board')) {
      this.engine = new Engine(this.board)
      this.bindEngine()
    }
  }

  /** Whether a spot on the board (piece) can be moved. */
  protected canMove = ([x, y]: Position) =>
    this.engine.current == this.engine.board[y][x]
    && this.engine.pieces.has([x, y].toString())

  protected getTargetPosition = (target: EventTarget | null): Position => [
    parseInt((target as EventTarget & { getAttribute(s: string): string }).getAttribute('x')),
    parseInt((target as EventTarget & { getAttribute(s: string): string }).getAttribute('y')),
  ]

  protected pickupPiece({ target }: DragEvent) {
    const { moves, ...rest } = this.engine.pieces.get(this.getTargetPosition(target).toString())!
    this.pickedPiece = {
      ...rest,

      // stringify the positions so we can check valid positions in constant time
      // This is because [] !== []. Set's use this comparision.
      moves: new Set([...moves].map(pos => pos.toString())),
    }
    this.requestUpdate()
  }

  /** Currently dragging a piece over a potential spot. `preventDefault` to mark as valid. */
  protected checkSpotValid = (event: DragEvent) =>
    this.pickedPiece?.moves.has(this.getTargetPosition(event.target)!.toString())
    && event.preventDefault()

  /** A piece has been dropped to a valid position */
  protected dropPiece({ target }: DragEvent) {
    this.engine.move(this.pickedPiece!.position, this.getTargetPosition(target)!)
    delete this.pickedPiece
  }

  protected letGoPiece() {
    delete this.pickedPiece
    this.requestUpdate()
  }

  protected symbol(spot: Spot) {
    switch (spot) {
      case Spot.BLACK:
        return '♛'
      case Spot.WHITE:
        return '♕'
    }
    return ''
  }

  protected readonly render = () => this.engine && html`
    ${this.engine.board.map((row, y) => row.map((spot, x) => html`
    <div
      part="spot spot-${spot} x-${x} y-${y} parity-${y % 2 == x % 2 ? 'light' : 'dark'} ${this.pickedPiece?.moves.has([x, y].toString()) ? 'valid' : ''}"
      x=${x} y=${y}
      @dragover=${this.checkSpotValid}
      @dragend=${this.letGoPiece}
      @drop=${this.dropPiece}
      style=${styleMap({
        gridRow: `${y + 1}`,
        gridColumn: `${x + 1}`,
      })}>
      ${this.symbol(spot) // we have something to display
      ? html`
        <span
          part="symbol"
          draggable=${this.canMove([x, y]).toString() as 'true' | 'false'}
          x=${x}
          y=${y}
          @dragstart=${this.pickupPiece}
        >${this.symbol(spot)}</span>`
      : ''}
    </div>`))}
  `
}
