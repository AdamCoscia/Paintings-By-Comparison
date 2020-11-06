import * as d3 from "d3";
import { HEIGHT, WIDTH } from "../models/constants";

/**
 * ClusterView object
 */
export class ClusterView {
  /**
   * Takes in SVG object and data object
   */
  constructor(svg, allData) {
    this.svg = svg;
    this.viewWidth = WIDTH / 2;
    this.viewHeight = HEIGHT;

    // Create painting group
    this.clusterG = svg
      .append("g")
      .classed("cluster", true)
      .attr("transform", `translate(${WIDTH / 4}, 0)`);

    // Draw the border around the whole group
    this.clusterG
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", this.viewWidth)
      .attr("height", this.viewHeight)
      .attr("fill", "none")
      .attr("stroke", "black");
  }

  /**
   * Takes in filtered data and filter function
   */
  initialize(data, onFilter) {
    const self = this;

    // TODO

    self.update(data);
  }

  /**
   * Updates the view with filtered data
   */
  update(data) {
    // TODO
    return null;
  }
}

/**
 * Checks if given string is blank, null or undefined
 */
function isBlank(str) {
  return !str || /^\s*$/.test(str);
}
