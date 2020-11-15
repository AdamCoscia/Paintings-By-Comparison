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
    this.filter = null; // filter function
    this.attrToFilter = "locLabel"; // attribute to filter on
    this.groupsToFilter = []; // attributes to filter
    this.colorGroup = null; // color scale for groups
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
   * Groups the data for packing and plotting and sets the color scheme
   */
  groupByAttr(data) {
    return d3.group(
      Array.from({ length: data.length }, (_, i) => ({
        id: i,
        group: data[i][this.attrToFilter],
        value: Math.floor(Math.random() * 2) + 1,
      })),
      (d) => d.group
    );
  }

  /**
   * Dynamic Clustered Bubbles in d3
   * Modified from the source.
   * Source: https://observablehq.com/@mbostock/clustered-bubbles
   */
  drawClusters(grouped, keys) {
    const self = this;

    const hierarchy = d3.hierarchy({
        children: Array.from(grouped, ([, children]) => ({ children })),
      }),
      pack = () =>
        d3
          .pack()
          .size([this.viewWidth, (3 * this.viewHeight) / 4])
          .padding(1)(hierarchy.sum((d) => d.value)),
      root = pack();

    const step = this.viewHeight / 4 / keys.length;
    let legend = (svg) => {
      const g = svg
        .attr("transform", `translate(${this.viewWidth},0)`)
        .attr("text-anchor", "end")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .selectAll("g")
        .data(
          keys.sort(function (a, b) {
            return grouped.get(b).length - grouped.get(a).length;
          })
        )
        .join("g")
        .attr("transform", (_, i) => `translate(0,${i * step + 2})`);
      g.append("rect")
        .attr("x", -15) // constant x
        .attr("width", 15) // constant width
        .attr("height", step - 4) // fill 1/4 * 1/nkeys of the viewHeight
        .attr("fill", (d) => self.colorGroup(d));
      g.append("text")
        .attr("class", "legend-text")
        .attr("x", -20) // constant x separation
        .attr("y", step / 2) // variable y
        .attr("dy", "0.15em")
        .text((d) => `${d} (${grouped.get(d).length})`);
    };

    // clear navigation and draw legend
    this.navG.selectAll("*").transition().style("opacity", 0).duration(50).remove();
    this.navG.append("g").call(legend).transition().style("opacity", 1).duration(50);

    // clear bubbles and draw new groups
    this.bubblesG.selectAll("*").remove();

    // Create groups for each bubble group
    const bubbleGroups = this.bubblesG
      .selectAll("g")
      .data(root.descendants().filter((d) => d.height === 1))
      .join("g")
      .attr("class", "bubble-group")
      .attr("fill", (d) =>
        // if switched on, darken the inside, otherwise lighten it again
        self.groupsToFilter.includes(d.leaves()[0].data.group)
          ? "#ccc"
          : "white"
      )
      .on("click", function (_, d) {
        const group = d.leaves()[0].data.group;
        self.toggle(group);
        // if switched on, darken the inside, otherwise lighten it again
        d3.select(this).attr(
          "fill",
          self.groupsToFilter.includes(group) ? "#ccc" : "white"
        );
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
      .attr("fill", (d) => self.colorGroup(d.data.group))
      .attr("opacity", 0.8);
  }

  /**
   * Takes in filtered data and filter function
   */
  initialize(data, onGroup) {
    this.filter = onGroup;
    const grouped = this.groupByAttr(data),
      keys = Array.from(grouped.keys());
    this.colorGroup = d3.scaleOrdinal(keys, d3.schemeCategory10);
    this.drawClusters(grouped, keys);
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
        const grouped = this.groupByAttr(data),
          keys = Array.from(grouped.keys());
        this.drawClusters(grouped, keys);
      }
      // make the display info visible again (if it wasn't before)
      this.clusterG.attr("display", "block");
    }
  }
}
