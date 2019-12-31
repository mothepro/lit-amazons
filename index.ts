import { customElement, LitElement, property, html } from 'lit-element'
import Engine, { Board, Color } from '@mothepro/amazons-engine'

@customElement('lit-amazons')
export default class extends LitElement {
  private engine!: Engine

  @property({ type: Array })
  private board?: Board

  connectedCallback() {
    this.engine = new Engine(this.board)
    this.engine.turnStarted.on(detail => this.dispatchEvent(new CustomEvent('turn-started', { detail })))
    this.engine.pieceMoved.on(detail => this.dispatchEvent(new CustomEvent('piece-moved', { detail })))
    this.engine.boardChanged.on(() => this.dispatchEvent(new CustomEvent('board-changed')))
    this.engine.turnStarted.activate(Color.BLACK)
  }

  protected readonly render = () => html`
  enginge
    ${this.engine}
    <pre>${JSON.stringify(this.board)}</pre>
    ${JSON.stringify(this.engine)}
  `
}
