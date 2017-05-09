// global variables
var enemy_canvas;				// used to store canvas
var bullets_canvas;				// used to store canvas
var player_canvas;				// used to store canvas
var e_ctx;						// context - 2d
var b_ctx;						// context - 2d
var p_ctx;						// context - 2d
var ship;						// stores ship details
var ship_speed 			= 10;	// stores speed of ship
var bullet_speed 		= 3;	// how fast ship fires
var elements 			= []; 	// all elements on screen (ships - lasers are stored seperately)
var lasers 				= [];  	// all lasers on screen
var lasers_max			= 3;  	// how many lasers they can fire at once - keeps page speeds down
var lasers_available	= 3;	// how many lasers they can fire currently
var enemies 			= [];
var enemies_ship_speed 	= 5; 
var level 				= 20;


$(function() {
	startGame();

	// move ship when key is pressed - ensuring correct keys are pressed
	$(document).on('keydown', function(e) {
		moveShip(e);
	})
});

function startGame() {
	// setup canvases & dashbaord
	enemy_canvas 				= $('#enemies')[0];
	bullets_canvas 				= $('#bullets')[0];
	player_canvas 				= $('#player')[0];
	e_ctx 						= enemy_canvas.getContext("2d");
	b_ctx 						= bullets_canvas.getContext("2d");
	p_ctx 						= player_canvas.getContext("2d");

	e_ctx.canvas.width  	= window.innerWidth * 0.8;
	$('#enemies').width		= window.innerWidth * 0.2;
  	e_ctx.canvas.height 	= window.innerHeight;
  	$('#enemies').height(window.innerHeight);
  	b_ctx.canvas.width  	= window.innerWidth * 0.8;
	$('#bullets').width		= window.innerWidth * 0.2;
  	b_ctx.canvas.height 	= window.innerHeight;
  	$('#bullets').height(window.innerHeight);
  	p_ctx.canvas.width  	= window.innerWidth * 0.8;
	$('#player').width		= window.innerWidth * 0.2;
  	p_ctx.canvas.height 	= window.innerHeight;
  	$('#player').height(window.innerHeight);

  	updateLaserCount(lasers_available);

  	// create your ship
	var ship_width 		= 30; // width of ship
	var ship_height 	= 10; // height of ship
	var window_spacing 	= 10; // how much space should be between ship & screen
	var starting_x 		= window_spacing;
	var starting_y 		= (p_ctx.canvas.height - ship_height) - window_spacing; // minus height + spacing - otherwise it'll show below users viewport
	ship 				= new Ship(starting_x, starting_y, ship_width, ship_height, 1, '000', true); // create Ship object
	elements.push(ship); // add to array - used by drawCanvas to draw all objects

	setUpLevel();

	drawCanvas(); // wipes canvas clean and re-populates using various arrays (var lasers, elements etc)
}

function setUpLevel() {
	$('#level').text(level);

	// create enemies and store in array
	var num_of_enemies = (level*2);
	var enemy_starting_x 	= 20;
	var enemy_x 			= enemy_starting_x;
	var enemy_y 			= 20;
	var enemy_x_pad 		= 5;
	var enemy_y_pad			= 10;
	for(var i=1; i<=num_of_enemies; i++) {
		var enemy = new Enemy(enemy_x, enemy_y);

		enemy_x += (enemy.width + enemy_x_pad);

		// if the new X coord overlaps the boundary of the canvas, add to new row
		if((enemy_x+enemy.width) > enemy_canvas.width) {
			enemy_x 	= enemy_starting_x;
			enemy_y 	= (enemy.y + enemy.height + enemy_y_pad);
		}

		enemy.store();
	}
}

function drawShip(element) {	
	p_ctx.lineWidth	= element.border;

	if(element.fill) { // fill element with a color if fill set to true
		p_ctx.fillStyle = "#"+ element.color;
		p_ctx.fillRect(element.x,element.y,element.width,element.height);
	} else { //otherwise, dont fill
		p_ctx.strokeRect(element.x,element.y,element.width,element.height);
	}
}

function drawLaser(element) {
	b_ctx.beginPath();
	b_ctx.arc(element.x, element.y, element.size, 0, 2*Math.PI);
	b_ctx.stroke();
}

function updateLaserCount(number_available) {
	lasers_available = number_available;
	$('#available_bullets').text(number_available);
}

function Ship(x, y, width, height, border, color, fill) {
	this.id 	= elements.length;
	this.x 		= x;
	this.y 		= y;
	this.width 	= width;
	this.height = height;
	this.border = border;
	this.color 	= color; 
	this.fill 	= fill;
	this.shoot 	= function() { // fires a laser
		if(lasers_available > 0) { // only shoot if you've got lasers to shoot
			var startX = this.x + (this.width/2); // shoot from middle of ship 
			var startY = this.y;
			var laser 	= new Laser(startX, startY, 0); // create new Laser object
			lasers.push(laser); // add to laser array
			updateLaserCount(lasers_available-1); // update laser count
		
			var firing_animation = setInterval(function() {
				// gradually move laser closer to final destination 
				if(laser.y < laser.endY) { //shoot downwards
					laser.y++;
				} else { //shoot upwards
					laser.y-=bullet_speed;
				}

				if(laser.y == laser.endY) { //if laser has reached end of maxY, remove it
					clearInterval(firing_animation); //stop animation from running
					laser.remove(); //remove laser from canvas
				}

				$.each(enemies, function() {
					var this_enemy = $(this)[0];

					if(laser.y < (this_enemy.y + this_enemy.height) && laser.y > (this_enemy.y) && laser.x < (this_enemy.x + this_enemy.width) && laser.x > this_enemy.x) {
						laser.remove();
						clearInterval(firing_animation); //stop animation from running
						this_enemy.die();
					}
				});

				drawCanvas();
			}, 1);
		}
	};
}

function Laser(startX, startY, endY) {
	this.id 	= lasers.length;
	this.size 	= 2;
	this.x 		= startX;
	this.y 		= startY;
	this.endY 	= endY;
	this.remove = function() {
		//remove from array so it's not added again
		var i = lasers.indexOf(this);
		if(i != -1) {
			lasers.splice(i, 1);
			updateLaserCount(lasers_available+1); // update laser count
		}
	}
}

function Enemy(x, y) {
	this.id 	= enemies.length;
	this.x 		= x;
	this.y 		= y;
	this.width 	= 100;
	this.height = 10;
	this.store 	= function() {
		enemies.push(this);
	};
	this.draw 	= function() {
		e_ctx.beginPath();
		e_ctx.fillRect(this.x, this.y, this.width, this.height);

		var enemy_id = this.id;
		//console.log(el);
		// setInterval(function() {
		// 	enemies[enemy_id].x += enemies_ship_speed;

		// 	if((enemies[enemy_id].x + enemies_ship_speed) > enemy_canvas.width) {
		// 		enemies[enemy_id].x = 0;
		// 		enemies[enemy_id].y += 10;
		// 	}

		// 	drawCanvas();
		// }, 1000)
	};
	this.die 	= function() {
		//remove from array so it's not added again
		var i = enemies.indexOf(this);
		if(i != -1) {
			enemies.splice(i, 1);
		}

		if(enemies.length == 0) {
			level++;
			setUpLevel();
		}
	};
	this.move 	= function() {
		
	}
}

function moveShip(e) {
	if (e.keyCode == 37) { //left clicked
		elements[0].x -= ship_speed;
	}
	if (e.keyCode == 38) { //up clicked!
		ship.shoot();
	}
	if (e.keyCode == 39) { //right clicked
		elements[0].x += ship_speed;
	}

	drawCanvas();
}

function drawCanvas() {
	// 'clear' the canvas
	e_ctx.clearRect(0, 0, enemy_canvas.width, enemy_canvas.height);
	p_ctx.clearRect(0, 0, player_canvas.width, player_canvas.height);
	b_ctx.clearRect(0, 0, bullets_canvas.width, bullets_canvas.height);

	// uses arrays that are populated throughout the game to repopulate the canvas 
	$.each(elements, function() {
		var element = $(this)[0];
		drawShip(element);
	});
	$.each(lasers, function() {
		var element = $(this)[0];
		drawLaser(element);
	});
	$.each(enemies, function() {
		var element = $(this)[0];
		element.draw();
	});		
}