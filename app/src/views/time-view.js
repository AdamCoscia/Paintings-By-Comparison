import * as d3 from "d3";
import { HEIGHT, WIDTH } from "../models/constants";

const PADDING_BOTTOM = 40;

const PADDING_LEFT = 40;

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

    this.mainViewWidth = this.viewWidth - PADDING_LEFT;
    this.mainViewHeight = this.viewHeight - PADDING_BOTTOM;

    this.timeG = svg
      .append("g")
      .classed("time", true)
      .attr("transform", `translate(0, ${this.viewHeight})`);

    this.xScale = d3
      .scaleLinear()
      .domain(d3.extent(allData, d => d.year))
      .range([0, this.mainViewWidth]);

    const bins = d3
      .bin()
      .value(d => d.year)
      .domain(this.xScale.domain())
      .thresholds(this.xScale.ticks(20))(allData); // Bin the data

    this.yScale = d3
      .scaleLinear()
      .domain([0, d3.max(bins.map(x => x.length))])
      .range([0, this.mainViewHeight]);


    const graphedYScale = d3
      .scaleLinear()
      .domain([0, d3.max(bins.map(x => x.length))])
      .range([this.mainViewHeight, 0]);

    this.timeG
      .append("g")
      .attr("style", "font-size: 8px;")
      .attr("transform", `translate(${PADDING_LEFT - 10}, 0)`)
      .call(d3.axisLeft(graphedYScale));

  
    this.timeG
      .append("text")
      .attr('text-anchor', 'middle')
      .attr('font-size', 10)
      .attr("x", (this.mainViewWidth / 2) + PADDING_LEFT)
      .attr("y", this.viewHeight - 5)
      .text("Year")


    this.timeG
      .append("g")
      .attr("style", "font-size: 8px;")
      .attr("transform", `translate(${PADDING_LEFT}, ${this.mainViewHeight + 10})`)
      .call(d3.axisBottom(this.xScale));
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

    // create the brush
    const brush = d3
      .brushX()
      .extent([[0, 0], [this.mainViewWidth, this.mainViewHeight]])
      .on("start brush end", onBrush);

    // add the brush to the svg
    this.svg
      .append("g")
      .classed("brush", true)
      .call(brush)
      .attr("transform", `translate(${PADDING_LEFT}, ${this.viewHeight})`);

    this.histG = this.timeG
      .append("g")
      .classed("histogram", true)
      .attr("transform", `translate(${PADDING_LEFT}, 0)`);

    self.update(data);
  }

  /**
   * Updates the view using filtered data
   */
  update(data) {
    const x = d => this.xScale(d.x0);
    const maxHeight = this.yScale.range()[1];
    const binHeight = d => this.yScale(d.length);
    const y = d => maxHeight - binHeight(d);
    const width = d => this.xScale(d.x1) - this.xScale(d.x0);
    const bins = d3
      .bin()
      .value(d => d.year)
      .domain(this.xScale.domain())
      .thresholds(this.xScale.ticks(20))(data);

    this.histG
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
