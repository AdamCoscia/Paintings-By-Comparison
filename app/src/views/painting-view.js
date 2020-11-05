import * as d3 from "d3";
import { HEIGHT, WIDTH } from "../models/constants";

/**
 * PaintingView object
 */
export class PaintingView {
  /**
   * Takes in SVG object and data object
   */
  constructor(svg, allData) {
    this.svg = svg;
    this.currentData = allData; // keep track of the current data set specific to the class
    this.paintingNumber = 0; // where in the dataset to look for a painting
    this.viewWidth = WIDTH / 4;
    this.viewHeight = HEIGHT;

    // Create painting group
    this.paintingG = svg
      .append("g")
      .classed("painting", true)
      .attr("transform", `translate(${3 * this.viewWidth}, 0)`);

    // Draw the border around the whole group
    this.paintingG
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", this.viewWidth)
      .attr("height", this.viewHeight)
      .attr("fill", "none")
      .attr("stroke", "black");

    // Create arrow group
    this.arrowG = this.paintingG.append("g").classed("arrows", true);

    // Create display info group
    this.displayG = this.paintingG
      .append("g")
      .classed("display-info", true)
      .attr("transform", `translate(0, ${this.viewHeight / 8})`);
  }

  /**
   * Takes in filtered data
   */
  initialize() {
    const self = this;
    const arrowWidth = self.viewHeight / 16;
    const arrowHeight = self.viewHeight / 16;

    // add painting counter text in the middle of the group
    const shift = [self.viewWidth / 2, self.viewHeight / 16];
    this.arrowG
      .append("text")
      .attr("class", "counter")
      .attr("transform", `translate(${shift[0]}, ${shift[1]})`)
      .attr("text-anchor", "middle")
      .text(`${self.paintingNumber + 1} / ${self.currentData.length}`);

    // add SVG left arrow as clickable image to the page
    // Add a rectangle behind the arrow that appears when you hover on the painting
    const TL = [self.viewWidth / 3 - arrowWidth / 2, arrowHeight / 4];
    let leftRect = this.arrowG
      .append("rect")
      .attr("transform", `translate(${TL[0] + arrowWidth / 4}, ${TL[1]})`)
      .attr("width", arrowWidth / 2)
      .attr("height", arrowHeight)
      .attr("fill", d3.interpolateBlues(0.5)) // same color as timeline bars!
      .attr("opacity", "0");
    this.arrowG
      .append("svg:image")
      .attr("xlink:href", "src/assets/left-arrow.svg")
      .attr("transform", `translate(${TL[0]}, ${TL[1]})`)
      .attr("width", arrowWidth)
      .attr("height", arrowHeight)
      .on("click", function () {
        --self.paintingNumber;
        self.update(self.currentData); // uses member variable to access constantly updating data set
      })
      .on("mouseover", function () {
        // When the user hovers on the preview, a border appears around it
        leftRect.transition().duration(100).style("opacity", 0.9);
      })
      .on("mouseout", function () {
        // The border goes away when you stop hovering
        leftRect.transition().duration(100).style("opacity", 0);
      });

    // add SVG right arrow as clickable image to the page
    // Add a rectangle behind the arrow that appears when you hover on the painting
    const TR = [(2 * self.viewWidth) / 3 - arrowWidth / 2, arrowHeight / 4];
    let rightRect = this.arrowG
      .append("rect")
      .attr("transform", `translate(${TR[0] + arrowWidth / 4}, ${TR[1]})`)
      .attr("width", arrowWidth / 2)
      .attr("height", arrowHeight)
      .attr("fill", d3.interpolateBlues(0.5)) // same color as timeline bars!
      .attr("opacity", "0");
    this.arrowG
      .append("svg:image")
      .attr("xlink:href", "src/assets/right-arrow.svg")
      .attr("transform", `translate(${TR[0]}, ${TR[1]})`)
      .attr("width", arrowWidth)
      .attr("height", arrowHeight)
      .on("click", function () {
        ++self.paintingNumber;
        self.update(self.currentData); // uses member variable to access constantly updating data set
      })
      .on("mouseover", function () {
        // When the user hovers on the preview, a border appears around it
        rightRect.transition().duration(100).style("opacity", 0.9);
      })
      .on("mouseout", function () {
        // The border goes away when you stop hovering
        rightRect.transition().duration(100).style("opacity", 0);
      });

    self.update(self.currentData);
  }

  /**
   * Updates the view asynchronously with filtered data
   */
  async update(data) {
    let npaintings = data.length;

    // early exit if there are no paintings
    if (npaintings <= 0) {
      this.arrowG.select("text").text("0 / 0");
      return null;
    }

    // Update the data set and painting number
    if (data !== this.currentData) {
      // set class's dataset to incoming dataset and restart the numbering
      this.currentData = data;
      this.paintingNumber = 0;
    } else if (this.paintingNumber < 0) {
      this.paintingNumber = 0;
    } else if (this.paintingNumber >= npaintings) {
      this.paintingNumber = npaintings - 1;
    }

    // update the arrow counter text
    this.arrowG
      .select("text")
      .text(`${this.paintingNumber + 1} / ${npaintings}`);

    // get the painting data
    const painting = data[this.paintingNumber],
      artworkLabel = painting.artworkLabel.trim(),
      yearLabel = painting.year,
      collectionLabel = painting.collectionLabel.trim(),
      locationLabel = painting.locLabel.trim(),
      movementLabel = painting.movement.trim(),
      genreLabel = painting.genreLabel.trim(),
      materialLabel = painting.materialLabel.trim(),
      creatorLabel = painting.creatorLabel.trim(),
      creatorBirthPlace = painting.creatorBirthPlaceLabel.trim(),
      creatorCountry = painting.creatorCountry.trim(),
      imageURL = painting.image.trim();

    // Wait for the image meta data before moving on (in case lots of updates are happening)
    const imgMeta = await getMeta(imageURL);

    // clear the view in prep for next painting
    this.displayG.selectAll("*").remove();

    // Add painting label and year
    const artwork =
        isBlank(artworkLabel) || /Q[0-9]+$/.test(artworkLabel)
          ? "Unknown"
          : artworkLabel,
      year = isBlank(yearLabel) ? "Unknown" : yearLabel,
      title = `${artwork} (${year})`;
    let titleNode = this.addText("title", this.viewWidth / 2, 0, title);
    titleNode.attr("text-anchor", "middle"); // centered
    const titleRect = titleNode.node().getBBox();

    // Set the preview image size based on image metadata
    let imageWidth = this.viewWidth / 2,
      imageHeight = (imageWidth / imgMeta.width) * imgMeta.height;
    if (imageHeight <= 0) {
      imageHeight = 50; // default blank space if the image doesn't have a height
    } else if (imageHeight >= 250) {
      imageHeight = 250; // cap image height at 250px, shrink image width
      imageWidth = (imageHeight / imgMeta.height) * imgMeta.width;
    }

    // Set preview image position
    const imageX = (this.viewWidth - imageWidth) / 2, // centered
      imageY = titleRect.height - 5; // use prev Height - pad

    // Add Modal functionality
    let modal = d3.select("#paintingModal");
    // Update modal img tag with new url
    modal
      .select("img")
      .attr("src", imageURL)
      .attr("width", "100%")
      .attr("height", "100%");
    // When the user clicks on <span> (x), close the modal
    modal.select("span").on("click", function () {
      modal.style("display", "none");
    });

    // Add a rectangle behind the painting that appears when you hover on the painting
    let rect = this.displayG
      .append("rect")
      .attr("transform", `translate(${imageX - 5}, ${imageY - 5})`)
      .attr("width", imageWidth + 10)
      .attr("height", imageHeight + 10)
      .attr("fill", d3.interpolateBlues(0.5)) // same color as timeline bars!
      .attr("opacity", "0");

    // add the preview of the painting to the display group
    this.displayG
      .append("svg:image")
      .attr("href", imageURL)
      .attr("transform", `translate(${imageX}, ${imageY})`)
      .attr("width", imageWidth)
      .attr("height", imageHeight)
      .on("click", function () {
        // When the user clicks on the image, open the modal
        modal.style("display", "block");
      })
      .on("mouseover", function () {
        // When the user hovers on the preview, a border appears around it
        rect.transition().duration(100).style("opacity", 0.9);
      })
      .on("mouseout", function () {
        // The border goes away when you stop hovering
        rect.transition().duration(100).style("opacity", 0);
      });

    // Set the left indent for the rest of the information
    let padLeft = this.viewWidth / 8;

    // Add artist information
    let artistY = imageY + imageHeight + 30; // use prev imgY + Height + pad
    let artistTitle = this.addText("artist-title", padLeft, artistY, "Artist");
    artistY += artistTitle.node().getBBox().height; // + added title's height
    const creator = isBlank(creatorLabel) ? "Unknown Artist" : creatorLabel,
      birthplace = isBlank(creatorBirthPlace) ? "" : creatorBirthPlace,
      country = isBlank(creatorCountry) ? "" : creatorCountry,
      artist = [creator, birthplace, country].filter(Boolean).join(", ");
    let artistNode = this.addText("artist-info", padLeft, artistY, artist);
    const artistRect = artistNode.node().getBBox();

    // Add whereabouts information
    let whereY = artistY + artistRect.height + 10; // use prev txtY + Height + pad
    let whereTitle = this.addText("where-title", padLeft, whereY, "Location");
    whereY += whereTitle.node().getBBox().height; // + added title's height
    const collection = isBlank(collectionLabel) ? "" : collectionLabel,
      location = isBlank(locationLabel) ? "Unknown Location" : locationLabel;
    const where =
      collection !== location
        ? [collection, location].filter(Boolean).join(", ")
        : collection; // don't print the same location twice
    let whereNode = this.addText("where-info", padLeft, whereY, where);
    const whereRect = whereNode.node().getBBox();

    // Add movement information
    let mvtY = whereY + whereRect.height + 10; // use prev txtY + Height + pad
    let mvtTitle = this.addText("movement-title", padLeft, mvtY, "Movement");
    mvtY += mvtTitle.node().getBBox().height; // + added title's height
    const movement = isBlank(movementLabel) ? "Unknown" : movementLabel;
    let mvtNode = this.addText("movement-info", padLeft, mvtY, movement);
    const mvtRect = mvtNode.node().getBBox();

    // Add genre information
    let genreY = mvtY + mvtRect.height + 10; // use prev txtY + Height + pad
    let genreTitle = this.addText("genre-title", padLeft, genreY, "Genre");
    genreY += genreTitle.node().getBBox().height; // + added title's height
    const genre = isBlank(genreLabel) ? "Unknown" : genreLabel;
    let genreNode = this.addText("genre-info", padLeft, genreY, genre);
    const genreRect = genreNode.node().getBBox();

    // Add material information
    let matY = genreY + genreRect.height + 10; // use prev txtY + Height + pad
    let matTitle = this.addText("material-title", padLeft, matY, "Material");
    matY += matTitle.node().getBBox().height; // + added title's height
    const mat = isBlank(materialLabel) ? "Unknown" : materialLabel;
    let matNode = this.addText("material-info", padLeft, matY, mat);
    const matRect = matNode.node().getBBox();
  }

  /**
   * Convenience method to append text elements in display group
   */
  addText(class_, x, y, text) {
    // since text is padded 1/8 of viewWidth from both sides, that leaves
    // 3/4 of the viewWidth in the middle to have text
    let textElem = this.displayG
      .append("text")
      .attr("class", class_)
      .attr("transform", `translate(${x}, ${y})`)
      .text(text)
      .call(wrap, (3 * this.viewWidth) / 4);
    return textElem;
  }
}

/**
 * Wraps <text> within `width` pixels; call using `.call(wrap, px)`
 */
function wrap(text, width) {
  text.each(function () {
    var text = d3.select(this),
      words = text.text().split(/\s+/).reverse(),
      word,
      line = [],
      x = text.attr("x"),
      y = text.attr("y"),
      tspan = text.text(null).append("tspan").attr("x", x).attr("y", y);
    while ((word = words.pop())) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text
          .append("tspan")
          .attr("x", 0)
          .attr("y", y)
          .attr("dy", "1.1em")
          .text(word);
      }
    }
  });
}

/**
 * Checks if given string is blank, null or undefined
 */
function isBlank(str) {
  return !str || /^\s*$/.test(str);
}

/**
 * Get metadata from the url
 */
function getMeta(url) {
  return new Promise((resolve, reject) => {
    let img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject();
    img.src = url;
  });
}
