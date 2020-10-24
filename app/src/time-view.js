import * as d3 from "d3";
import { HEIGHT, WIDTH } from "./constants";

export class TimeView {
  constructor(svg, allData) {
    this.timeG = svg
      .append("g")
      .classed("time", true)
      .attr("transform", `translate(0, ${HEIGHT / 3})`);

    this.svg = svg;
    this.allData = allData;

    this.xScale = d3
      .scaleLinear()
      .domain(d3.extent(allData, d => d.year))
      .range([0, WIDTH / 3]);

    const bins = d3
      .bin()
      .value(d => d.year)
      .domain(this.xScale.domain())
      .thresholds(this.xScale.ticks(20))(allData);


    this.yScale = d3
      .scaleLinear()
      .domain([0, d3.max(bins.map(x => x.length))])
      .range([0, HEIGHT / 3]);
  }

  initialize(data, onFilter) {
    const self = this;

    self.filterBounds = null;

    function onBrush(e) {
      switch (e.type) {
        case "start":
        case "brush":
          const [x1, x2] = e.selection;
          const bounds = [self.xScale.invert(x1), self.xScale.invert(x2)];
          self.filterBounds = bounds;

          onFilter(
            d =>
              d.year >= self.filterBounds[0] && d.year <= self.filterBounds[1]
          );

          break;
        case "end":
          if (e.selection == null) {
            self.filterBounds = null;
            onFilter(null);
          }
          break;
      }
    }

    const brush = d3
      .brushX()
      .extent([[0, 0], [WIDTH / 3, HEIGHT / 3]])
      .on("start brush end", onBrush);

    this.svg
      .append("g")
      .classed("brush", true)
      .call(brush)
      .attr("transform", `translate(0, ${HEIGHT / 3})`);

    self.update(data);
  }

  update(data) {
    const bins = d3
      .bin()
      .value(d => d.year)
      .domain(this.xScale.domain())
      .thresholds(this.xScale.ticks(20))(data);

    const x = d => this.xScale(d.x0);

    const maxHeight = this.yScale.range()[1];

    const binHeight = d => this.yScale(d.length);

    const y = d => maxHeight - binHeight(d);

    const width = d => this.xScale(d.x1) - this.xScale(d.x0);

    this.timeG
      .selectAll("rect")
      .data(bins)
      .join("rect")
      .attr("x", x)
      .attr("y", y)
      .attr("height", binHeight)
      .attr("width", width)
      .attr("fill", d3.interpolateBlues(0.5))
      .attr("stroke", "black");
  }
}
