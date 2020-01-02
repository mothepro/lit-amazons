import { customElement, LitElement, property, html } from 'lit-element'
import Engine, { Board } from '@mothepro/amazons-engine'
import './src/Spot.js'

@customElement('lit-amazons')
export default class extends LitElement {
  private engine = new Engine

  @property({ type: Array })
  board?: Board

  private bindEngine() {
    this.engine.turn.on(detail => this.dispatchEvent(new CustomEvent('turn-started', { detail })))
    this.engine.moved.on(detail => this.dispatchEvent(new CustomEvent('piece-moved', { detail })))
    this.engine.winner.once(detail => this.dispatchEvent(new CustomEvent('game-completed', { detail })))
    this.engine.boardChanged.on(() => this.requestUpdate() && this.dispatchEvent(new CustomEvent('board-changed')))
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

  protected readonly render = () => this.engine && html`
    ${this.engine.board.map((row, y) => html`${row.map((spot, x) => html`
      <amazons-spot
        part="spot x-${x} y-${y} num-${y * 8 /* Max X */ + x} ${(y * 8 /* Max X */ + x) % 2 ? 'odd' : 'even'}"
        state=${spot}
        .valid-moves=${this.engine.pieces.has([x, y].toString())
          ? this.engine.pieces.get([x, y].toString())!.moves
          : undefined}
      ></amazons-spot>`)}
    <br/>`)}
  `
}
