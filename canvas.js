var canvas;
var context;
var difficulty = 'difficulty-0';
var speeds = [150, 100, 50];
var game;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

$(document).ready( () => {
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
            game.changeDirection('left');
        },
        swipeUp:function(event, distance, duration, fingerCount, fingerData, currentDirection) {
            game.changeDirection('up');
        },
        swipeRight:function(event, distance, duration, fingerCount, fingerData, currentDirection) {
            game.changeDirection('right');
        },
        swipeDown:function(event, distance, duration, fingerCount, fingerData, currentDirection) {
            game.changeDirection('down');
        }
    });

    // Arrow key input
    $(document).keydown( (e) => {
        switch(e.keyCode) {
            case 37: 
            // Left
            game.changeDirection('left');
            break;

            case 38: 
            // Up
            game.changeDirection('up');
            break;

            case 39: 
            // Right
            game.changeDirection('right');
            break;

            case 40: 
            // Down
            game.changeDirection('down');
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
        this.dimensions = 20;
        this.model = [];
        this.openSpaces = [];
        this.snake = new LinkedList();
        this.itemCoordinates = [];
        this.isLive = false;
        this.lastDirection = 'right';
        this.direction = 'right';
        this.score = 0;
        this.scoreElement = '#score';
        this.context = document.getElementById('my-canvas').getContext('2d');
        this.canvasUnit = document.getElementById('my-canvas').width / this.dimensions;
        this.overlay = '#canvas-overlay';

        for(let i=0; i<this.dimensions; i++) {
            this.model.push(new Array(this.dimensions).fill(0));
        }

        for(let i=0; i<this.dimensions; i++) {
            for(let j=0; j<this.dimensions; j++) {
                this.openSpaces.push([i, j]);
            }
        }
    }

    init() {
        this.clearCanvas();

        //console.log(`Open Spaces: ${this.openSpaces.length}`);
        
        this.addSnake(Math.floor(this.dimensions / 2), 0);
        this.addSnake(Math.floor(this.dimensions / 2), 1);
        this.addSnake(Math.floor(this.dimensions / 2), 2);
        this.addSnake(Math.floor(this.dimensions / 2), 3);
        this.addRandomItem();
        this.play();
    }

    async play() {
        await $(this.scoreElement).text(this.score);
        this.isLive = true;
        
        while(this.isLive) {
            //console.log('Move');
            await this.move();
            await sleep(this.speed);
        }

        console.log('Game Over');
    }

    gameOver() {
        this.isLive = false;
        $(this.overlay).css('display', 'flex')
    }

    clearCanvas() {
        this.context.fillStyle = 'rgb(0, 0, 0)';
        this.context.fillRect(0, 0, this.canvasUnit * this.dimensions, this.canvasUnit * this.dimensions);
    }

    changeDirection(dir) {
        if (this.lastDirection === 'left' || this.lastDirection === 'right') {
            if(dir === 'up' || dir === 'down') {
                this.direction = dir;
            }
        }
        else if (this.lastDirection === 'up' || this.lastDirection === 'down') {
            if(dir === 'left' || dir === 'right') {
                this.direction = dir;
            }
        }
    }

    addSnake(x, y) {
        this.model[x][y] = 1;
        this.snake.add(x, y);
        this.removeOpenSpace(x, y);
        this.drawSnake(x, y);
    }

    removeSnake() {
        let node = this.snake.remove();
        if(node != null) {
            this.model[node.x][node.y] = 0;
            this.addOpenSpace(node.x, node.y);
            this.undrawSnake(node.x, node.y)
        }
    }

    addOpenSpace(x, y) {
        this.openSpaces.push([x,y]);
    }

    removeOpenSpace(x, y) {
        for(let i=0; i<this.openSpaces.length; i++) {
            if(this.openSpaces[i][0] === x && this.openSpaces[i][1] === y) {
                this.openSpaces.splice(i, 1);
                return;
            }
        }
    }

    addRandomItem() {
        let randomIndex = Math.floor(Math.random() * this.openSpaces.length);
        this.itemCoordinates = this.openSpaces[randomIndex];
        this.model[this.itemCoordinates[0]][this.itemCoordinates[1]] = 2;
        this.removeOpenSpace(this.itemCoordinates[0], this.itemCoordinates[1]);
        this.drawItem(this.itemCoordinates[0], this.itemCoordinates[1]);
    }

    removeRandomItem() {
        this.model[this.itemCoordinates[0]][this.itemCoordinates[1]] = 0;
        this.addOpenSpace(this.itemCoordinates[0], this.itemCoordinates[1]);
        this.undrawItem(this.itemCoordinates[0], this.itemCoordinates[1]);
    }

    async move() {
        let nextCoords = [];
        if(this.direction === 'up') {
            this.lastDirection = 'up';
            nextCoords = [this.snake.head.x - 1, this.snake.head.y];
        }
        else if(this.direction === 'left') {
            this.lastDirection = 'left';
            nextCoords = [this.snake.head.x, this.snake.head.y-1];
        }
        else if(this.direction === 'right') {
            this.lastDirection = 'right';
            nextCoords = [this.snake.head.x, this.snake.head.y+1];
        }
        else if(this.direction === 'down') {
            this.lastDirection = 'down';
            nextCoords = [this.snake.head.x+1, this.snake.head.y];
        }

        //console.log(this.direction);

        // If next move is within bounds
        if(nextCoords[0] < this.dimensions && nextCoords[0] >= 0 && nextCoords[1] < this.dimensions && nextCoords[1] >= 0) {
            //console.log('Move is inbounds');
            // If hit own body
            if(this.snake.contains(nextCoords[0], nextCoords[1])) {
                // end game
                console.log('Move: Hit tail');
                await this.gameOver();
                return;
            }
            // If found item
            else if(this.itemCoordinates[0] === nextCoords[0] && this.itemCoordinates[1] === nextCoords[1]) {
                // add to head but dont remove tail
                console.log('Move: Found item');
                await this.removeRandomItem(nextCoords[0], nextCoords[1]);
                await this.addSnake(nextCoords[0], nextCoords[1]);
                await this.addRandomItem();
                this.score++;
                await $(this.scoreElement).text(this.score);
            }
            // Move to open space
            else {
                //console.log('Move: Open space');
                await this.addSnake(nextCoords[0], nextCoords[1]);
                await this.removeSnake();
            }
        }
        // Hit wall
        else {
            console.log('Move: Hit wall');
            await this.gameOver();
        }
    }

    drawSnake(x, y) {
        this.context.fillStyle = 'rgb(250, 250, 250)';
        this.context.fillRect(y * this.canvasUnit, x * this.canvasUnit, this.canvasUnit, this.canvasUnit);
    }

    undrawSnake(x, y) {
        this.context.clearRect(y * this.canvasUnit, x * this.canvasUnit, this.canvasUnit, this.canvasUnit);
    }

    drawItem(x, y) {
        this.context.fillStyle = 'rgb(177, 0, 0)';
        this.context.fillRect(y * this.canvasUnit, x * this.canvasUnit, this.canvasUnit, this.canvasUnit);
    }

    undrawItem(x, y) {
        this.context.clearRect(y * this.canvasUnit, x * this.canvasUnit, this.canvasUnit, this.canvasUnit);
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
        let currNode = this.head;
        while(currNode != null) {
            if(currNode.x == x && currNode.y == y) {
                return true;
            }
            currNode = currNode.next;
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