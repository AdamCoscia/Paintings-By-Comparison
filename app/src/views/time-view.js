import * as d3 from "d3";
import { HEIGHT, WIDTH } from "../models/constants";

/**
 * TimeView object
 */
export class TimeView {
  /**
   * Takes in SVG object and data object
   */
  constructor(svg, allData) {
    this.svg = svg;
    this.allData = allData;
    this.viewWidth = WIDTH / 4;
    this.viewHeight = HEIGHT / 3;

    // Add the time view group
    this.timeG = svg
      .append("g")
      .classed("time", true)
      .attr("transform", `translate(0, ${this.viewHeight})`);

    // Create the x axis scale
    this.xScale = d3
      .scaleLinear()
      .domain(d3.extent(allData, (d) => d.year))
      .range([0, this.viewWidth]);

    // Bin the data
    const bins = d3
      .bin()
      .value((d) => d.year)
      .domain(this.xScale.domain())
      .thresholds(this.xScale.ticks(20))(allData);

    // create the y axis scale based on the binning strategy
    this.yScale = d3
      .scaleLinear()
      .domain([0, d3.max(bins.map((x) => x.length))])
      .range([0, this.viewHeight]);
  }

  /**
   * Takes in data and filter function
   */
  initialize(data, onFilter) {
    const self = this;
    self.filterBounds = null;

    // create the brushing function
    function onBrush(e) {
      switch (e.type) {
        case "start":
        case "brush":
          const [x1, x2] = e.selection;
          const bounds = [self.xScale.invert(x1), self.xScale.invert(x2)];
          self.filterBounds = bounds;
          onFilter(
            (d) =>
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

    // add the brush to the svg
    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [this.viewWidth, this.viewHeight],
      ])
      .on("start brush end", onBrush);
    this.svg
      .append("g")
      .classed("brush", true)
      .call(brush)
      .attr("transform", `translate(0, ${this.viewHeight})`);

    self.update(data);
  }

  /**
   * Updates the data
   */
  update(data) {
    const bins = d3
      .bin()
      .value((d) => d.year)
      .domain(this.xScale.domain())
      .thresholds(this.xScale.ticks(20))(data);
    const x = (d) => this.xScale(d.x0);
    const maxHeight = this.yScale.range()[1];
    const binHeight = (d) => this.yScale(d.length);
    const y = (d) => maxHeight - binHeight(d);
    const width = (d) => this.xScale(d.x1) - this.xScale(d.x0);

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
