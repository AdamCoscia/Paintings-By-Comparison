import * as d3 from "d3";
import { HEIGHT, WIDTH } from "../models/constants";
import { arraysEqual} from "../models/util";

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
    this.filter = null; // filter function
    this.attrToFilter = "locLabel"; // attribute to filter on
    this.groupsToFilter = []; // attributes to filter
    this.clusterG = svg
      .append("g")
      .classed("cluster", true)
      .attr("display", "block")
      .attr("transform", `translate(${WIDTH / 4}, 0)`);
    this.navG = this.clusterG.append("g").classed("cluster-nav", true);
    this.bubblesG = this.clusterG
      .append("g")
      .classed("bubbles", true)
      .attr("transform", `translate(0, ${HEIGHT / 4})`);
  }

  /**
   * Updates groups filtered list for onGroup filter
   */
  toggle(group) {
    if (this.groupsToFilter.includes(group)) {
      this.groupsToFilter = this.groupsToFilter.filter((x) => x != group);
    } else {
      this.groupsToFilter.push(group);
    }
  }

  /**
   * Updates onGroup filter when groups are clicked
   */
  updateFilters() {
    if (this.groupsToFilter.length == 0) {
      this.filter(null);
    } else {
      this.filter((d) => {
        let groups = this.groupsToFilter;
        return groups.includes(d[this.attrToFilter]);
      });
    }
  }

  /**
   * Dynamic Clustered Bubbles in d3
   * Modified from the source.
   * Source: https://observablehq.com/@mbostock/clustered-bubbles
   */
  drawClusters(data) {
    const self = this;

    // Group the data
    const groups = d3.group(
      Array.from({ length: data.length }, (_, i) => ({
        id: i,
        group: data[i][this.attrToFilter],
        value: Math.floor(Math.random() * 2) + 1,
      })),
      (d) => d.group
    );

    // Create an ordinal color scale and legend from the group keys
    const keys = Array.from(groups.keys());
    const color = d3.scaleOrdinal(keys, d3.schemeCategory10);
    const step = this.viewHeight / 4 / keys.length;
    let legend = (svg) => {
      const g = svg
        .attr("transform", `translate(${this.viewWidth},0)`)
        .attr("text-anchor", "end")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .selectAll("g")
        .data(
          color.domain().sort(function (a, b) {
            return groups.get(b).length - groups.get(a).length;
          })
        )
        .join("g")
        .attr("transform", (_, i) => `translate(0,${i * step + 2})`);
      g.append("rect")
        .attr("x", -15) // constant x
        .attr("width", 15) // constant width
        .attr("height", step - 4) // fill 1/4 * 1/nkeys of the viewHeight
        .attr("fill", color);
      g.append("text")
        .attr("class", "legend-text")
        .attr("x", -20) // constant x separation
        .attr("y", step / 2) // variable y
        .attr("dy", "0.15em")
        .text((d) => `${d} (${groups.get(d).length})`);
    };

    // Create hierarchy for circle packing
    const hierarchy = d3.hierarchy({
      children: Array.from(groups, ([, children]) => ({ children })),
    });

    // Pack the data
    const pack = () =>
      d3
        .pack()
        .size([this.viewWidth, (3 * this.viewHeight) / 4])
        .padding(1)(hierarchy.sum((d) => d.value));

    const root = pack();

    // clear the view in prep for new drawing
    this.navG.selectAll("*").remove();
    this.bubblesG.selectAll("*").remove();

    // Draw the legend
    this.navG.append("g").call(legend);

    // Create groups for each bubble group
    const bubbleGroups = this.bubblesG
      .selectAll("g")
      .data(root.descendants().filter((d) => d.height === 1))
      .join("g")
      .attr("class", "bubble-group")
      .attr("fill", (d) =>
        self.groupsToFilter.includes(d.leaves()[0].data.group)
          ? "#ccc"
          : "white"
      )
      .on("click", function (_, d) {
        const group = d.leaves()[0].data.group;
        self.toggle(group);
        // if switched on, darken the inside, otherwise lighten it again
        const color = self.groupsToFilter.includes(group) ? "#ccc" : "white";
        d3.select(this).attr("fill", color);
        self.updateFilters();
      });

    // Add outline to each group
    bubbleGroups
      .append("circle")
      .attr("class", "group-outline")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", (d) => d.r);

    // Draw circles within each group
    bubbleGroups
      .selectAll(null)
      .data((d) => d.leaves())
      .enter()
      .append("circle")
      .attr("class", "bubble")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", (d) => d.r)
      .attr("fill", (d) => color(d.data.group))
      .attr("opacity", 0.8);
  }

  /**
   * Takes in filtered data and filter function
   */
  initialize(data, onGroup) {
    this.filter = onGroup;
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
