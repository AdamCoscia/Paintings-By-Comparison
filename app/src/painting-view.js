import * as d3 from "d3";
import { HEIGHT, WIDTH } from "./constants";

/**
 * PaintingView object
 */
export class PaintingView {
  /**
   * Takes in SVG object and data object
   */
  constructor(svg, allData) {
    this.svg = svg;
    this.allData = allData;
    this.viewWidth = WIDTH / 4;
    this.viewHeight = HEIGHT;

    // Create painting group
    this.paintingG = svg
      .append("g")
      .classed("painting", true)
      .attr("transform", `translate(${3 * this.viewWidth}, 0)`);
  }

  /**
   * Takes in data
   */
  initialize(data) {
    const self = this;
    const painting = data[0];

    // Painting title
    const title = painting.artworkLabel;
    const titleX = this.viewWidth / 2;
    const titleY = this.viewHeight / 8;
    this.paintingG
      .append("text")
      .attr("class", "title")
      .attr("text-anchor", "middle")
      .attr("transform", `translate(${titleX}, ${titleY})`)
      .text(title);

    // Collect image data
    const image = painting.image;
    const imageX = this.viewWidth / 4;
    const imageY = this.viewHeight / 6;
    const imageWidth = this.viewWidth / 2;
    const imageHeight = (imageWidth / painting.width) * painting.height;
    this.paintingG
      .append("svg:image")
      .attr("href", image)
      .attr("x", imageX)
      .attr("y", imageY)
      .attr("width", imageWidth)
      .attr("height", imageHeight);

    // Painting details
    const country = painting.creatorCountry;
    const countryX = this.viewWidth / 2;
    const countryY = imageY + imageHeight + 30;
    this.paintingG
      .append("text")
      .attr("class", "country")
      .attr("text-anchor", "middle")
      .attr("transform", `translate(${countryX}, ${countryY})`)
      .text(country);

    self.update(data);
  }

  /**
   * Updates the data
   */
  update(data) {
    const skip = null;
  }
}
