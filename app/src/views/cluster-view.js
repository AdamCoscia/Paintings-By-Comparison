import * as d3 from "d3";
import { HEIGHT, WIDTH, scheme26 } from "../models/constants";
import { arraysEqual, aggregateWords, wrap } from "../models/util";

class Switcher {
  constructor(clusterView, initAttr, attrMap) {
    this.clusterView = clusterView;
    this.activeAttr = initAttr;
    this.attrMap = attrMap;
    this.toggleButtonG = clusterView.navG
      .append("g")
      .classed("cluster-nav-buttons", true);
  }

  setActiveAttr(attr) {
    this.activeAttr = attr;
    this.refresh();
  }

  refresh() {
    this.clusterView.attrToFilter = this.activeAttr;
    this.clusterView.reInitialize();
  }

  render() {
    const self = this;
    const BUTTON_WIDTH = self.clusterView.viewWidth / 8 - 10;
    const BUTTON_HEIGHT = self.clusterView.viewHeight / 16 - 10;
    const buttonRectX = (_, i) => i * BUTTON_WIDTH + (i + 1) * 10;

    const toggleButtons = this.toggleButtonG
      .selectAll(".toggle-buttons")
      .data(Object.keys(this.attrMap))
      .join("g")
      .classed("toggle-buttons", true)
      .attr("id", (d) => `${self.attrMap[d]}_button`)
      .attr("transform", (_, i) => `translate(${buttonRectX(_, i)}, 0)`)
      .on("click", function (_, d) {
        if (self.activeAttr !== d) {
          // only update if the incoming click is not the active attr filter
          d3.select(this).select("rect").attr("fill", "steelblue");
          d3.select(`#${self.attrMap[self.activeAttr]}_button`)
            .select("rect")
            .attr("fill", "#ccc");
          self.setActiveAttr(d);
        }
      });

    toggleButtons
      .append("rect")
      .attr("width", BUTTON_WIDTH)
      .attr("height", BUTTON_HEIGHT)
      .attr("fill", (d) => (self.activeAttr === d ? "steelblue" : "#ccc"))
      .attr("rx", 10);

    toggleButtons
      .append("text")
      .attr("class", "button-text")
      .attr("y", 1.25 * (BUTTON_HEIGHT / 2))
      .attr("x", BUTTON_WIDTH / 2)
      .attr("text-anchor", "middle")
      .attr("font-weight", "bold")
      .attr("fill", "white")
      .text((d) => self.attrMap[d]);
  }
}

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
    this.groupsToFilter = new Map(); // alias map for attributes to filter
    this.colorGroup = {}; // color mapping for groups
    this.otherKeys = []; // keys contained in "other" group
    this.clusterG = svg
      .append("g")
      .classed("cluster", true)
      .attr("display", "block")
      .attr("transform", `translate(${WIDTH / 4}, 0)`);
    this.navG = this.clusterG.append("g").classed("cluster-nav", true);
    this.filterByG = this.navG
      .append("g")
      .classed("cluster-filterBy", true)
      .attr("transform", `translate(0, ${(1.4 * this.viewHeight) / 16})`);
    this.bubblesG = this.clusterG
      .append("g")
      .classed("bubbles", true)
      .attr("transform", `translate(0, ${HEIGHT / 4})`);
  }

  /**
   * Updates groups filtered alias map for onGroup filter
   */
  toggle(group, other) {
    if (other) {
      // We are toggling the "other" group
      if (this.groupsToFilter.get("others") === undefined) {
        // "other" not in groupsToFilter, add it and bold legend
        this.groupsToFilter.set("others", this.otherKeys);
        d3.select(`#others`).style("font-weight", "bold");
        this.otherKeys.forEach((key) => {
          d3.select(`#${key.replace(/ /g, "")}`).style("font-weight", "bold");
          this.groupsToFilter.set(key, key);
        });
      } else {
        // "other" already in groupsToFilter, so delete it and unbold text
        this.groupsToFilter.delete("others");
        d3.select(`#others`).style("font-weight", "normal");
        this.otherKeys.forEach((key) => {
          d3.select(`#${key.replace(/ /g, "")}`).style("font-weight", "normal");
          this.groupsToFilter.delete(key);
        });
      }
    } else if (this.groupsToFilter.has(group)) {
      // group exists in alias map so delete it and unbold text
      d3.select(`#${group.replace(/ /g, "")}`).style("font-weight", "normal");
      this.groupsToFilter.delete(group);
    } else {
      // otherwise, add it to the alias map and bold text
      d3.select(`#${group.replace(/ /g, "")}`).style("font-weight", "bold");
      this.groupsToFilter.set(group, group);
    }
  }

  /**
   * Updates onGroup filter when groups are clicked
   */
  updateFilters() {
    if (this.groupsToFilter.size == 0) {
      // Set the filterBy title and text and filter function
      d3.select(".filterBy-title").text("Currently filtering by (0):");
      d3.select(".filterBy-text").text("No filters applied.");
      this.filter(null);
    } else {
      let groups = Array.from(this.groupsToFilter.keys());

      // If >25 groups, cut off the text
      const ngroups = groups.length,
        text =
          ngroups > 25
            ? `${groups.slice(0, 25).join(" | ")} ...`
            : groups.join(" | ");

      // Update filterBy title and text
      d3.select(".filterBy-title").text(`Currently filtering by (${ngroups}):`);
      d3.select(".filterBy-text")
        .text(text)
        .call(wrap, this.viewWidth / 2);

      // Set the filter function
      this.filter((d) => {
        // take the intersection of groups and d[this.attrToFilter]
        return (
          groups.filter((value) => d[this.attrToFilter].includes(value))
            .length > 0
        );
      });
    }
  }

  /**
   * Groups the data for packing and plotting and sets the color scheme
   */
  groupByAttr(data) {
    // each painting creates map for each word in their attribute list
    let paintings = [];
    data.forEach((row, i) =>
      row[this.attrToFilter].forEach((word) =>
        paintings.push({
          id: i,
          group: word,
          other: false,
          value: Math.floor(Math.random() * 2) + 1,
        })
      )
    );

    // Group the paintings by the group value of each entry
    let groupMap = d3.group(paintings, (d) => d.group),
      others = [],
      otherKeys = [];

    // Try to reduce the number of groups
    groupMap.forEach((value, key) => {
      if (value.length <= data.length / 20) {
        // set 'other' in each value to true
        const otherValues = value.map((x) => {
          x.other = true;
          return x;
        });
        others.push(...otherValues);
        otherKeys.push(key); // keys to remove from mapping
      }
    });

    // Store the otherKeys in the class attr
    this.otherKeys = otherKeys;

    // If <20 value groups were found, create an "other" mapping and remove
    // keys that go into the "other" group
    if (others.length > 0) {
      groupMap.set("others", others);
      otherKeys.forEach((key) => groupMap.delete(key));
    }

    return groupMap;
  }

  /**
   * Dynamic Clustered Bubbles in d3
   * Modified from the source.
   * Source: https://observablehq.com/@mbostock/clustered-bubbles
   */
  drawClusters(grouped, keys) {
    const self = this,
      step = this.viewHeight / 4 / keys.length,
      hierarchy = d3.hierarchy({
        children: Array.from(grouped, ([, children]) => ({ children })),
      }),
      pack = () =>
        d3
          .pack()
          .size([this.viewWidth, (3 * this.viewHeight) / 4])
          .padding(1)(hierarchy.sum((d) => d.value)),
      root = pack();

    // Create legend function
    let legend = (container) => {
      const g = container
        .attr("transform", `translate(${this.viewWidth},0)`)
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(
          // sort legend by size of group!
          keys.sort(function (a, b) {
            return grouped.get(b).length - grouped.get(a).length;
          })
        )
        .join("g")
        .attr("id", (d) => d.replace(/ /g, ""))
        .attr("transform", (_, i) => `translate(0,${i * step + 2})`)
        .style("font-weight", (d) => {
          return self.groupsToFilter.get(d) !== undefined ? "bold" : "normal";
        });
      g.append("rect")
        .attr("x", -15) // constant x
        .attr("width", 15) // constant width
        .attr("height", step - 4) // fill 1/4 * 1/nkeys of the viewHeight
        .attr("fill", (d) => self.colorGroup[d]);
      g.append("text")
        .attr("class", "legend-text")
        .attr("x", -20) // constant x separation
        .attr("y", step / 2) // variable y
        .attr("dy", "0.15em")
        .text((d) => `${d} (${grouped.get(d).length})`);
    };

    // re-draw legend
    this.navG
      .selectAll(".cluster-legend")
      .transition()
      .style("opacity", 0)
      .duration(50)
      .remove();
    this.navG
      .append("g")
      .classed("cluster-legend", true)
      .call(legend)
      .transition()
      .style("opacity", 1)
      .duration(50);

    // clear bubbles and draw new groups
    this.bubblesG.selectAll("*").remove();

    // Create groups for each bubble group
    const bubbleGroups = this.bubblesG
      .selectAll("g")
      .data(root.descendants().filter((d) => d.height === 1))
      .join("g")
      .attr("class", "bubble-group")
      .attr("fill", function (d) {
        // if switched on, darken the inside, otherwise lighten it again
        const leaf = d.leaves()[0].data,
          other = leaf.other;
        let group = leaf.group;
        if (other) group = "others"; // color entire "group" bubble
        return self.groupsToFilter.get(group) !== undefined ? "#ccc" : "white";
      })
      .on("click", function (_, d) {
        const leaf = d.leaves()[0].data,
          other = leaf.other;
        let group = leaf.group;
        // toggle the group
        self.toggle(group, other);
        // if switched on, darken the inside, otherwise lighten it again
        if (other) group = "others";
        d3.select(this).attr("fill", () =>
          self.groupsToFilter.get(group) !== undefined ? "#ccc" : "white"
        );
        // update the filters
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
      .attr("fill", (d) => self.colorGroup[d.data.group])
      .attr("opacity", 0.8);
  }

  /**
   * Sets the cluster view to starting point
   */
  reInitialize() {
    // Set new group filter map and update filter function
    this.groupsToFilter = new Map();
    this.updateFilters();

    // Map colors to all of the group keys
    const words = aggregateWords(this.currentData, this.attrToFilter),
      getColor = d3.scaleOrdinal(scheme26);
    words.forEach((d) => (this.colorGroup[d.word] = getColor(d.word)));
    this.colorGroup["others"] = "#ccc";

    // draw clusters
    const grouped = this.groupByAttr(this.currentData),
      keys = Array.from(grouped.keys());
    this.drawClusters(grouped, keys);
  }

  /**
   * Takes in filtered data and filter function
   */
  initialize(data, onGroup) {
    const self = this;
    this.currentData = data;
    this.filter = onGroup;

    // Create switching functionality for clustering groups
    const switcher = new Switcher(this, "locLabel", {
      locLabel: "Location",
      materialLabel: "Material",
      movement: "Movement",
      genreLabel: "Genre",
    });

    // Add filtering by title
    const titleNode = this.filterByG
      .append("text")
      .attr("class", "filterBy-title")
      .attr("transform", `translate(10, 0)`)
      .text("Currently filtering by (0):");

    // Add reset text that re-initializes view when clicked
    this.filterByG
      .append("text")
      .attr("class", "filterBy-reset")
      .attr("transform", `translate(${this.viewWidth / 2}, 0)`)
      .attr("text-anchor", "end")
      .text("Reset")
      .on("click", () => self.reInitialize());

    // Add filter groups list text (but leave it empty)
    this.filterByG
      .append("text")
      .attr("class", "filterBy-text")
      .attr("transform", `translate(10, ${titleNode.node().getBBox().height})`);

    // Create the switch buttons and initialize drawing clusters
    switcher.render();
    switcher.refresh();
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
