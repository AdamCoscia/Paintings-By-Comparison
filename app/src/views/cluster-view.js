import * as d3 from "d3";
import { HEIGHT, WIDTH } from "../models/constants";
import { arraysEqual } from "../models/util";

/**
 * ClusterView object
 */
export class ClusterView {
  /**
   * Takes in SVG object and data object
   */
  constructor(svg, allData) {
    this.currentData = allData;
    this.npaintings = allData.length;
    this.viewWidth = WIDTH / 2;
    this.viewHeight = HEIGHT;
    this.clusterG = svg
      .append("g")
      .classed("cluster", true)
      .attr("display", "block")
      .attr("transform", `translate(${WIDTH / 4}, 0)`);
  }

  /**
   * Dynamic Clustered Bubbles in d3
   * Modified from the source.
   * Source: https://observablehq.com/@mbostock/clustered-bubbles
   */
  drawClusters(data) {
    // Group the data
    const groups = d3.group(
      Array.from({ length: data.length }, (_, i) => ({
        group: data[i]["locLabel"],
        value: -Math.log(Math.random()),
      })),
      (d) => d.group
    );

    // Create an ordinal color scale from the group keys
    const color = d3.scaleOrdinal(
      Array.from(groups.keys()),
      d3.schemeCategory10
    );

    // Create hierarchy for circle packing
    const hierarchy = d3.hierarchy({
      children: Array.from(groups, ([, children]) => ({ children })),
    });

    // Pack the data
    const pack = () =>
      d3.pack().size([this.viewWidth, this.viewHeight]).padding(1)(
        hierarchy.sum((d) => d.value)
      );

    const root = pack();

    // clear the view in prep for new painting info
    this.clusterG.selectAll("*").remove();

    // Put circle around the groups
    this.clusterG
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .selectAll("circle")
      .data(root.descendants().filter((d) => d.height === 1))
      .join("circle")
      .attr("id", "cluster")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", (d) => d.r);

    // Draw circles within each group
    this.clusterG
      .append("g")
      .selectAll("circle")
      .data(root.leaves())
      .join("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", (d) => d.r)
      .attr("fill", (d) => color(d.data.group));
  }

  /**
   * Takes in filtered data and filter function
   */
  initialize(data, onFilter) {
    this.drawClusters(data);
  }

  /**
   * Updates the view with filtered data
   */
  update(data) {
    if (data.length <= 0) {
      // hide the cluster group
      this.clusterG.attr("display", "none");
    } else {
      if (!arraysEqual(data, this.currentData)) {
        // Update data set and draw new clusters
        this.currentData = data;
        this.npaintings = data.length;
        this.drawClusters(data);
      }
      // make the display info visible again (if it wasn't before)
      this.clusterG.attr("display", "block");
    }
  }
}
