var canvas;
var context;
var difficulty = 'difficulty-0';
var speeds = [600, 400, 200];
var game;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function canvasInit() {
    canvas = document.getElementById('myCanvas'),
    context = canvas.getContext('2d');
}

function drawRectangle() {
    context.fillStyle = 'rgba(200, 40, 40)';
    context.fillRect(50, 50, 20, 20);
}

$(document).ready( () => {
    canvasInit();
    game = new SnakeGame(speed);

    $('.difficulty-button').click( (e) => {
        if(!$(e.target).hasClass('active-difficulty')) {
            $(`#${difficulty}`).removeClass('active-difficulty');
            $(e.target).addClass('active-difficulty');
            difficulty = $(e.target).attr('id');
        }
    });

    $('#new-game-button').click( async () => {
        let diff = parseInt(difficulty.match(/(\d+)/));
        let speed = speeds[diff];
        $('#canvas-overlay').css('display', 'none');
        game = await new SnakeGame(speed);
        game.init();
    });



    // Swipe touchscreen input
    $(document).swipe({
        swipeLeft:function(event, distance, duration, fingerCount, fingerData, currentDirection) {
            game.direction = 'left';
        },
        swipeUp:function(event, distance, duration, fingerCount, fingerData, currentDirection) {
            game.direction = 'up';
        },
        swipeRight:function(event, distance, duration, fingerCount, fingerData, currentDirection) {
            game.direction = 'right';
        },
        swipeDown:function(event, distance, duration, fingerCount, fingerData, currentDirection) {
            game.direction = 'up';
        }
    });

    // Arrow key input
    $(document).keydown( (e) => {
        switch(e.keyCode) {
            case 37: 
            // Left
            game.direction = 'left';
            break;

            case 38: 
            // Up
            game.direction = 'up';
            break;

            case 39: 
            // Right
            game.direction = 'right';
            break;

            case 40: 
            // Down
            game.direction = 'down';
            break;

            default:
                return;
        }
        e.preventDefault();
    });
});

////////////////////////////////////////////////
////////////////////////////////////////////////
//          Add Canvas functionality          //
////////////////////////////////////////////////
////////////////////////////////////////////////
class SnakeGame {
    constructor(snakeSpeed) {
        this.speed = snakeSpeed;
        this.dimensions = 10;
        this.model = [];
        this.openSpaces = [];
        this.snake = new LinkedList();
        this.itemCoordinates = [];
        this.isLive = false;
        this.direction = 'right';
        this.score = 0;

        for(let i=0; i<this.dimensions; i++) {
            this.model.push(new Array(this.dimensions).fill(0));
        }

        for(let i=0; i<this.dimensions; i++) {
            for(let j=0; j<this.dimensions; j++) {
                this.openSpaces.add([i, j]);
            }
        }
    }

    init() {
        // CLEAR CANVAS

        this.addSnake(4, 0);
        this.addSnake(4, 1);
        this.addSnake(4, 2);
        this.addSnake(4, 3);
        this.addRandomItem();

        this.start();
    }

    start() {
        this.isLive = true;
    }

    gameOver() {
        this.isLive = false;
    }

    addSnake(x, y) {
        this.model[x][y] = 1;
        this.snake.add(new Node(x, y));
        this.removeOpenSpace(x, y);
    }

    removeSnake() {
        let node = this.snake.remove(x, y);
        if(node != null) {
            this.model[node.x][node.y] = 0;
            this.addOpenSpace(node.x, node.y);
        }
    }

    addOpenSpace(x, y) {
        this.openSpaces.add([x,y]);
    }

    removeOpenSpace(x, y) {
        for(let i=0; i<this.openSpaces.length; i++) {
            if(this.openSpaces[i][0] === x && this.openSpaces[i][1] === y) {
                this.openSpaces = this.openSpaces.splice(i, 1);
                return;
            }
        }
    }

    addRandomItem() {
        let randomIndex = Math.floor(Math.random() * this.openSpaces.length);
        this.itemCoordinates = this.openSpaces[randomIndex];
        this.model[itemCoords[0]][this.itemCoordinates[1]] = 2;
        this.removeOpenSpace(this.itemCoordinates[0], this.itemCoordinates[1]);
    }

    move() {
        let nextCoords = [];
        if(this.direction === 'up') {
            nextCoords = [this.snake.head.x - 1, this.snake.head.y];
        }
        else if(this.direction === 'left') {
            nextCoords = [this.snake.head.x, this.snake.head.y-1];
        }
        else if(this.direction === 'right') {
            nextCoords = [this.snake.head.x, this.snake.head.y+1];
        }
        else if(this.direction === 'down') {
            nextCoords = [this.snake.head.x+1, this.snake.head.y];
        }

        // If next move is within bounds
        if(nextCoords[0] < this.dimensions && nextCoords[0] >= 0 && nextCoords[1] < this.dimensions && nextCoords[1] >= 0) {
            // If hit own body
            if(this.snake.contains(nextCoords[0], nextCoords[1])) {
                // end game
                this.gameOver();
                return;
            }
            // If found item
            else if(this.itemCoordinates[0] === nextCoords[0] && this.itemCoordinates[0] === nextCoords[1]) {
                // add to head but dont remove tail
                this.addSnake(nextCoords[0], nextCoords[1]);
                this.addRandomItem();
            }
            // Move to open space
            else {
                this.addSnake(nextCoords[0], nextCoords[1]);
                this.removeSnake();
            }
        }
        // Hit wall
        else {
            this.gameOver();
        }
    }
}

class LinkedList {
    constuctor() {
        this.head = null;
        this.tail = null;
        this.size = 0;
    }

    // Adds node to HEAD
    add(x, y) {
        let node = new Node(x, y);
        if(this.head != null) {
            this.head.previous = node;
            node.next = this.head;
        }
        else {
            this.tail = node;
        }
        this.head = node;
        this.size++;
    }

    // Removes node from TAIL
    remove() {
        if(this.tail != null) {
            let removedNode = this.tail;

            if(this.tail == this.head) {
                this.head = null;
                this.tail = null;
            }
            else {
                this.tail = removedNode.previous;
                this.tail.next = null;
            }
            this.size--;
            return removedNode;
        }
        return null;
    }

    contains(x, y) {
        let currNode = head;
        while(currNode != null) {
            if(currNode.x == x && currNode.y == y) {
                return true;
            }
        }
        return false;
    }
}

class Node {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.next = null;
        this.previous = null;
    }
}