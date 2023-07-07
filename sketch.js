
let tiles=[];
let rows = 100;
let cols = 100;
let res = 15;
let wallTrace = [];
const radius = 20;
let wallHeight = res * 2;

class Tile {
    constructor(i, j, altitude) {
        this.i = i;
        this.j = j;
        this.altitude = altitude;
        this.color = this.altitude;
        noStroke();
        fill (this.color);
        rect(this.i * res - res/2, this.j * res - res/2, res, res);
        // textSize(8);
        // fill(0,255,255);
        // text(round(this.altitude), this.i * res, this.j * res);
    }
}

class Wall {
    constructor(wallTrace){
        this.wallTrace = wallTrace;
        this.area = area(this.wallTrace);
        console.log('area: ' + this.area);
        this.offset = 2; //positive offset is outside the wall, negative offset is inside the wall
        this.offsetPoints = offsetPoints(this.wallTrace, this.offset);
        console.log(this.offsetPoints);

        //earthwork
        this.earthwork = 0;
     
        let wallThickness = this.offset * res;
        console.log('wall thinkness: ' + wallThickness);
        for (let i = 0; i < this.wallTrace.length; i++) {
            let j = i + 1;
            if (j == this.wallTrace.length) j = 0;
            
            let x1 = this.wallTrace[i].i;
            let y1 = this.wallTrace[i].j;
            let x2 = this.wallTrace[j].i;
            let y2 = this.wallTrace[j].j;

            let length = sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) * res;
            // console.log(i, this.offsetPoints[i].altitude, this.wallTrace[i].altitude, this.offsetPoints[i].altitude - this.wallTrace[i].altitude)
            let section0 = wallThickness * (wallHeight + this.offsetPoints[i].altitude - this.wallTrace[i].altitude);
            let section1 = wallThickness * (wallHeight + this.offsetPoints[j].altitude - this.wallTrace[j].altitude);
            this.earthwork += (section0 + section1) * length / 2 + 1/2 * wallThickness /2 * wallHeight * length;  
        }
        console.log('earth work: ' + this.earthwork);
    }
    drawWall(){
        
        for (let i = 0; i < this.wallTrace.length; i++) {
            noStroke();
            fill(0,255,0);
            circle(this.wallTrace[i].i * res, this.wallTrace[i].j * res, res/2);
            circle(this.offsetPoints[i].i * res, this.offsetPoints[i].j * res, res/2);
            noStroke();
            fill(255,0,0);
            textSize(res);
            text(i, this.wallTrace[i].i * res, this.wallTrace[i].j * res)

            if (i == this.wallTrace.length - 1) {
                stroke(0);
                strokeWeight(3);
                noFill();
                line(this.wallTrace[i].i * res, this.wallTrace[i].j * res, this.wallTrace[0].i * res, this.wallTrace[0].j * res);
                stroke(0,0,255);
                line(this.offsetPoints[i].i * res, this.offsetPoints[i].j * res, this.offsetPoints[0].i * res, this.offsetPoints[0].j * res);
            } else {
                stroke(0);
                strokeWeight(3);
                noFill();
                line(this.wallTrace[i].i * res, this.wallTrace[i].j * res, this.wallTrace[i+1].i * res, this.wallTrace[i+1].j * res);
                stroke(0,0,255);
                line(this.offsetPoints[i].i * res, this.offsetPoints[i].j * res, this.offsetPoints[i+1].i * res, this.offsetPoints[i+1].j * res);
            }
            
        }
    }
    fitness() {
        let fitness = sigmoid(this.area)  + earthworkScoring(this.earthwork);
        return fitness;
    }
}

function setup() {
    //create 2D array tiles with p5 noise
    createCanvas(rows * res, cols * res);
    noiseSeed(99);
    for (let i = 0; i < rows; i++) {
        tiles[i] = [];
        for (let j = 0; j < cols; j++) {
            //noise with 3 octaves
            tiles[i][j] = new Tile(i, j, (noise(i*0.01, j*0.01) + 0.5* noise(i*0.02, j*0.02) + 0.25* noise(i*0.04, j*0.04)) * 200 );
        }
    }
    contour();
    let wall = new Wall(wallContour(radius));
    wall.drawWall();
    console.log(wall.fitness());

    let inside = checkInside(wall.wallTrace);
}
  
function draw() {
    // background(220);
}

// within the canvas, choose a random center, imagine a circle with radius of 10 tiles, the circle should not exceed the canvas. make 36 points on the circle, define each point to its closest tile, draw lines to connect the points clockwise.
function wallContour(radius) {
    wallTrace = [];
    let x = round(random(radius + 3, rows - radius-3));
    let y = round(random(radius + 3, cols - radius-3));
    for (let i = 0; i < 36; i++) {
        let angle = i * 10 * PI / 180;
        let x1 = round (x + radius * cos(angle));
        let y1 = round (y + radius * sin(angle));
        wallTrace[i] = tiles[x1][y1];
    }
    return wallTrace;
}

//calculate the outside offset points of the wall
function offsetPoints(wallTrace, offset) {
    let offsetPoints = [];
    for (let i = 0; i < wallTrace.length; i++) {
        let j = i + 1;
        if (j == wallTrace.length) {
            j = 0;
        }
        let x1 = wallTrace[i].i;
        let y1 = wallTrace[i].j;
        let x2 = wallTrace[j].i;
        let y2 = wallTrace[j].j;
        let angle = atan2(y2 - y1, x2 - x1);
        let x3 = x1 - offset * cos(angle + PI/2);
        let y3 = y1 - offset * sin(angle + PI/2);
        offsetPoints[i] = tiles[round(x3)][round(y3)];
    }
    return offsetPoints;
}

// given a set of points with sequence, calculate the area of the polygon
function area(points) {
    let area = 0;
    let j = points.length - 1;
    for (let i = 0; i < points.length; i++) {
        area += (points[j].i + points[i].i) * (points[j].j - points[i].j);
        j = i;
    }
    return abs(area/2);
}
//sigmoid function
function sigmoid(x) {
    return 1 / (1 + exp(-  x*0.01 + 10));
}
function earthworkScoring(earthwork) {
    if (earthwork < 1500000) {
        return 1;
    } else  {
        return 1 - (earthwork - 1500000)/1000000;
    }
}

//check which tiles are inside wallTrace polygon
function checkInside(wallTrace) {
    let inside = [];
    for (let i = 0; i < rows; i++) {
        inside[i] = [];
        for (let j = 0; j < cols; j++) {
            inside[i][j] = false;
        }
    }
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++){
            if (insidePolygon(i, j, wallTrace)) {
                inside[i][j] = true;
                // tiles[i][j].color = 255;
                // noStroke();
                // fill (tiles[i][j].color,100);
                // rect(i * res - res/2, j * res - res/2, res, res);
            }
        }
    }
    return inside;
}

//check if a point is inside a polygon
function insidePolygon(x, y, wallTrace) {
    let inside = false;
    let j = wallTrace.length - 1;
    for (let i = 0; i < wallTrace.length; i++) {
        if ((wallTrace[i].j > y) != (wallTrace[j].j > y) && (x < (wallTrace[j].i - wallTrace[i].i) * (y - wallTrace[i].j) / (wallTrace[j].j - wallTrace[i].j) + wallTrace[i].i)) {
            inside = !inside;
        }
        j = i;
    }
    return inside;
}
