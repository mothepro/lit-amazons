import { customElement, LitElement, html, property, css } from 'lit-element'
import { Spot } from '@mothepro/amazons-engine'

@customElement('amazons-spot')
export default class extends LitElement {

  @property({ type: Number })
  state!: Spot

  get symbol() {
    switch (this.state) {
      case Spot.BLACK:
        return '♛'
      case Spot.WHITE:
        return '♕'
    }
    return ''
  }

  protected readonly render = () => html`
  ${this.symbol}
  `
}
