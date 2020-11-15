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
    this.padding = {
      bottom: this.viewHeight / 10 + 10,
      top: this.viewHeight / 10 + 10,
      left: this.viewWidth / 10 + 10,
    };
    this.mainViewWidth = this.viewWidth - this.padding.left;
    this.mainViewHeight =
      this.viewHeight - this.padding.bottom - this.padding.top;

    this.timeG = svg
      .append("g")
      .classed("time", true)
      .attr("transform", `translate(0, ${this.viewHeight})`);

    this.xScale = d3
      .scaleLinear()
      .domain(d3.extent(allData, (d) => d.year))
      .range([0, this.mainViewWidth]);

    this.bins = d3
      .bin()
      .value((d) => d.year)
      .domain(this.xScale.domain())
      .thresholds(this.xScale.ticks(20))(allData); // Bin the data

    this.yScale = d3
      .scaleLinear()
      .domain([0, d3.max(this.bins.map((x) => x.length))])
      .range([0, this.mainViewHeight]);
  }

  /**
   * Takes in data and filter function
   */
  initialize(data, onFilter) {
    const self = this;
    self.filterBounds = null;

    // Add X axis
    this.timeG
      .append("g")
      .attr("class", "x-axis")
      .attr(
        "transform",
        `translate(
          ${self.padding.left}, ${self.mainViewHeight + self.padding.top + 10}
         )`
      )
      .call(d3.axisBottom(this.xScale).tickFormat(d3.format("d")).tickSize(5));

    // Add X axis label
    this.timeG
      .append("text")
      .attr("class", "axis-label")
      .attr("text-anchor", "end")
      .attr("x", self.padding.left - 5)
      .attr("y", this.mainViewHeight + self.padding.top * 1.7)
      .text("Year");

    // remove every other x axis tick label
    var ticks = d3.select(".x-axis").selectAll(".tick text");
    ticks.each(function (_, i) {
      if (i % 2 !== 0) d3.select(this).remove();
    });

    const graphedYScale = d3
      .scaleLinear()
      .domain([0, d3.max(this.bins.map((x) => x.length))])
      .range([this.mainViewHeight, 0]);

    // Add Y axis
    this.timeG
      .append("g")
      .attr("class", "y-axis")
      .attr(
        "transform",
        `translate(${self.padding.left - 10}, ${self.padding.top})`
      )
      .call(d3.axisLeft(graphedYScale).tickSize(5));

    // Add Y axis label
    this.timeG
      .append("text")
      .attr("class", "axis-label")
      .attr("text-anchor", "end")
      // .attr("x", this.mainViewWidth / 2 + self.padding.left)
      // .attr("y", this.viewHeight - 5)
      .attr("x", self.padding.left - 10)
      .attr("y", self.padding.top - 8)
      .text("Total");

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

    // create the brush
    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [this.mainViewWidth, this.mainViewHeight],
      ])
      .on("start brush end", onBrush);

    // add the brush to the svg
    this.svg
      .append("g")
      .classed("brush", true)
      .call(brush)
      .attr(
        "transform",
        `translate(${self.padding.left}, ${this.viewHeight + self.padding.top})`
      );

    this.histG = this.timeG
      .append("g")
      .classed("histogram", true)
      .attr(
        "transform",
        `translate(${self.padding.left}, ${self.padding.top})`
      );

    self.update(data);
  }

  /**
   * Updates the view using filtered data
   */
  update(data) {
    const x = (d) => this.xScale(d.x0);
    const maxHeight = this.yScale.range()[1];
    const binHeight = (d) => this.yScale(d.length);
    const y = (d) => maxHeight - binHeight(d);
    const width = (d) => this.xScale(d.x1) - this.xScale(d.x0);
    const bins = d3
      .bin()
      .value((d) => d.year)
      .domain(this.xScale.domain())
      .thresholds(this.xScale.ticks(20))(data);

    this.histG
      .selectAll("rect")
      .data(bins)
      .join("rect")
      .transition()
      .attr("x", x)
      .attr("y", y)
      .attr("height", binHeight)
      .attr("width", width)
      .duration(1000)
      .attr("fill", d3.interpolateBlues(0.5))
      .attr("stroke", "black");

    this.histG
      .selectAll("text")
      .data(bins)
      .join("text")
      .attr("class", "bar-label")
      .attr("text-anchor", "middle")
      .transition()
      .attr("x", (d) => x(d) + width(d) / 2)
      .attr("y", (d) => y(d) - 5)
      .duration(1000)
      .text((d) => (d.length == 0 ? "" : d.length.toString()));
  }
}
