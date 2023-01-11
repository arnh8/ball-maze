//The edges of a graph represent a connection between two junctions of a maze.
function graphNode(x, y) {
    const connections = [];
    const printNode = () => {
        console.log(`(${x},${y})`);
    };

    return {
        x,
        y,
        connections,
        printNode,
        visited: false,
    };
}
function createMaze(x, y) {
    //given dimensions x and y, make a maze x units by y units
    //initialize 2d matrix of nodes
    const matrix = [];
    for (let i = 0; i < x; i++) {
        const row = [];
        for (let j = 0; j < y; j++) {
            row.push(graphNode(i, j));
        }
        matrix[i] = row;
    }

    let stack = [];
    stack.push(matrix[0][0]);
    let newPath = false;
    while (stack.length != 0) {
        const currentNode = stack.pop();
        if (currentNode.visited == true) {
            continue;
        }
        currentNode.visited = true;
        const i = currentNode.x;
        const j = currentNode.y;

        if (newPath) {
            //find a neighbor with connections and connect it to currentNode
            //Look up
            if (
                isInBounds(i, j - 1, x, y) &&
                matrix[i][j - 1].connections.length > 0 &&
                matrix[i][j - 1].visited
            ) {
                currentNode.connections.push(matrix[i][j - 1]);
                matrix[i][j - 1].connections.push(currentNode);
            }
            //Look down
            else if (
                isInBounds(i, j + 1, x, y) &&
                matrix[i][j + 1].connections.length > 0 &&
                matrix[i][j + 1].visited
            ) {
                currentNode.connections.push(matrix[i][j + 1]);
                matrix[i][j + 1].connections.push(currentNode);
            }
            //Look right
            else if (
                isInBounds(i + 1, j, x, y) &&
                matrix[i + 1][j].connections.length > 0 &&
                matrix[i + 1][j].visited
            ) {
                currentNode.connections.push(matrix[i + 1][j]);
                matrix[i + 1][j].connections.push(currentNode);
            }
            //Look left
            else if (
                isInBounds(i - 1, j, x, y) &&
                matrix[i - 1][j].connections.length > 0 &&
                matrix[i - 1][j].visited
            ) {
                currentNode.connections.push(matrix[i - 1][j]);
                matrix[i - 1][j].connections.push(currentNode);
            } else {
                console.log("error");
            }
        }

        //find the nodes that are neighbors of this node (unconnected and unvisited)
        let neighbors = [];

        //Look up: above (1,1) is (1,0)
        if (isInBounds(i, j - 1, x, y)) {
            if (!matrix[i][j - 1].visited) {
                neighbors.push(matrix[i][j - 1]);
            }
        }
        //Look down
        if (isInBounds(i, j + 1, x, y)) {
            if (!matrix[i][j + 1].visited) {
                neighbors.push(matrix[i][j + 1]);
            }
        }
        //Look right
        if (isInBounds(i + 1, j, x, y)) {
            if (!matrix[i + 1][j].visited) {
                neighbors.push(matrix[i + 1][j]);
            }
        }
        //Look left
        if (isInBounds(i - 1, j, x, y)) {
            if (!matrix[i - 1][j].visited) {
                neighbors.push(matrix[i - 1][j]);
            }
        }

        if (neighbors.length == 0) {
            newPath = true;
            continue;
        } else {
            newPath = false;
        }
        //Pick a random neighbor to connect
        const rand = Math.floor(Math.random() * neighbors.length);
        const randNeighbor = neighbors[rand];
        neighbors.splice(rand, 1);

        //Connect randNeighbor and currentNode
        currentNode.connections.push(randNeighbor);
        randNeighbor.connections.push(currentNode);

        //Push neighbors onto stack
        stack = stack.concat(neighbors);
        stack.push(randNeighbor);
    }
    return matrix;
}
function printMaze(matrix, x, y) {
    let mazestring = "  0   1   2   3   4   5   6   7   8   9 \n";
    //A maze with x cells has 2x+1 walls?
    for (let i = 0; i < 2 * y + 1; i++) {
        mazestring += "██";
    }

    mazestring += "\n";
    //h,i => x,y
    for (let i = 0; i < 2 * y; i++) {
        //L/R Walls
        if (i % 2 == 0) {
            mazestring += "██  ";
            if (hasConnection(0, i / 2, 1, i / 2, matrix)) {
                mazestring += "    ";
            } else {
                mazestring += "██  ";
            }
            for (let h = 1; h < x - 1; h++) {
                if (hasConnection(h, i / 2, h + 1, i / 2, matrix)) {
                    mazestring = mazestring + "    ";
                } else {
                    mazestring += "██  ";
                }
            }
            mazestring += "██\n";
            //does 0,0 have a connection to its right?
        }
        //U/D Walls
        else if (i % 2 == 1) {
            mazestring += "██";
            for (let h = 0; h < x; h++) {
                if (hasConnection(h, (i - 1) / 2, h, (i - 1) / 2 + 1, matrix)) {
                    /* console.log(
                        h +
                            "," +
                            (i - 1) / 2 +
                            " has a  connection with " +
                            h +
                            "," +
                            ((i - 1) / 2 + 1)
                    ); */
                    mazestring += "  ██";
                } else {
                    /*
                    console.log(
                        h +
                            "," +
                            (i - 1) / 2 +
                            " has no connection with " +
                            h +
                            "," +
                            ((i - 1) / 2 + 1)
                    );
                    */
                    mazestring += "████";
                }
            }
            mazestring += " line " + i + "\n";
        }
    }

    console.log(mazestring);
}
function isInBounds(a, b, x, y) {
    if (a >= x || a < 0) {
        return false;
    }
    if (b >= y || b < 0) {
        return false;
    }

    return true;
}

function mazeToCannonBody(maze, wallThickness, wallpathratioithink) {}

function hasConnection(a, b, x, y, matrix) {
    //Is cell a,b connected to x,y?
    if (matrix[a][b].connections.length == 0) {
        return false;
    }
    for (let i = 0; i < matrix[a][b].connections.length; i++) {
        const e = matrix[a][b].connections[i];
        if (e.x == x && e.y == y) {
            return true;
        }
    }
    return false;
}

export function cannonMaze() {
    console.log("hi there");
}

const matrix = createMaze(15, 15);
printMaze(matrix, 15, 15);
