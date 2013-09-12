/*** DEBUG ***/
const DEBUG_STATE = false;
const DEBUG_SIMON = false;
const DEBUG_PLAYER = false;
const DEBUG_MOUSE_DOWN = false;
const DEBUG_MOUSE_UP = false;
const DEBUG_WAIT_INTERVAL = false;
const DEBUG_HIGHLIGHT_INTERVAL = false;
const DEBUG_TITLE = false;
const DEBUG_MENU_STATE = true;

window.addEventListener('load', eventWindowLoaded, false);

function eventWindowLoaded() {
	canvasApp();
}

function canvasSupport() {
  	return Modernizr.canvas;
}

function canvasApp() {

	if (!canvasSupport()) {
			 return;
  	} else {
	    var theCanvas = document.getElementById('canvas');
	    var context = theCanvas.getContext('2d');
	    context.textBaseline = "middle";
	}
		
	// Application event listeners	
	theCanvas.addEventListener("mousedown", eventMouseDown, false);		
	theCanvas.addEventListener("mouseup", eventMouseUp, false);

	// Application states
	const STATE_RESET = 0;
	const STATE_SIMON_WAIT = 10;
	const STATE_SIMON_PUSH = 20;
	const STATE_SIMON_DISPLAY = 30;
	const STATE_PLAYER_TURN = 40;
	const STATE_PLAYER_WAIT = 50;
	const STATE_GAME_OVER = 60;
	const STATE_TITLE = 70;
	const STATE_MENU = 80;
	
	// Colors
	const RED = 0;	
	const YELLOW = 10;
	const GREEN = 20;
	const BLUE = 30;
	
	// Other Game Constants
	const DECAY_CONST = 0.9124435
	
	// Menu states
	const MENU_RULES = 0;
	const MENU_ABOUT = 10;
	const MENU_HIGH_SCORES = 20;
	const MENU_NONE = 30;
	
	// Game variables
	var gameState = STATE_TITLE;
	var menuState = MENU_NONE;
	var mouseX = -1;
	var mouseY = -1;
	var simonColors = new Array();
	var colorIndex = 0;
	var playerColors = new Array();
	var highlightInterval = 20;
	var minHighlightInterval = 10;
	var highlightTimer = highlightInterval;
	var waitInterval = 5;
	var minWaitInterval = 2;
	var waitTimer = waitInterval;
	var colorHighlighted = false;
	var colorArray = ['#DD0000','#DDDD00','#00DD00','#0000DD'];
	var titleColorIndex = 0;
	var titleInterval = 50;
	var titleTimer = titleInterval;
	
	function resetGame() {
		simonColors = new Array();
		colorIndex = 0;
		gameState = STATE_TITLE;
	}
	
	// Shows a flashy title until the user clicks somewhere on the canvas 
	// at which point gameState is set to STATE_MENU.
	function showTitle() {
		if (mouseX > 0 && mouseY > 0)
			gameState = STATE_MENU;
		
		var title = "Simon Says";
		context.font = "40px Plaster";
		var titleLen = context.measureText(title).width;
		var titleX = theCanvas.width/2-titleLen/2;
		var titleY = theCanvas.height*0.4;
		var caption = "Click anywhere to begin!";
		context.font = "20px Tahoma";
		var captionLen = context.measureText(caption).width;
		var captionX = theCanvas.width/2-captionLen/2;
		var captionY = theCanvas.height*0.6;
		
		
		var bgColor = colorArray[titleColorIndex];
		var titleColor = colorArray[(titleColorIndex+1)%4];
		var captionColor = colorArray[(titleColorIndex+2)%4];
		
		if (titleTimer <= 0) {
			titleColorIndex = (titleColorIndex+1)%4;
			titleTimer = titleInterval;
		}
		else
			--titleTimer;
		
		// Draw background
		context.fillStyle = bgColor;
		context.fillRect(0, 0, theCanvas.width, theCanvas.height);
		// Draw title
		context.fillStyle = titleColor;
		context.font = "40px Plaster";
		context.fillText(title, titleX, titleY);
		// Draw caption
		context.fillStyle = captionColor;
		context.font = "20px Tahoma";
		context.fillText(caption, captionX, captionY);
		
		/*** DEBUG ***/
		if (DEBUG_TITLE) {
			console.log("bgColor: "+bgColor);
			console.log("titleColor: "+titleColor);
			console.log("captionColor: "+captionColor);
			console.log("titleColorIndex: "+titleColorIndex);
		}
	}
	
	// 
	function showMenu() {
		/*** DEBUG ***/
		if (DEBUG_MENU_STATE) {
			switch(menuState) {
			case MENU_NONE:
				console.log("MENU_NONE");
				break;
			case MENU_ABOUT:
				console.log("MENU_ABOUT");
				break;
			case MENU_RULES:
				console.log("MENU_RULES");
				break;
			case MENU_HIGH_SCORES:
				console.log("MENU_HIGH_SCORES");
				break;
			}			
		}

		switch(menuState) {
		case MENU_NONE:
			showMainMenu();
			break;
		case MENU_ABOUT:
			showAbout();
			break;
		case MENU_RULES:
			showRules();
			break;
		case MENU_HIGH_SCORES:
			showHighScores();
			break;
		}
	}
	
	function showMainMenu() {
		drawColors('none');

		context.font = "30px Plaster";
		var playW = context.measureText("Play").width;
		var rulesW = context.measureText("Rules").width;
		var scoreW = context.measureText("Scores").width;
		var aboutW = context.measureText("About").width;

		var playX = theCanvas.width*0.25 - playW*0.5;
		var playY = theCanvas.height*0.25;
		var rulesX = theCanvas.width*0.75 - rulesW*0.5;
		var rulesY = theCanvas.height*0.25;
		var scoreX = theCanvas.width*0.25 - scoreW*0.5;
		var scoreY = theCanvas.height*0.75;
		var aboutX = theCanvas.width*0.75 - aboutW*0.5;
		var aboutY = theCanvas.height*0.75;

		context.fillStyle = '#CCCC00';
		context.fillText("Play", playX, playY);
		context.fillStyle = '#00CC00';
		context.fillText("Rules", rulesX, rulesY);
		context.fillStyle = '#0000CC';
		context.fillText("Scores", scoreX, scoreY);
		context.fillStyle = '#CC0000';
		context.fillText("About", aboutX, aboutY);
	}
	
	function showAbout() {
	
	}
	
	function showRules() {
	
	}
	
	function showHighScores() {
	
	}
	
	// Implements a pause between displaying picks of the same color so that the player
	// can distinguish that there are multiple picks.
	function simonWait() {
		if (waitTimer <= 0) {
			waitTimer = (waitInterval-minWaitInterval)
				*Math.pow(DECAY_CONST, simonColors.length)+minWaitInterval;
			drawColors('off');
			gameState = STATE_SIMON_DISPLAY;

			/*** DEBUG ***/
			if (DEBUG_WAIT_INTERVAL)
				console.log("waitTimer: "+waitTimer);
		}
		else {
			--waitTimer;
			drawColors('off');
		}
	}

	// Pushes a random color to simonColors
	function simonPush() {
		simonColors.push(getRandColor());
		gameState = STATE_SIMON_DISPLAY;
	}


	// Displays each color in simonColors highlighted for a short period (as determined by
	// highlightInterval).
	function simonDisplay() {
		if (highlightTimer > 0 && colorIndex < simonColors.length) {
			--highlightTimer;
			drawColors();
		}
		else if (colorIndex < simonColors.length) {
			++colorIndex;
			highlightTimer = (highlightInterval-minHighlightInterval)
				*Math.pow(DECAY_CONST, simonColors.length)+minHighlightInterval;
			gameState = STATE_SIMON_WAIT;

			/*** DEBUG ***/
			if (DEBUG_HIGHLIGHT_INTERVAL) {
				console.log("highlightTimer: "+highlightTimer);
				console.log("simonColors.length: "+simonColors.length);
			}
		}
		else {
			resetMouse();
			gameState = STATE_PLAYER_WAIT;
			drawColors();
			colorIndex = 0;
		}

		/*** DEBUG ***/
		if (DEBUG_SIMON) {
			console.log("highLightTimer: "+highlightTimer);
			console.log("colorIndex: "+colorIndex);
			console.log("simonColors[colorIndex]: "+simonColors[colorIndex]);
			console.log("simonColors: "+simonColors);
		}
	}
	
	// playerTurn() pushes player's color choice to playerColors and checks it against 
	// the color at simonColors[colorIndex]. If the colors are the same and we have not 
	// reached the end of simonColors, we again wait for player input, and if the colors
	// do not match, it's game over... man.
	function playerTurn() {
		playerColors.push(getColorPicked());
		
		/*** DEBUG ***/
		if (DEBUG_PLAYER) {
			console.log("colorIndex: "+colorIndex);
			console.log("playerColors[colorIndex]: "+playerColors[colorIndex]);
			console.log("simonColors[colorIndex]: "+simonColors[colorIndex]);
			console.log("playerColors: "+playerColors);
		}

		if (playerColors.length >= simonColors.length && playerColors[colorIndex] == simonColors[colorIndex]) {
			playerColors = new Array();
			colorIndex = 0;
			gameState = STATE_SIMON_PUSH;
		}
		else if (playerColors[colorIndex] == simonColors[colorIndex]) {
			++colorIndex;
			resetMouse();
			gameState = STATE_PLAYER_WAIT;
		}
		else 
			gameState = STATE_GAME_OVER;
	}

	// Sets mouseX and mouseY to (-1,-1) to simplify hit testing.
	// Should be called before switching to STATE_PLAYER_WAIT
	function resetMouse() {
		mouseX = -1;
		mouseY = -1;
	}
	
	// Waits for mouse clicks on the canvas.
	function playerWait() {
		if (mouseX >= 0 && mouseY >= 0) {
			gameState = STATE_PLAYER_TURN;
		} 
	}
	
	function getColorPicked() {
		var colorPicked = RED;
		if (mouseX > theCanvas.width/2 && mouseY < theCanvas.height/2)
			colorPicked = BLUE;
		else if (mouseX < theCanvas.width/2 && mouseY > theCanvas.height/2)
			colorPicked = GREEN;
		else if (mouseX > theCanvas.width/2 && mouseY > theCanvas.height/2)
			colorPicked = YELLOW;
		return colorPicked;
	}
	
	function gameOver() {
		context.fillStyle = '#000000';
		context.font = "20px Verdana";
		var text = "GAME OVER";
		context.fillText(text, 200,200);
	}
	
	/*function drawBox() {
		// Box
		context.fillStyle = '#000000';
		context.fillRect(0,0,theCanvas.width,theCanvas.height);
		
	}*/
	
	// drawColors determines which color to highlight and draws the rest a darker shade. 
	// If called as drawColors('off') no colors will be highlighted, as drawColors('red') 
	// the red square will be highlighted, as drawColors() the color at simonColors[colorIndex]
	// will be highlighted.
	function drawColors(color) {
		// Default color to 'none'.
		color = typeof color !== 'undefined' ? color : 'none'; 
		
		// Box
		context.fillStyle = '#000000';
		context.fillRect(0,0,theCanvas.width,theCanvas.height);
		
		var tempRed = '#B20000';
		var tempYellow = '#B2B200';
		var tempGreen = '#00B200';
		var tempBlue = '#0000B2';
		
		if (color != 'off') {
			if (color == 'none')
				var tempColor = simonColors[colorIndex];
			else
				var tempColor = color;
			switch (tempColor) {
			case RED:
				tempRed = '#FF0000';
				break;
			case YELLOW:
				tempYellow = '#FFFF00';
				break;
			case GREEN:
				tempGreen = '#00FF00';
				break;
			case BLUE:
				tempBlue = '#0000FF';
				break;
			}
		}  
		
		context.fillStyle = tempRed; // Red
		context.fillRect(0,0,theCanvas.width/2,theCanvas.height/2);
		context.fillStyle = tempYellow; // Yellow
		context.fillRect(theCanvas.width/2,theCanvas.height/2,theCanvas.width/2,theCanvas.height/2);
		context.fillStyle = tempGreen; // Green
		context.fillRect(0,theCanvas.height/2,theCanvas.width/2,theCanvas.height/2);
		context.fillStyle = tempBlue; // Blue
		context.fillRect(theCanvas.width/2,0,theCanvas.width/2,theCanvas.height/2);
	}
	
	// Randomly generates and returns a color.
	function getRandColor() {
		var color = RED;
		var randNum = Math.floor(Math.random()*4);
		switch(randNum) {
		case 0:
			color = YELLOW;
			break;
		case 1:
			color = GREEN;
			break;
		case 2:
			color = BLUE;
			break;
		case 3:
			color = RED;
			break;
		}
		return color;
	}

	function eventMouseDown(e) {
	    if(e.offsetX) {
	        mouseX = e.offsetX;
	        mouseY = e.offsetY;
	    }
		else if (e.layerX) {
	        mouseX = e.layerX;
	        mouseY = e.layerY;
		}
		if (gameState == STATE_PLAYER_WAIT && !colorHighlighted) {
			drawColors(getColorPicked());
			colorHighlighted = true;
		}

		/*** DEBUG ***/
		if (DEBUG_MOUSE_DOWN)
			console.log("("+mouseX+", "+mouseY+")");
	}

	function eventMouseUp(e) {
		if (colorHighlighted) {
			drawColors('off');
			colorHighlighted = false;
		}
		/*** DEBUG ***/
		if (DEBUG_MOUSE_UP)
			console.log("("+mouseX+", "+mouseY+")");		
	}
	
	function run() {
		/*** DEBUG ***/
		if (DEBUG_STATE) {
			switch(gameState) {
			case STATE_PLAYER_WAIT:
				console.log("STATE_PLAYER_WAIT");
				break;
			case STATE_SIMON_WAIT:
				console.log("STATE_SIMON_WAIT");
				break;
			case STATE_RESET:
				console.log("STATE_RESET");
				break;
			case STATE_SIMON_PUSH:
				console.log("STATE_SIMON_PUSH");
				break;
			case STATE_SIMON_DISPLAY:
				console.log("STATE_SIMON_DISPLAY");
				break;
			case STATE_PLAYER_TURN:
				console.log("STATE_PLAYER_TURN");
				break;
			case STATE_GAME_OVER:
				console.log("STATE_GAME_OVER");
				break;
			case STATE_TITLE:
				console.log("STATE_TITLE");
				break;
			case STATE_MENU:
				console.log("STATE_MENU");
				break;
			}
		}	
		switch(gameState) {
		case STATE_PLAYER_WAIT:
			playerWait();
			break;
		case STATE_SIMON_WAIT:
			simonWait();
			break;
		case STATE_RESET:
			resetGame();
			break;
		case STATE_SIMON_PUSH:
			simonPush();
			break;
		case STATE_SIMON_DISPLAY:
			simonDisplay();
			break;
		case STATE_PLAYER_TURN:
			playerTurn();
			break;
		case STATE_GAME_OVER:
			gameOver();
			break;
		case STATE_TITLE:
			showTitle();
			break;
		case STATE_MENU:
			showMenu();
			break;
		}
	}
		
	// Application Loop
	const FPS = 30;
	var intervalTime = 1000/FPS;
	
	function gameLoop() {
		window.setTimeout(gameLoop, intervalTime);
		run();
	}
	
	gameLoop();
}