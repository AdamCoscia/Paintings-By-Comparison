import * as d3 from "d3";
import { HEIGHT, WIDTH } from "../models/constants";
import { aggregateWords } from "../models/util";

/**
 * DepictsView object
 */
export class DepictsView {
  /**
   * Takes in SVG d3 object and all data
   */
  constructor(svg, allData) {
    this.allData = allData;
    this.viewWidth = WIDTH / 4;
    this.viewHeight = HEIGHT / 3;
    this.wordColors = {};
    this.depictsTooltip = d3.select("body").append("div");
    this.depictsG = svg
      .append("g")
      .classed("depicts", true)
      .attr("transform", `translate(0, ${(2 * HEIGHT) / 3})`);
  }

  /**
   * Takes in filtered data object
   */
  initialize(data) {
    // Get all words and add special root string
    let allWords = aggregateWords(data, "depicts").map((d) => d.word);
    allWords.push("SPECIAL_ROOT_STRING");

    // Map colors to all of the words
    for (const word of allWords) {
      if (!this.wordColors[word]) {
        this.wordColors[word] = d3.interpolateRainbow(Math.random());
      }
    }

    // draw the treemap
    this.update(data);
  }

  /**
   * Takes in filtered data object
   */
  update(data) {
    // Get word counts plus special 0 count root string
    let wordCounts = aggregateWords(data, "depicts");
    wordCounts.push({ word: "SPECIAL_ROOT_STRING", val: 0 });

    const root = d3
      .stratify()
      .id((d) => d.word)
      .parentId((d) =>
        d.word == "SPECIAL_ROOT_STRING" ? null : "SPECIAL_ROOT_STRING"
      )(wordCounts);

    root.sum((d) => d.val).sort((a, b) => b.value - a.value);

    const treemap = d3.treemap().size([this.viewWidth, this.viewHeight]);
    const tm = treemap(root);
    const self = this;

    const individualG = this.depictsG
      .selectAll(".depictsIndG")
      .data(tm)
      .join("g")
      .classed("depictsIndG", true)
      .attr("transform", (d) => `translate(${d.x0}, ${d.y0})`);

    individualG
      .on("mouseenter", function (_, d) {
        self.depictsTooltip.text(d.data.word);
      })
      .on("mousemove", function (e) {
        self.depictsTooltip.attr(
          "style",
          `position: absolute; top: ${e.clientY + 10}px; left: ${
            e.clientX
          }px; background-color: #fff;`
        );
      })
      .on("mouseleave", function () {
        self.depictsTooltip.attr("style", "visibility: hidden;");
      });

    individualG
      .selectAll("rect")
      .data((d) => d)
      .join("rect")
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("stroke", "black")
      .attr("fill", (d) => self.wordColors[d.data.word]);

    individualG
      .selectAll("text")
      .data((d) => d)
      .join("text")
      .attr("text-anchor", "middle")
      .text((d) => {
        if (d.x1 - d.x0 > 20) {
          return d.data.word.slice(0, (d.x1 - d.x0) / 5);
        }
        return null;
      })
      .attr("x", (d) => (d.x1 - d.x0) / 2)
      .attr("y", (d) => (d.y1 - d.y0) / 2)
      .attr("font-size", 8)
      .attr("font-weight", "bold")
      .attr("fill", "#FFF");
    // .attr('stroke', '#000')
  }
}
