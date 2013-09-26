/*** DEBUG ***/
const DEBUG_STATE = false;
const DEBUG_SIMON = false;
const DEBUG_PLAYER = false;
const DEBUG_MOUSE_DOWN = true;
const DEBUG_MOUSE_UP = false;
const DEBUG_MOUSE_MOVE = false;
const DEBUG_WAIT_INTERVAL = false;
const DEBUG_HIGHLIGHT_INTERVAL = false;
const DEBUG_TITLE = false;
const DEBUG_MENU_STATE = false;
const DEBUG_MENU_TEXT = false;

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
	theCanvas.addEventListener("mousemove", eventMouseMove, false);

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
	const MENU_SCORES = 20;
	const MENU_PLAY = 30;
	const MENU_NONE = 40;
	
	// Menu Variables
	var menuHighlight = 'none';

	// Game variables
	var gameState = STATE_TITLE;
	var menuState = MENU_NONE;
	var moveMouseX = -1;
	var moveMouseY = -1;
	var upMouseX = -1;
	var upMouseY = -1;
	var downMouseX = -1;
	var downMouseY = -1;
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
	var playerDisplay = {};
	var playerDisplayInterval = 10;
	
	function resetGame() {
		simonColors = new Array();
		colorIndex = 0;
		gameState = STATE_MENU;
	}
	
	// Shows a flashy title until the user clicks somewhere on the canvas 
	// at which point gameState is set to STATE_MENU.
	function showTitle() {
		if (downMouseX > 0 && downMouseY > 0) {
			resetDownMouse();
			gameState = STATE_MENU;
		}
		
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
	
	// A sub-run() function for organizing menu states.
	function runMenu() {
		/*** DEBUG ***/
		if (DEBUG_MENU_STATE) {
			switch(menuState) {
			case MENU_NONE:
				console.log("MENU_NONE");
				break;
			case MENU_PLAY:
				console.log("MENU_PLAY");
				break;
			case MENU_ABOUT:
				console.log("MENU_ABOUT");
				break;
			case MENU_RULES:
				console.log("MENU_RULES");
				break;
			case MENU_SCORES:
				console.log("MENU_SCORES");
				break;
			}			
		}

		switch(menuState) {
		case MENU_NONE:
			showMenu();
			break;
		case MENU_PLAY:
			gameState = STATE_SIMON_PUSH;
			break;
		case MENU_ABOUT:
			showAbout();
			break;
		case MENU_RULES:
			showRules();
			break;
		case MENU_SCORES:
			showScores();
			break;
		}
	}
	
	function showMenu() {
		context.textAlign = 'left';
		context.font = "30px Plaster";
		var playW = context.measureText("Play").width;
		var rulesW = context.measureText("Rules").width;
		var scoresW = context.measureText("Scores").width;
		var aboutW = context.measureText("About").width;

		var playX = theCanvas.width*0.25 - playW*0.5;
		var playY = theCanvas.height*0.25;
		var rulesX = theCanvas.width*0.75 - rulesW*0.5;
		var rulesY = theCanvas.height*0.25;
		var scoresX = theCanvas.width*0.25 - scoresW*0.5;
		var scoresY = theCanvas.height*0.75;
		var aboutX = theCanvas.width*0.75 - aboutW*0.5;
		var aboutY = theCanvas.height*0.75;

		var tempRed = '#CC0000';
		var tempYellow = '#CCCC00';
		var tempGreen = '#00CC00';
		var tempBlue = '#0000CC';
		var colorsParam = 'none';

		menuHighlight = getMenuOptionPicked('highlight', moveMouseX, moveMouseY);

		switch (menuHighlight) {
		case 'none':
			colorsParam = 'off';
			break;
		case 'play':
			colorsParam = RED;
			tempYellow = '#FFFF00';
			break;
		case 'rules':
			colorsParam = BLUE;
			tempGreen = '#00FF00';
			break;
		case 'scores':
			colorsParam = GREEN;
			tempBlue = '#0000FF';
			break;
		case 'about':
			colorsParam = YELLOW;
			tempRed = '#FF0000';
			break;
		}

		drawColors(colorsParam);
		context.fillStyle = tempYellow;
		context.fillText("Play", playX, playY);
		context.fillStyle = tempGreen;
		context.fillText("Rules", rulesX, rulesY);
		context.fillStyle = tempBlue;
		context.fillText("Scores", scoresX, scoresY);
		context.fillStyle = tempRed;
		context.fillText("About", aboutX, aboutY);

		if (downMouseX >= 0 && downMouseY >= 0) {
			menuState = getMenuOptionPicked('state', downMouseX, downMouseY);
			resetDownMouse();
		}

		/*** DEBUG ***/
		if (DEBUG_MENU_TEXT) {
			console.log("Play: ("+playX+", "+(playY-15)+", "+(playX+playW)+", "+(playY+15)+")");
			console.log("Rules: ("+rulesX+", "+(rulesY-15)+", "+(rulesX+rulesW)+", "+(rulesY+15)+")");
			console.log("Scores: ("+scoresX+", "+(scoresY-15)+", "+(scoresX+scoresW)+", "+(scoresY+15)+")");
			console.log("About: ("+aboutX+", "+(aboutY-15)+", "+(aboutX+aboutW)+", "+(aboutY+15)+")");
		}
	}
	
	function showAbout() {
		var topPadding = 70;
		var sidePadding = 25;
		var textX = theCanvas.width*0.5;
		var textY = topPadding;
		var textW = theCanvas.width-sidePadding*2;
		var lineHeight = 30;
		var text = "Simon Says is a personal project that I used to experiment with the HTML5 Canvas tag and JavaScript. The source can be found at github.com/Bates550/simon-says or in your browser if you're into that sort of thing."
		var backRectColor = '#CC0000';
		var backTextColor = '#CCCC00';
		var buttonW = 70;
		var buttonR = 25;
		var buttonX = theCanvas.width*0.5 - buttonW*0.5 - buttonR;
		var buttonY = theCanvas.height*0.8 - buttonR;
		
		if (areaClicked(buttonX, buttonY, buttonW+50, buttonR*2, moveMouseX, moveMouseY)) {
			backRectColor = '#FF0000';
			backTextColor = '#FFFF00';
		}

		context.fillStyle = '#CCCC00';
		context.fillRect(0, 0, theCanvas.width, theCanvas.height);
		context.font = "18px Tahoma";
		context.fillStyle = '#CC0000';
		context.textAlign = 'center'
		wrapText(context, text, textX, textY, textW, lineHeight);

		context.fillStyle = backRectColor;
		drawButton(context, buttonX, buttonY, buttonR, buttonW);
		context.font = "30px Plaster";
		context.fillStyle = backTextColor;
		context.fillText("Back", theCanvas.width*0.5, theCanvas.height*0.8);

		if (areaClicked(buttonX, buttonY, buttonW+50, buttonR*2, downMouseX, downMouseY)) {
			menuState = MENU_NONE;
			resetDownMouse();
		}
	}
	
	// Draws a rounded rectangular shape starting at (x, y), with a rectangular
	// portion of width w, and height 2 * radius.
	function drawButton(context, x, y, radius, width) {
		context.beginPath();
		context.moveTo(x+radius, y);
		context.lineTo(x+width+radius, y);
		context.arc(x+width+radius, y+radius, radius, 1.5*Math.PI, 0.5*Math.PI);
		context.lineTo(x+radius, y+2*radius);
		context.arc(x+radius, y+radius, radius, 0.5*Math.PI, 1.5*Math.PI);
		context.closePath();
		context.fill();
	} 

	function showRules() {
		var topPadding = 70;
		var sidePadding = 25;
		var textX = theCanvas.width*0.5;
		var textY = topPadding;
		var textW = theCanvas.width-sidePadding*2;
		var lineHeight = 30;
		var text = "Repeat the sequence of colors after it has been displayed. After you correctly complete the current sequence, a random color will be added to the current sequence and you must repeat it again to advance."
		var backRectColor = '#00CC00';
		var backTextColor = '#0000CC';
		var buttonW = 70;
		var buttonR = 25;
		var buttonX = theCanvas.width*0.5 - buttonW*0.5 - buttonR;
		var buttonY = theCanvas.height*0.8 - buttonR;
		
		if (areaClicked(buttonX, buttonY, buttonW+50, buttonR*2, moveMouseX, moveMouseY)) {
			backRectColor = '#00FF00';
			backTextColor = '#0000FF';
		}

		context.fillStyle = '#0000CC';
		context.fillRect(0, 0, theCanvas.width, theCanvas.height);
		context.font = "18px Tahoma";
		context.fillStyle = '#00CC00';
		context.textAlign = 'center'
		wrapText(context, text, textX, textY, textW, lineHeight);

		context.fillStyle = backRectColor;
		drawButton(context, buttonX, buttonY, buttonR, buttonW);
		context.font = "30px Plaster";
		context.fillStyle = backTextColor;
		context.fillText("Back", theCanvas.width*0.5, theCanvas.height*0.8);

		if (areaClicked(buttonX, buttonY, buttonW+50, buttonR*2, downMouseX, downMouseY)) {
			menuState = MENU_NONE;
			resetDownMouse();
		}
	}
	
	function showScores() {
		var topPadding = 70;
		var sidePadding = 25;
		var textX = theCanvas.width*0.5;
		var textY = topPadding;
		var textW = theCanvas.width-sidePadding*2;
		var lineHeight = 30;
		var text = "Coming Soon";
		var backRectColor = '#0000CC';
		var backTextColor = '#00CC00';
		var buttonW = 70;
		var buttonR = 25;
		var buttonX = theCanvas.width*0.5 - buttonW*0.5 - buttonR;
		var buttonY = theCanvas.height*0.8 - buttonR;
		
		if (areaClicked(buttonX, buttonY, buttonW+50, buttonR*2, moveMouseX, moveMouseY)) {
			backRectColor = '#0000FF';
			backTextColor = '#00FF00';
		}

		context.fillStyle = '#00CC00';
		context.fillRect(0, 0, theCanvas.width, theCanvas.height);
		context.font = "30px Plaster";
		context.fillStyle = '#0000CC';
		context.textAlign = 'center'
		wrapText(context, text, textX, textY, textW, lineHeight);

		context.fillStyle = backRectColor;
		drawButton(context, buttonX, buttonY, buttonR, buttonW);
		context.font = "30px Plaster";
		context.fillStyle = backTextColor;
		context.fillText("Back", theCanvas.width*0.5, theCanvas.height*0.8);

		if (areaClicked(buttonX, buttonY, buttonW+50, buttonR*2, downMouseX, downMouseY)) {
			menuState = MENU_NONE;
			resetDownMouse();
		}
	}

	function showGameOver() {
		if (downMouseX > 0 && downMouseY > 0) {
			resetDownMouse();
			menuState = MENU_NONE;
			resetGame();
		}
		
		var title = "Game Over";
		context.font = "40px Plaster";
		var titleLen = context.measureText(title).width;
		var titleX = theCanvas.width/2-titleLen/2;
		var titleY = theCanvas.height*0.4;
		var caption = "Click anywhere to continue.";
		context.font = "20px Tahoma";
		var captionLen = context.measureText(caption).width;
		var captionX = theCanvas.width/2-captionLen/2;
		var captionY = theCanvas.height*0.6;
				
		var titleColor = colorArray[(titleColorIndex)%4];
		var captionColor = colorArray[(titleColorIndex+2)%4];
		
		if (titleTimer <= 0) {
			titleColorIndex = (titleColorIndex+1)%4;
			titleTimer = titleInterval;
		}
		else
			--titleTimer;
		
		// Draw background
		context.fillStyle = '#000000';
		context.fillRect(0, 0, theCanvas.width, theCanvas.height);
		// Draw title
		context.fillStyle = titleColor;
		context.font = "40px Plaster";
		context.fillText(title, titleX, titleY);
		// Draw caption
		context.fillStyle = captionColor;
		context.font = "20px Tahoma";
		context.fillText(caption, captionX, captionY);
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
			resetDownMouse();
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
		var colorPicked = getColorPicked(downMouseX, downMouseY);
		playerColors.push(colorPicked);
		playerDisplay[colorPicked] = playerDisplayInterval;
		
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
			resetDownMouse();
			resetUpMouse();
			gameState = STATE_PLAYER_WAIT;
		}
		else {
			resetDownMouse();
			gameState = STATE_GAME_OVER;
		}
	}

	// HIGHLIGHT/UNHIGHLIGHT NOT WORKING SINCE REDISTRIBUTING TASK TO THIS FUNCTION
	// INSTEAD OF BEING HANDLED BY THE MOUSE EVENT HANDLERS. POSSIBLY GOING TO REDO HOW 
	// HIGHLIGHT/UNHIGHLIGHT IS HANDLED, SO PUTTING THIS OFF FOR NOW.
	// Waits for mouse clicks on the canvas and highlight/unhighlights selected color 
	function playerWait() {
		if (downMouseX >= 0 && downMouseY >= 0) {
			//drawColors(getColorPicked(downMouseX, downMouseY));
			gameState = STATE_PLAYER_TURN;	
		}

		var colorsArray = new Array();
		for (var k in playerDisplay) {
			colorsArray.push(k);
			--playerDisplay[k];
			if (playerDisplay[k] < 0)
				delete playerDisplay[k];
		}

		console.log("playerDisplay: "+playerDisplay);
		console.log("playerDisplay[k]: "+playerDisplay[k]);
		console.log("colorsArray: "+colorsArray);

		drawColors(colorsArray);
 
	}

	// Sets downMouseX and downMouseY to (-1,-1) to simplify hit testing.
	// Should be called before switching to STATE_PLAYER_WAIT
	function resetDownMouse() {
		downMouseX = -1;
		downMouseY = -1;
	}

	function resetUpMouse() {
		upMouseX = -1;
		upMouseY = -1;
	}

	function resetMoveMouse() {
		moveMouseX = -1;
		moveMouseY = -1;
	}
	
	function getColorPicked(mX, mY) {
		var colorPicked = RED;
		if (mX > theCanvas.width/2 && mY < theCanvas.height/2)
			colorPicked = BLUE;
		else if (mX < theCanvas.width/2 && mY > theCanvas.height/2)
			colorPicked = GREEN;
		else if (mX > theCanvas.width/2 && mY > theCanvas.height/2)
			colorPicked = YELLOW;
		return colorPicked;
	}

	// Determines what menu option is selected based on current mX and mY.
	// option is a required parameter with valid options being 'highlight' and 
	// 'state'. If 'highlight' is supplied, the function will return a valid menuHighlight
	// string; if 'state' is supplied, the function will return a valid menuState.
	// The function will return null and display an error to the console if an invalid
	// parameter is supplied for option.
	function getMenuOptionPicked(option, mX, mY) {
		if (option != 'highlight' && option != 'state') {
			console.log("getMenuOptionPicked called with invalid parameter: "+option);
			return null;
		}
		
		var padding = 15;
		var tempMenuHighlight = 'none';
		var tempMenuState = MENU_NONE;

		// Play
		if (mX > 60-padding && mX < 140+padding
			&& mY > 85-padding && mY < 115+padding) {
			tempMenuHighlight = 'play';
			tempMenuState = MENU_PLAY;
		}
		// Rules
		else if (mX > 249-padding && mX < 351+padding 
			&& mY > 85-padding && mY < 115+padding) {
			tempMenuHighlight = 'rules';
			tempMenuState = MENU_RULES;
		}
		// Scores
		else if (mX > 33-padding && mX < 167+padding 
			&& mY > 285-padding && mY < 315+padding) {
			tempMenuHighlight = 'scores';
			tempMenuState = MENU_SCORES;
		}
		// About
		else if (mX > 244-padding && mX < 356+padding
			&& mY > 285-padding && mY < 315+padding) {
			tempMenuHighlight = 'about';
			tempMenuState = MENU_ABOUT;
		} 

		if (option == 'highlight')
			return tempMenuHighlight;
		else if (option == 'state') 
			return tempMenuState;
	}
	
	function gameOver() {
		context.fillStyle = '#000000';
		context.font = "20px Verdana";
		var text = "GAME OVER";
		context.fillText(text, 200,200);
	}
	
	// drawColors determines which color to highlight and draws the rest a darker shade. 
	// If called as drawColors('off') no colors will be highlighted, as drawColors(RED) 
	// the red square will be highlighted, as drawColors([RED, GREEN]) the red and green 
	// squares will be highlighted, as drawColors() the color at simonColors[colorIndex]
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
		
		if (typeof color != 'number' && typeof color != 'string') {
			for (var i = 0; i < color.length; ++i) {
				switch(color[i]) {
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
		}
		else if (color != 'off') {
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

	// Stolen from http://www.html5canvastutorials.com/tutorials/html5-canvas-wrap-text-tutorial/
	// Wraps supplied text according to supplied parameters. 
	function wrapText(context, text, x, y, maxWidth, lineHeight) {
        var words = text.split(' ');
        var line = '';

        for (var n = 0; n < words.length; n++) {
			var testLine = line + words[n] + ' ';
			var metrics = context.measureText(testLine);
			var testWidth = metrics.width;
			if (testWidth > maxWidth && n > 0) {
				context.fillText(line, x, y);
				line = words[n] + ' ';
				y += lineHeight;
			}
			else 
				line = testLine;
        }
        context.fillText(line, x, y);
    }

	// Returns true if mX and mY are within the box defined by a starting point 
	// of (x1, y1), width w, and height h.
	function areaClicked(x, y, w, h, mX, mY) {
		var result = false;
		var x2 = x + w;
		var y2 = y + h;
		if (mX >= x && mX <= x2 && mY >= y && mY <= y2)
			result = true;
		return result;
	}

	function eventMouseDown(e) {
	    if(e.offsetX) {
	        downMouseX = e.offsetX;
	        downMouseY = e.offsetY;
	    }
		else if (e.layerX) {
	        downMouseX = e.layerX;
	        downMouseY = e.layerY;
		}
		
		/*
		if (gameState == STATE_PLAYER_WAIT && !colorHighlighted) {
			drawColors(getColorPicked());
			colorHighlighted = true;
		}
		*/ 
		/*
		if (gameState == STATE_MENU && menuState == MENU_NONE) 
			menuState = getMenuOptionPicked('state');

		else if (gameState == STATE_MENU && menuState == MENU_ABOUT) {
			if (areaClicked(140, 295, 70, 50, downMouseX, downMouseY));
				menuState = MENU_NONE;
		}
		*/

		/*** DEBUG ***/
		if (DEBUG_MOUSE_DOWN)
			console.log("(downMouseX, downMouseY): ("+downMouseX+", "+downMouseY+")");
	}

	function eventMouseUp(e) {
		if(e.offsetX) {
	        upMouseX = e.offsetX;
	        upMouseY = e.offsetY;
	    }
		else if (e.layerX) {
	        upMouseX = e.layerX;
	        upMouseY = e.layerY;
		}

		/*** DEBUG ***/
		if (DEBUG_MOUSE_UP)
			console.log("(upMouseX, upMouseY): ("+upMouseX+", "+upMouseY+")");
	}
	
	function eventMouseMove(e) {
		//if (gameState == STATE_MENU && menuState == MENU_NONE) {
		if(e.offsetX) {
			moveMouseX = e.offsetX;
			moveMouseY = e.offsetY;
		}
		else if (e.layerX) {
			moveMouseX = e.layerX;
			moveMouseY = e.layerY;
		}
		//	menuHighlight = getMenuOptionPicked('highlight');

		/*** DEBUG ***/
		if (DEBUG_MOUSE_MOVE)
			console.log("(moveMouseX, moveMouseY): ("+moveMouseX+", "+moveMouseY+")");

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
			showGameOver();
			break;
		case STATE_TITLE:
			showTitle();
			break;
		case STATE_MENU:
			runMenu();
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