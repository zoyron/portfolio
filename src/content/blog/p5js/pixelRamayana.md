---
title: "Ramayana and JavaScript: Creating a Dynamic Animation with particles"
summary: "Learn how to create a mesmerizing particle animation using JavaScript and p5.js, with particles that take on colors from an underlying image."
date: "Sep 23 2024"
draft: false
tags:
- Art 
- Beginners
- JavaScript
---
Hey everyone! 🌟

Today, we're diving into a cool animation project that brings together art and code to create a beautiful effect of particles falling down. We'll be using JavaScript and the p5.js library to make particles dance like snowflakes across your screen, taking on colors from an underlying image. It's a perfect blend of winter magic and creative coding!

![snowfall](../assets/ramayana.png)

To run the animation before starting with the blog, follow the steps:
- go to this link <a href="https://editor.p5js.org/" target="_blank">this link</a> and paste the code I'll provide at the end.
- download the above image, upload it in the p5js text editor online

> Note: This blog is targeted towards people who are beginners and just know a little JavaScript.

#### The significance of snowfall or snowflake in this project:

You will be seeing a lot of mentions of **snowfall** or **snowflake** in this project. It is only because the particles creating the image on the screen will be falling down like snowflakes, hence the varible and class names "snowfall/snowflake" have been used many time.

___

## The Magic Behind the Snowfall

- **Object-Oriented Programming**: We use a `snowflake` class to create and manage individual snowflakes.
- **Trigonometry**: Sine and cosine functions create smooth, circular motions for the snowflakes.
- **Random Functions**: These add variety to the snowflakes' sizes, positions, and behaviors.
- **Image Processing**: We sample colors from an underlying image to color our snowflakes.

## Let's Code

We're using p5.js, a fun JavaScript library for creative coding. I recommend using their online editor, which you can find <a href="https://editor.p5js.org/" target="_blank">here</a>. Make sure you're writing code in that editor.

Now, let's break down the code and see how this winter wonderland comes to life!

### Setup and Initialization

First, we set up our canvas and initialize our variables:

```javascript
let snowflakes = []; // array to hold snowflake objects
let img;
let xoff = 0;
let scaleFactor = 7/10; // Scale factor for the canvas size

function preload() {
  img = loadImage('./ramayana.png');
}

function setup() {
  createCanvas(img.width * scaleFactor, img.height * scaleFactor);
  noStroke();
  background("#000000");
  frameRate(45);
}
```

- We create an array to hold our snowflakes.
- We load an image that will provide colors for our snowflakes.
- We set up the canvas, scaling it based on the image size.

### The Draw Loop

Next, in the `draw` function, we create and update our snowflakes:

```javascript
function draw() {
  let t = frameCount / 90; // update time
  
  // create a random number of snowflakes each frame
  for (let i = 0; i < random(50); i++) {
    snowflakes.push(new snowflake()); // append snowflake object
  }
  
  // loop through snowflakes with a for..of loop
  for (let flake of snowflakes) {
    flake.update(t); // update snowflake position
    flake.display(); // draw snowflake
  }
  
  xoff += 1.0;
}
```

- We use `frameCount` to keep track of time.
- We randomly create new snowflakes each frame.
- We update and display each snowflake in our array.

### The Snowflake Class

The heart of our animation is the `snowflake` class:

```javascript
function snowflake() {
  this.posX = random(width);
  this.posY = random(-50, 0);
  this.initialangle = random(0, 2 * PI);
  this.size = random(1, 3) * scaleFactor;
  this.radius = sqrt(random(pow(width / 2, 2)));

  this.update = function(time) {
    let w = 1.6; // angular speed
    let angle = w * time + this.initialangle;
    this.posX = width / 2 + this.radius * sin(angle);
    this.posY += pow(this.size / scaleFactor, 0.5) * 2 * scaleFactor;

    if (this.posY > height) {
      let index = snowflakes.indexOf(this);
      snowflakes.splice(index, 1);
    }
  };

  this.display = function() {
    let imgX = this.posX / scaleFactor;
    let imgY = this.posY / scaleFactor;
    fill(color(img.get(imgX, imgY)));
    ellipse(this.posX, this.posY, this.size);
  };
}
```

- **this.posX**: Sets a random initial x-position across the width of the canvas.
- **this.posY**: Sets a random initial y-position slightly above the top of the canvas (-50 to 0).
- **this.initialangle**: Assigns a random initial angle (0 to 2π) for circular motion.
- **this.size**: Determines the snowflake size, randomly between 1-3 pixels, scaled by scaleFactor.
- **this.radius**: Calculates a random radius for circular motion, ensuring even distribution.
- **w**: Angular speed, controlling how fast the snowflake moves in its circular path.
- **angle**: Calculates the current angle based on time and initial angle.
- **this.posX**: Updates x-position using a sine function, creating a swaying motion.
- **this.posY**: Increases y-position, making the snowflake fall. Larger snowflakes fall faster.
- The if statement removes the snowflake from the array when it falls below the canvas.

To  sum it up, this snowflake function creates a realistic snowfall effect by:

1. Randomly positioning snowflakes.
2. Moving them in a swaying, falling motion.
3. Varying their sizes and fall speeds.
4. Coloring them based on an underlying image.
5. Removing them when they fall off the screen.

## Putting It All Together

Here's the complete code for our snowfall animation:

```javascript
// snowflakes is an array of snowflake objects
let snowflakes = [];
let img;
let xoff = 0;
let scaleFactor = 7/10; // Scale factor for the canvas size

// preload() is a special function in P5.js that runs once before setup()
function preload() {
  // load the image (Ramayana.png) into the img variable
  img = loadImage('./ramayana.png');
}

// setup() is a special function in P5.js that runs once after preload()
function setup() {
  // create a canvas with the same size as the image, but scaled down by scaleFactor
  createCanvas(img.width * scaleFactor, img.height * scaleFactor);
  // disable drawing outlines around shapes
  noStroke();
  // set the background color to black
  background("#000000");
  // set the frame rate to 45 frames per second
  frameRate(45);
}

// draw() is a special function in P5.js that runs continuously after setup()
function draw() {
  // calculate the time since the last frame was drawn
  let t = frameCount / 90;
  
  // create a random number of snowflakes each frame
  for (let i = 0; i < random(50); i++) {
    // create a new snowflake object and add it to the snowflakes array
    snowflakes.push(new snowflake());
  }
  
  // loop through snowflakes with a for..of loop
  for (let flake of snowflakes) {
    // update the position of the snowflake
    flake.update(t);
    // draw the snowflake
    flake.display();
  }
  
  // increment xoff by 1.0 each frame
  xoff += 1.0;
}

// snowflake is a constructor function that creates a new snowflake object
function snowflake() {
  // set the initial position of the snowflake
  this.posX = random(width);
  this.posY = random(-50, 0);
  // set the initial angle of the snowflake
  this.initialangle = random(0, 2 * PI);
  // set the size of the snowflake
  this.size = random(1, 3) * scaleFactor;
  // set the radius of the snowflake
  this.radius = sqrt(random(pow(width / 2, 2)));

  // update() is a method that updates the position of the snowflake
  this.update = function(time) {
    // angular speed
    let w = 1.6;
    // calculate the angle of the snowflake
    let angle = w * time + this.initialangle;
    // update the position of the snowflake
    this.posX = width / 2 + this.radius * sin(angle);
    this.posY += pow(this.size / scaleFactor, 0.5) * 2 * scaleFactor;

    // if the snowflake has gone off the bottom of the screen, remove it from the array
    if (this.posY > height) {
      let index = snowflakes.indexOf(this);
      snowflakes.splice(index, 1);
    }
  };

  // display() is a method that draws the snowflake
  this.display = function() {
    // calculate the x and y coordinates of the snowflake on the original image
    let imgX = this.posX / scaleFactor;
    let imgY = this.posY / scaleFactor;
    // get the color of the pixel at the calculated coordinates
    fill(color(img.get(imgX, imgY)));
    // draw an ellipse at the position of the snowflake
    ellipse(this.posX, this.posY, this.size);
  };

}
```

## Conclusion

By combining simple math, object-oriented programming, and image processing, we've created a mesmerizing snowfall animation. The snowflakes dance across the screen, taking on colors from our underlying image, creating a unique and beautiful effect.

This project demonstrates how we can use code to create art and bring a touch of winter magic to our screens. Feel free to experiment with different images, adjust the parameters, or add your own creative twists to the animation!

Happy coding, and let it snow! ❄️🎨✨
