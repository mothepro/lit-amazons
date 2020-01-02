import { customElement, LitElement, property, html, css } from 'lit-element'
import { styleMap } from 'lit-html/directives/style-map.js'
import Engine, { Board } from '@mothepro/amazons-engine'
import './src/Spot.js'

@customElement('lit-amazons')
export default class extends LitElement {
  private engine = new Engine

  @property({ type: Array })
  board?: Board

  static readonly styles = css`
  :host {
    display: grid;
  }
  `

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
    ${this.engine.board.map((row, y) => row.map((spot, x) => html`
      <amazons-spot
        part="spot x-${x} y-${y} ${y % 2 == x % 2 ? 'light' : 'dark'}"
        x=${x}
        y=${y}
        state=${spot}
        style=${styleMap({ gridRow: `${y + 1}`, gridColumn: `${x + 1}` })}
        .valid-moves=${this.engine.pieces.has([x, y].toString())
          ? this.engine.pieces.get([x, y].toString())!.moves
          : undefined}
      ></amazons-spot>`))}
  `
}
