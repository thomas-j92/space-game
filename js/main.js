// global variables
var enemy_canvas;				// used to store canvas
var bullets_canvas;				// used to store canvas
var player_canvas;				// used to store canvas
var e_ctx;						// context - 2d
var b_ctx;						// context - 2d
var p_ctx;						// context - 2d

// ship settings
var ship;						// stores ship details
var ship_width 			= 60;   // width of ship
var ship_height 		= 15;   // height of ship
var nose_width 			= 12; 	// width of ship nose
var nose_height 		= 35;   // height of ship nose
var ship_speed 			= 10;	// stores speed of ship
var bullet_speed 		= 4;	// how fast ship fires

var elements 			= []; 	// all elements on screen (ships - lasers are stored seperately)
var lasers 				= [];  	// all lasers on screen
var lasers_max			= 3;  	// how many lasers they can fire at once - keeps page speeds down
var lasers_available	= 3;	// how many lasers they can fire currently
var enemies 			= [];
var enemies_ship_speed 	= 1; 
var enemies_per_row 	= 0;
var level 				= 5;

var isFiring 			= false;
var movingEnemies 		= true; 		


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
	var window_spacing 	= 10; // how much space should be between ship & screen
	var starting_x 		= window_spacing;
	var starting_y 		= (p_ctx.canvas.height - ship_height) - window_spacing; // minus height + spacing - otherwise it'll show below users viewport
	ship 				= new Ship(starting_x, starting_y, ship_width, ship_height, 1, '000', true); // create Ship object
	elements.push(ship); // add to array - used by drawCanvas to draw all objects

	//setUpAnimations();

	//setUpLevel();

	drawCanvas(); // wipes canvas clean and re-populates using various arrays (var lasers, elements etc)
}

function setUpAnimations() {
	setInterval(function() {
		// if anything is currently firing, loop through each laser and move them
		if(isFiring) {
			console.log('firing');
			$.each(lasers, function() {
				var laser = $(this)[0];

				// gradually move laser closer to final destination 
				if(laser.y < laser.endY) { // shoot downwards
					laser.y++;
				} else { // shoot upwards
					laser.y-=bullet_speed;
				}

				if(laser.y == laser.endY) { // if laser has reached end of maxY, remove it
					laser.remove(); // remove laser from canvas
				}

				// check if bullet has set any enemies, if it has, remove laser and enemy
				$.each(enemies, function() {
					var this_enemy = $(this)[0];

					if(laser.y < (this_enemy.y + this_enemy.height) && laser.y > (this_enemy.y) && laser.x < (this_enemy.x + this_enemy.width) && laser.x > this_enemy.x) {
						laser.remove();
						this_enemy.die();
					}
				});

				// if no lasers are firing, stop this from running (until another laser is fired)
				if(lasers.length == 0) {
					isFiring = false;
				}
			})
		}

		if(movingEnemies) {
			// if not set before, make enemies go left
			if(typeof enemyDirection == 'undefined') {
				enemyDirection = 'right';
			}

			//console.log(enemyDirection);

			//var enemy_at_end = enemies[enemies_per_row-1];

			// enemies[enemy_id].x += enemies_ship_speed;
			var enemy_at_end_index 	= false;
			var current_row 		= 0;
			$.each(enemies, function() {
				var e = $(this)[0];

				if(current_row == 0) {
					current_row = e.y;
				}

				if(current_row != e.y) {
					return false; 
				}

				enemy_at_end_index++;
			});

			//console.log(enemy_at_end);
			var enemy_at_end = enemies[enemy_at_end_index-1];

			var add_row = false;
			if((enemy_at_end.x + enemies_ship_speed + enemy_at_end.width) > enemy_canvas.width) {
				enemyDirection = 'left';
				// enemy_at_end.y += 10;
				add_row = true;
			}
			if((enemies[0].x - enemies_ship_speed) <= 0) {
				enemyDirection = 'right';

				add_row = true;
				// enemy_at_end.y += 10;
			}

			$.each(enemies, function() {
				var enemy = $(this)[0];

				if(add_row) {
					enemy.y += 10;
				}

				// make enemies go left
				if(enemyDirection == 'left') { 
					enemy.x -= enemies_ship_speed;	
				} else { // make enemies go right
					enemy.x += enemies_ship_speed;
				}

				// if((enemy.x + enemies_ship_speed) > enemy_canvas.width) {
				// 	enemyDirection = "right";
				// 	enemy.y += 10;
				// }
				// if((enemy.x - enemies_ship_speed) < 0) {
				// 	enemyDirection = "left";
				// 	enemy.y += 10;
				// }
				
			});

		}

		drawCanvas();
	}, 1);
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
			enemies_per_row = (enemies.length + 1); // store current number of enemies - so we know how many enemies their are per line
			enemy_x 		= enemy_starting_x;
			enemy_y 		= (enemy.y + enemy.height + enemy_y_pad);
		}

		enemy.store();
	}
}

function drawShip(element) {	
	p_ctx.lineWidth	= element.border;

	if(element.fill) { // fill element with a color if fill set to true
		// ship body
		p_ctx.fillStyle = "#"+ element.color;
		p_ctx.fillRect(element.x,element.y,element.width,element.height);

		// make nose of ship
		var nose_x 		= element.x + (element.width/2) - (nose_width/2);
		var nose_y 		= element.y - nose_height;
		p_ctx.fillRect(nose_x, nose_y, nose_width, nose_height);

		// make nose rounded
		var radius = nose_width/2;
		var rounded_x = nose_x + (nose_width/2);
		var rounded_y = nose_y;
		p_ctx.beginPath();
		p_ctx.arc(rounded_x, rounded_y, radius, 0, 2 * Math.PI, false);
		p_ctx.fill();

		// left shooter connection of wings
		var connect_padding = 3;
		var connect_x 		= element.x - connect_padding;
		var connect_y 		= element.y - connect_padding;
		var connect_width	= 6;
		var connect_height 	= element.height + (connect_padding);
		p_ctx.strokeStyle 	= 'gray';
		p_ctx.lineWidth		= 2;
		p_ctx.strokeRect(connect_x, connect_y, connect_width, connect_height); // use to create outline 
		p_ctx.fillRect(connect_x, connect_y, connect_width, connect_height);

		// left laser shooter
		var shooter_width 	= 3;
		var shooter_height 	= element.height + (nose_height*0.75);
		var shooter_x 		= connect_x + (connect_width/2) - (shooter_width/2);
		var shooter_y 		= nose_y + (nose_height * 0.25);
		p_ctx.fillRect(shooter_x, shooter_y, shooter_width, shooter_height);
		// left shooter detail
		var detail_indent 	= 1;
		var detail_width 	= shooter_width + (detail_indent*2);
		var detail_height 	= 2;
		var detail_x 		= shooter_x - detail_indent;
		var detail_y 		= shooter_y + (shooter_height*0.15);
		p_ctx.fillRect(detail_x, detail_y, detail_width, detail_height);
		
		// right connection
		connect_x = element.x + element.width - connect_padding;
		p_ctx.strokeRect(connect_x, connect_y, connect_width, connect_height); // use to create outline 
		p_ctx.fillRect(connect_x, connect_y, connect_width, connect_height);

		// right shooter
		shooter_x = element.x + element.width - (shooter_width/2);
		p_ctx.fillRect(shooter_x, shooter_y, shooter_width, shooter_height);
		// right shooter detail
		detail_x = shooter_x - detail_indent;
		p_ctx.fillRect(detail_x, detail_y, detail_width, detail_height);

		// left engine
		var engine_width 	= 7;
		var engine_padding 	= (nose_height*0.1);
		var engine_height 	= element.height + (engine_padding*2);
		var engine_x 		= nose_x - engine_width;
		var engine_y 		= element.y - engine_padding;
		p_ctx.strokeRect(engine_x, engine_y, engine_width, engine_height); // use to create outline 
		p_ctx.fillRect(engine_x, engine_y, engine_width, engine_height);

		// right engine
		engine_x = nose_x + nose_width;
		p_ctx.strokeRect(engine_x, engine_y, engine_width, engine_height); // use to create outline 
		p_ctx.fillRect(engine_x, engine_y, engine_width, engine_height);

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

			isFiring = true; // animations check for this variable - will cause animations to run
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
	};
	this.die 	= function() {
		//remove from array so it's not added again
		var i = enemies.indexOf(this);
		if(i != -1) {
			enemies.splice(i, 1);
			console.log(enemies);
		}

		if(enemies.length == 0) {
			level++;
			setUpLevel();

		}
	};
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
	// $.each(lasers, function() {
	// 	var element = $(this)[0];
	// 	drawLaser(element);
	// });
	// $.each(enemies, function() {
	// 	var element = $(this)[0];
	// 	element.draw();
	// });		
}