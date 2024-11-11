---
title: "Deepavali and JavaScript: Creating a dynamic firework animation with particles"
summary: "Learn how to create a mesmerizing particle animation using JavaScript and p5.js, with particles that take on colors from an underlying image."
date: "Nov 12 2024"
draft: false
tags:
- Art 
- Beginners
- JavaScript
---

Hey everyone! On the auspicious ocasssion of Deepavali, I created this little animation project. Hope you'll like it.  🎆


<iframe src="https://editor.p5js.org/zoyron/full/PN65s9LPP" width="480" height="640"></iframe>

Today, we'll be recreating the above fireworks animation that lights up your screen with particle explosions, taking colors from an underlying image. 

## How it Works

The key components that make this animation possible are:

1. **Particle Objects**: The `Particle` class represents individual particles, each with its own position, velocity, acceleration, and lifespan. These particles can be either part of a firework explosion or independent, drifting particles.

2. **Firework Objects**: The `Firework` class manages the creation and explosion of firework particles. When a firework is triggered, it launches a central particle that eventually explodes, sending out a burst of colorful particles.

3. **Image Integration**: The animation uses an image of the Ramayana as the background. The color of each particle is sampled directly from the corresponding pixel in the image, creating a beautiful, organic integration of the visuals.

4. **Physics Simulation**: The particles are subject to a simulated gravity force, which causes them to drift and fall in a natural, realistic manner. Additional forces are applied to the firework particles to create their explosive effect.

5. **Randomization**: Various parameters, such as particle size, velocity, and explosion patterns, are randomized to introduce variety and avoid a repetitive visual.

---

## Diving into the Code

Let's take a closer look at some of the key aspects of the code:

### Loading the Ramayana Image
```javascript
let img;
function preload() {
  // Load the Ramayana image before the sketch is set up
  img = loadImage('./Ramayana.jpg');
}
```
The `preload()` function is used to load the Ramayana image before the sketch is set up. This ensures the image is available for use throughout the animation.

### The Particle Class
```javascript
function Particle(x, y, hu, firework) {
  // Initialize particle properties
  this.pos = createVector(x, y);
  this.firework = firework;
  this.lifespan = 255;
  this.hu = hu;
  this.acc = createVector(0, 0);

  // Set initial velocity based on whether it's a firework particle or not
  if (this.firework) {
    this.vel = createVector(0, random(-17.5, -8));
  } else {
    this.vel = p5.Vector.random2D();
    this.vel.mult(random(2, 15));
  }

  // Apply a force to the particle
  this.applyForce = function(force) {
    this.acc.add(force);
  };

  // Update the particle's position and velocity
  this.update = function() {
    if (!this.firework) {
      this.vel.mult(0.9); // Slow down the particle over time
      this.lifespan -= 2; // Decrease the particle's lifespan
    }
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0); // Reset the acceleration
  };

  // Check if the particle has expired
  this.done = function() {
    if (this.lifespan < 0) {
      return true;
    } else {
      return false;
    }
  };

  // Display the particle on the canvas
  this.show = function() {
    colorMode(RGB);
    if (!this.firework) {
      strokeWeight(random(1.75,3)); // Set a random stroke weight for non-firework particles
      stroke(color(img.get(this.pos.x, this.pos.y))); // Set the particle color based on the Ramayana image
    } else {
      strokeWeight(random(2,4)); // Set a random stroke weight for firework particles
      stroke(color(img.get(this.pos.x, this.pos.y))); // Set the particle color based on the Ramayana image
    }
    point(this.pos.x, this.pos.y); // Draw the particle as a point
  };
}
```
The `Particle` class defines the basic properties and behaviors of each particle. It handles the particle's position, velocity, acceleration, lifespan, and whether it's part of a firework explosion. The `show()` method is particularly important, as it samples the color of the corresponding pixel in the Ramayana image and applies it to the particle.

### The Firework Class
```javascript
function Firework() {
  // Initialize firework properties
  this.hu = random(255); // Random hue value for the firework
  this.firework = new Particle(random(width), height, this.hu, true); // Create the central firework particle
  this.exploded = false;
  this.particles = [];

  // Check if the firework has finished exploding
  this.done = function() {
    if (this.exploded && this.particles.length === 0) {
      return true;
    } else {
      return false;
    }
  };

  // Update the firework and its particles
  this.update = function() {
    if (!this.exploded) {
      this.firework.applyForce(gravity); // Apply gravity to the central firework particle
      this.firework.update(); // Update the central firework particle
      if (this.firework.vel.y >= 0) { // If the central particle starts falling downward
        this.exploded = true;
        this.explode(); // Explode the firework
      }
    }

    // Update each particle in the explosion
    for (var i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].applyForce(gravity);
      this.particles[i].update();
      if (this.particles[i].done()) { // Remove particles that have expired
        this.particles.splice(i, 1);
      }
    }
  };

  // Explode the firework and create new particles
  this.explode = function() {
    for (var i = 0; i < 550; i++) {
      var p = new Particle(
        this.firework.pos.x,
        this.firework.pos.y,
        this.hu,
        false
      );
      this.particles.push(p);
    }
  };

  // Display the firework and its particles
  this.show = function() {
    if (!this.exploded) {
      this.firework.show(); // Show the central firework particle
    }
    for (var i = 0; i < this.particles.length; i++) {
      this.particles[i].show(); // Show each particle in the explosion
    }
  };
}
```
The `Firework` class manages the creation and explosion of the firework particles. When the central firework particle reaches its peak, the `explode()` method is called, generating 550 new particles that radiate outward from the explosion point. The `update()` and `show()` methods handle the animation and rendering of the firework and its particles.

### The Main Draw Loop
```javascript
var fireworks = [];
var gravity;

function setup() {
  createCanvas(img.width, img.height);
  colorMode(RGB);
  gravity = createVector(0, 0.25); // Set the gravity force
  strokeWeight(4);
  background(0);
}

function draw() {
  colorMode(RGB);
  background(0, 0,0,15); // Apply a subtle fade effect to the background

  // Randomly create new fireworks
  if (random(1) < 0.1) {
    fireworks.push(new Firework());
  }

  // Update and display all active fireworks and their particles
  for (var i = fireworks.length - 1; i >= 0; i--) {
    fireworks[i].update();
    fireworks[i].show();
    if (fireworks[i].done()) { // Remove fireworks that have finished exploding
      fireworks.splice(i, 1);
    }
  }
}
```
The `draw()` function is the heart of the animation. It handles the creation of new fireworks, the updating and rendering of all active fireworks and particles, and the removal of expired elements. The `setup()` function sets up the initial canvas and environment for the animation.

---

## Complete Code

Here’s the complete code for a fireworks animation that lights up with colors from the image.
```javascript

let img;

function preload() {
  img = loadImage('./Ramayana.jpg');
}

function Particle(x, y, hu, firework) {
  this.pos = createVector(x, y);
  this.firework = firework;
  this.lifespan = 255;
  this.hu = hu;
  this.acc = createVector(0, 0);

  if (this.firework) {
    this.vel = createVector(0, random(-17.5, -8));
  } else {
    this.vel = p5.Vector.random2D();
    this.vel.mult(random(2, 15));
  }

  this.applyForce = function(force) {
    this.acc.add(force);
  };

  this.update = function() {
    if (!this.firework) {
      this.vel.mult(0.9);
      this.lifespan -= 2;
    }
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);
  };

  this.done = function() {
    return this.lifespan < 0;
  };

  this.show = function() {
    colorMode(RGB);
    strokeWeight(this.firework ? random(2, 4) : random(1.75, 3));
    stroke(color(img.get(this.pos.x, this.pos.y)));
    point(this.pos.x, this.pos.y);
  };
}

function Firework() {
  this.hu = random(255);
  this.firework = new Particle(random(width), height, this.hu, true);
  this.exploded = false;
  this.particles = [];

  this.done = function() {
    return this.exploded && this.particles.length === 0;
  };

  this.update = function() {
    if (!this.exploded) {
      this.firework.applyForce(gravity);
      this.firework.update();

      if (this.firework.vel.y >= 0) {
        this.exploded = true;
        this.explode();
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].applyForce(gravity);
      this.particles[i].update();

      if (this.particles[i].done()) {
        this.particles.splice(i, 1);
      }
    }
  };

  this.explode = function() {
    for (let i = 0; i < 550; i++) {
      let p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hu, false);
      this.particles.push(p);
    }
  };

  this.show = function() {
    if (!this.exploded) {
      this.firework.show();
    }
    for (let particle of this.particles) {
      particle.show();
    }
  };
}

var fireworks = [];
var gravity;

function setup() {
  createCanvas(img.width, img.height);
  colorMode(RGB);
  gravity = createVector(0, 0.25);
  strokeWeight(4);
  background(0);
}

function draw() {
  colorMode(RGB);
  background(0, 0, 0, 15);

  if (random(1) < 0.1) {
    fireworks.push(new Firework());
  }

  for (let i = fireworks.length - 1; i >= 0; i--) {
    fireworks[i].update();
    fireworks[i].show();

    if (fireworks[i].done()) {
      fireworks.splice(i, 1);
    }
  }
}

```

---

## How to run the code

To run the code, copy and paste it, or write it from scratch in [this editor](https://editor.p5js.org/). After that, get any image related to Ramayana, change it's name to "Ramayana.jpg", and upload that image to the above code editor. 

Congratulations! You’ve created a beautiful, dynamic fireworks display that samples colors from an image. This animation combines physics, color sampling, and particle systems, showcasing the power of JavaScript and p5.js. Experiment with different images and tweak parameters like gravity, lifespan, and particle count to make your fireworks show unique. 🎇🪔
