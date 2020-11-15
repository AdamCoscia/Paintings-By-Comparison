import * as d3 from "d3";
import { HEIGHT, WIDTH, scheme26 } from "../models/constants";
import { arraysEqual, aggregateWords } from "../models/util";

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
    this.attrToFilter = "materialLabel"; // attribute to filter on
    this.groupsToFilter = new Map(); // alias map for attributes to filter
    this.colorGroup = {}; // color mapping for groups
    this.otherKeys = []; // keys contained in "other" group
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
   * Updates groups filtered alias map for onGroup filter
   */
  toggle(group, other) {
    if (other) {
      // We are toggling the "other" group
      if (this.groupsToFilter.get("other") === undefined) {
        // "other" not in groupsToFilter, add it
        this.groupsToFilter.set("other", this.otherKeys);
        this.otherKeys.forEach((key) => this.groupsToFilter.set(key, key));
      } else {
        // "other" already in groupsToFilter, so delete it
        this.groupsToFilter.delete("other");
        this.otherKeys.forEach((key) => this.groupsToFilter.delete(key));
      }
    } else if (this.groupsToFilter.has(group)) {
      // group exists in alias map so delete it
      this.groupsToFilter.delete(group);
    } else {
      // otherwise, add it to the alias map
      this.groupsToFilter.set(group, group);
    }
  }

  /**
   * Updates onGroup filter when groups are clicked
   */
  updateFilters() {
    if (this.groupsToFilter.size == 0) {
      this.filter(null);
    } else {
      this.filter((d) => {
        // take the intersection of groups and d[this.attrToFilter]
        let groups = Array.from(this.groupsToFilter.keys());
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
    let legend = (svg) => {
      const g = svg
        .attr("transform", `translate(${this.viewWidth},0)`)
        .attr("text-anchor", "end")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .selectAll("g")
        .data(
          // sort legend by size of group!
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
        .attr("fill", (d) => self.colorGroup[d]);
      g.append("text")
        .attr("class", "legend-text")
        .attr("x", -20) // constant x separation
        .attr("y", step / 2) // variable y
        .attr("dy", "0.15em")
        .text((d) => `${d} (${grouped.get(d).length})`);
    };

    // clear navigation and draw legend
    this.navG
      .selectAll("*")
      .transition()
      .style("opacity", 0)
      .duration(50)
      .remove();
    this.navG
      .append("g")
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
        if (other) group = "other"; // color entire "group" bubble
        return self.groupsToFilter.get(group) !== undefined ? "#ccc" : "white";
      })
      .on("click", function (_, d) {
        const leaf = d.leaves()[0].data,
          other = leaf.other;
        let group = leaf.group;
        // toggle the group
        self.toggle(group, other);
        // if switched on, darken the inside, otherwise lighten it again
        if (other) group = "other";
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
   * Takes in filtered data and filter function
   */
  initialize(data, onGroup) {
    this.filter = onGroup;

    // Map colors to all of the group keys
    const words = aggregateWords(data, this.attrToFilter),
      getColor = d3.scaleOrdinal(scheme26);
    words.forEach((d) => (this.colorGroup[d.word] = getColor(d.word)));
    this.colorGroup["others"] = "#ccc";

    console.log(words);

    // draw clusters
    const grouped = this.groupByAttr(data),
      keys = Array.from(grouped.keys());
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
