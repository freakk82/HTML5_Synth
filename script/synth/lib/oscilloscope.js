export class Oscilloscope {

  constructor(context, elementId, refreshRate = 100, outNode) {
    const elem = document.getElementById(elementId);
    const svgNamespace = "http://www.w3.org/2000/svg";

    this.analyser = context.createAnalyser();
    this.analyser.connect(outNode || context.destination);
    this.analyser.width = elem.offsetWidth;
    this.analyser.height = elem.offsetHeight;
    this.analyser.lineColor = 'white';
    this.analyser.lineThickness = 2;


    this.container = document.createElementNS(svgNamespace, "svg");
    this.container.setAttribute('width', this.analyser.width);
    this.container.setAttribute('height', this.analyser.height);
    this.container.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
    elem.appendChild(this.container);

    this.oscLine = document.createElementNS(svgNamespace, "path");
    this.oscLine.setAttribute("stroke", this.analyser.lineColor);
    this.oscLine.setAttribute("stroke-width", this.analyser.lineThickness);
    this.oscLine.setAttribute("fill", "none");
    this.container.appendChild(this.oscLine);

    this.noDataPoints = 10;
    this.freqData = new Uint8Array(this.analyser.frequencyBinCount);

    this.refreshRate = refreshRate;
    this.drawLine();
  }

  drawLine() {
    this.analyser.getByteTimeDomainData(this.freqData);

    let graphPoints = [];
    let graphStr = '';

    graphPoints.push('M0, ' + (this.analyser.height/2));

    for (let i = 0; i < this.freqData.length; i++) {
      if (i % this.noDataPoints) {
        const point = (this.freqData[i] / 128) * (this.analyser.height / 2);
        graphPoints.push('L' + i + ', ' + point);
      }
    }

    for (let i = 0; i < graphPoints.length; i++) {
      graphStr += graphPoints[i];
    }

    this.oscLine.setAttribute("stroke", this.analyser.lineColor);
    this.oscLine.setAttribute("stroke-width", this.analyser.lineThickness);
    this.oscLine.setAttribute("d", graphStr);

    setTimeout(this.drawLine.bind(this), this.refreshRate || 100);
  }

}
