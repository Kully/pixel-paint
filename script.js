console.log("script.js");

// CONSTANTS
const GRID_WIDTH = 32
const INIT_COLOR = "white"

// VARIABLES
var active_color = "red";
var isMouseDown = false;



// *********
// FUNCTIONS
// *********

function Populate_Cells_In_Canvas()
{
	const canvasDiv = document.getElementById("canvas");
	for(let i=0; i<GRID_WIDTH*GRID_WIDTH; i++)
	{
		let div = document.createElement("div");
		div.className = "canvasCell";
		div.id = "pixel-cell-" + i;
		div.style.backgroundColor = INIT_COLOR;
		canvasDiv.appendChild(div);
	}
}

function Reset_Color_Of_Canvas_Cells()
{
	let allCells = document.querySelectorAll(".canvasCell");

	for(let i=0; i<GRID_WIDTH*GRID_WIDTH; i++)
	{
		allCells[i].style.backgroundColor = INIT_COLOR;
	}
}


// **************
// EVENT HANDLERS
// **************

function Add_EventHandlers_To_Canvas_Cells()
{
	const allCells = document.querySelectorAll(".canvasCell");
	for(let i=0; i<GRID_WIDTH*GRID_WIDTH; i++)
	{
		// handle variable that holds isMouseDown
		allCells[i].addEventListener("mousedown", function() {
			isMouseDown = true;
			console.log("isMouseDown: " + isMouseDown)
		});
		allCells[i].addEventListener("mouseup", function() {
			isMouseDown = false;
			console.log("isMouseDown: " + isMouseDown)
		});

		allCells[i].addEventListener("mousemove", EventHandler_Color_Cell);
		allCells[i].addEventListener("mousedown", EventHandler_Color_Cell);
	}
}

function Add_EventHandlers_To_Palette_Cells()
{
	const allPaletteDivs = document.querySelectorAll(".paletteCell");
	for(let i=0; i<allPaletteDivs.length; i++)
	{
		allPaletteDivs[i].addEventListener("mousedown", EventHandler_Update_Active_Color);
	}
}

function Add_EventHandlers_To_Reset_Button()
{
	const resetButton = document.getElementById("reset-button");
	resetButton.addEventListener("mousedown", Reset_Color_Of_Canvas_Cells)
}

function EventHandler_Update_Active_Color(e)
{
	active_color = e.target.style.backgroundColor;
}

function EventHandler_Color_Cell(e)
{
	if(isMouseDown)
		e.target.style.backgroundColor = active_color;
}



// init
Populate_Cells_In_Canvas()

// event handlers
Add_EventHandlers_To_Canvas_Cells()
Add_EventHandlers_To_Palette_Cells()
Add_EventHandlers_To_Reset_Button()
