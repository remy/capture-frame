export default class Cycle {
  constructor(el, pad = 1) {
    this.el = el;
    this.pad = pad;
    this.min = parseInt(el.dataset.min, 10);
    this.max = parseInt(el.dataset.max, 10) || Infinity;

    this.elementKey = el.nodeName === 'INPUT' ? 'value' : 'innerHTML';
    this.value = parseInt(el[this.elementKey], 10);

    el.addEventListener('keydown', this.handleKeypress.bind(this), false);
    el.addEventListener(
      'click',
      () => {
        el.select();
      },
      false
    );
    el.addEventListener('input', this.handleKeypress.bind(this), false);
    el.addEventListener('change', this.handleKeypress.bind(this), false);
  }

  handleKeypress(event) {
    const currentValue = parseInt(this.el[this.elementKey], 10);

    if (event.which === 13 || ['input', 'change'].includes(event.type)) {
      this.setValue(currentValue);
    }

    if (event.which === 38) {
      this.up(event.shiftKey);
      return;
    }

    if (event.which === 40) {
      this.down(event.shiftKey);
      return;
    }

    if (
      // event.which === 8 ||
      event.which > 40 &&
      (event.which < 48 || event.which > 57)
    ) {
      event.preventDefault();
    }

    if (event.which >= 48 && event.which <= 57) {
      // let value = currentValue;
      // value = parseInt((event.target.value + event.key).slice(-2), 10);
      // this.setValue(parseInt(event.target.value + event.key));
      // event.preventDefault();
    }
  }

  update(v) {
    this.setValue(parseInt(v));
  }

  setValue(newValue, update = true) {
    if (
      newValue >= this.min &&
      newValue < (isNaN(this.max) ? Infinity : this.max)
    ) {
      this.value = newValue;
      this.el[this.elementKey] = this.value.toString().padStart(this.pad, '0');
      if (this.onUpdate && update) this.onUpdate(this.value);
    }
  }

  down(fast) {
    this.setValue(fast ? this.value - 10 : this.value - 1);
  }

  up(fast) {
    this.setValue(fast ? this.value + 10 : this.value + 1);
  }
}
