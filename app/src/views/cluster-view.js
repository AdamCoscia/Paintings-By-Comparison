import * as d3 from "d3";
import { HEIGHT, WIDTH } from "../models/constants";
import { groupBy } from "../models/util";

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
    this.clusterG = svg
      .append("g")
      .classed("cluster", true)
      .attr("transform", `translate(${WIDTH / 4}, 0)`);
  }

  /**
   * Dynamic Clustered Bubbles in d3
   * Source: https://observablehq.com/@mbostock/clustered-bubbles
   */
  drawClusters() {
    const n = 740; // number of paintings
    const m = 10; // number of clusters
    const color = d3.scaleOrdinal(d3.range(m), d3.schemeCategory10);
    const sampleData = {
      children: Array.from(
        d3.group(
          Array.from({ length: n }, (_, i) => ({
            group: (Math.random() * m) | 0,
            value: -Math.log(Math.random()),
          })),
          (d) => d.group
        ),
        ([, children]) => ({ children })
      ),
    };

    let pack = () =>
      d3.pack().size([this.viewWidth, this.viewHeight]).padding(1)(
        d3.hierarchy(sampleData).sum((d) => d.value)
      );

    const root = pack();

    // Put circle around the groups
    this.clusterG
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .selectAll("circle")
      .data(root.descendants().filter((d) => d.height === 1))
      .join("circle")
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
    const self = this;

    console.log(groupBy(data, "materialLabel"));

    self.drawClusters();

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
