const CELLS_PER_ROW = 32;
const CELL_WIDTH_PX = 16;
const MAX_UNDOS = 35;
const GRID_OUTLINE_CSS = "1px dashed #aaa";
const SELECTION_LOCKED_OUTLINE = "1px dashed #ff0000";
const BUTTON_UP_COLOR = "#a0a0a0";
const BUTTON_UP_OUTLINE = "";
const BUTTON_DOWN_COLOR = "#f0f0f0";
const BUTTON_DOWN_OUTLINE = "1px solid blue";
const CANVAS_INIT_COLOR = palette_color_array[0];
let ACTIVE_COLOR_SELECT = "firstColor";
const STATE = {
	"firstColor": palette_color_array[palette_color_array.length - 1],
	"secondColor": palette_color_array[0],
	"activeTool": "pencil-button",
	"brushDown": false,
	"grid": {
		"KeyG_Counter": 0,
		"hotkey": "KeyG",
		"isToggled": false,
	},
	"altKeyDown": false,
	"selection": {
		"totalCount": 0,
		"startX": 0,
		"startY": 0,
		"isLocked": false,
		"floatingCopy": false,
	},
	"selectionCopy": {
		"initCursorX": 0,
		"initCursorY": 0,
		"left": 0,
		"top": 0,
		"colorArray": [],
	},
}
const PALETTE_DISPLAY = {
	nes: document.getElementById("palette-div"),
	gameboy: document.getElementById("gameboy-palette-div"),
	radioNES: document.getElementById("radioNES"),
	radioGameboy: document.getElementById("radioGB")
}


function Canvas_Cursor_XY(e)
{
	let parentCell = e.target.closest("div.canvasCell");
	let x = parentCell.offsetLeft;
	let y = parentCell.offsetTop;
	return [x, y];
}
	
function Canvas_Cursor_XY_Rounded_To_Neareset_Cell_Corner(e)
{
	let parentCell = e.target.closest("div.canvasCell");
	let parentCellId = parseInt(parentCell.id);
	const maxId = Math.pow(CELLS_PER_ROW, 2) - 1;

	let x = 0;
	if( e.offsetX <= Math.floor( CELL_WIDTH_PX / 2 ) )
	{
		x = parentCell.offsetLeft;
	}
	else if( Get_X_From_CellInt(Number(parentCellId)) === CELLS_PER_ROW - 1 )
	{
		x = parentCell.offsetLeft + CELL_WIDTH_PX;  // right side of canvas
	}
	else
	{
		let rightCell = document.getElementById(Pad_Start_Int(parentCellId+1));
		x = rightCell.offsetLeft;
	}

	let y = 0;
	if( e.offsetY <= Math.floor( CELL_WIDTH_PX / 2 ) )
	{
		y = parentCell.offsetTop;
	}
	else
	if( parseInt(parentCell.id)+CELLS_PER_ROW > maxId )  // bottom of canvas
	{
		y = parentCell.offsetTop + CELL_WIDTH_PX;
	}
	else
	{
		let cellIdBelow = Pad_Start_Int(parentCellId + CELLS_PER_ROW);
		let belowCell = document.getElementById(cellIdBelow);
		y = document.getElementById(cellIdBelow).offsetTop;
	}
	return [x, y];
}

function Add_Ids_To_Palette_Cells()
{
	const allPaletteCells = document.querySelectorAll(".paletteCell");
	let j = 0;
	allPaletteCells.forEach(function(item){
		item.id = "palette-cell-"+j;
		j += 1;
	})
}

function Update_Active_Color_Preview()
{
	let activeColorDiv_1 = document.getElementById("active-color-preview-1");
	let activeColorDiv_2 = document.getElementById("active-color-preview-2");
	activeColorDiv_1.style.backgroundColor = STATE["firstColor"];
	activeColorDiv_2.style.backgroundColor = STATE["secondColor"];
	Update_Active_Color_Label();
}

function Alert_User(text)
{
	let popupMessage = document.getElementById("popup-message");
	popupMessage.classList.remove("fadeOutAnimation");
	void popupMessage.offsetWidth;
	popupMessage.innerHTML = text;
	popupMessage.style.animationPlayState = "running";
	popupMessage.classList.add("fadeOutAnimation");
}

function Swap_Active_Color()
{
	let activeColorDiv_1 = document.getElementById("active-color-preview-1");
	let activeColorDiv_2 = document.getElementById("active-color-preview-2");
	if(ACTIVE_COLOR_SELECT === "firstColor")
	 {
	   ACTIVE_COLOR_SELECT = "secondColor";
	   activeColorDiv_2.classList.add("active_indicator");
	   activeColorDiv_1.classList.remove("active_indicator");
	 }
	else
	 {
	   ACTIVE_COLOR_SELECT = "firstColor";
	   activeColorDiv_1.classList.add("active_indicator");
	   activeColorDiv_2.classList.remove("active_indicator");
	 }
	Update_Active_Color_Label();
}

function Update_Active_Color_Label()
{
	activeColorLabel = document.getElementById("active-color-label");

	STATE[ACTIVE_COLOR_SELECT] = Rgb_To_Hex(STATE[ACTIVE_COLOR_SELECT]);
	activeColorLabel.innerHTML = STATE[ACTIVE_COLOR_SELECT];    // label
	activeColorLabel.style.color = STATE[ACTIVE_COLOR_SELECT];  // text color
}

function Canvas_Pixels_From_Selection(selection)
{
	let selectionLeft = Px_To_Int(selection.style.left);
	let selectionTop = Px_To_Int(selection.style.top);
	let selectionWidth = Px_To_Int(selection.style.width);
	let selectionHeight = Px_To_Int(selection.style.height);
}

function Reset_Color_Of_Canvas_Cells()
{
	let canvasCells = document.querySelectorAll(".canvasCell");
	for(let i=0; i<CELLS_PER_ROW*CELLS_PER_ROW; i += 1)
	{
		canvasCells[i].style.backgroundColor = CANVAS_INIT_COLOR;
	}
}

function Delete_Selected()
{
	const selection = document.getElementById("selection");
	if(STATE["activeTool"] === "selection")
	{
		if(selection != null)
		{
			let left = Px_To_Int(selection.style.left);
			let top = Px_To_Int(selection.style.top);
			let cell0 = Get_CellInt_From_CellXY(left / CELL_WIDTH_PX, top / CELL_WIDTH_PX);
			let width = Px_To_Int(selection.style.width) / CELL_WIDTH_PX;
			let height = Px_To_Int(selection.style.height) / CELL_WIDTH_PX;

			for(let y=0; y<height; y+=1)
			for(let x=0; x<width; x+=1)
			{
				let id = Pad_Start_Int(y * CELLS_PER_ROW + cell0 + x);
				let cell = document.getElementById(id);
				cell.style.backgroundColor = CANVAS_INIT_COLOR;
			}
		}
	}
}

function Remove_Selection()
{
	let selection = document.getElementById("selection");
	if(document.getElementById("selection"))
		selection.remove();
}

function Canvas_Pixels_From_Selection()
{
	const selection = document.getElementById("selection");
	let left = Px_To_Int(selection.style.left);
	let top = Px_To_Int(selection.style.top);
	let cell0 = Get_CellInt_From_CellXY(left / CELL_WIDTH_PX, top / CELL_WIDTH_PX);
	let width = Px_To_Int(selection.style.width) / CELL_WIDTH_PX;
	let height = Px_To_Int(selection.style.height) / CELL_WIDTH_PX;

	let colorArray = [];
	for(let y=0; y<height; y+=1)
	for(let x=0; x<width; x+=1)
	{
		let id = Pad_Start_Int(y * CELLS_PER_ROW + cell0 + x);
		let cell = document.getElementById(id);
		let color = Rgb_To_Hex(cell.style.backgroundColor);
		colorArray.push(color);
	}
	return colorArray;
}

function CursorXY_In_Selection(cursorXY, selection)
{
	let selectionLeft = Px_To_Int(selection.style.left);
	let selectionTop = Px_To_Int(selection.style.top);
	let selectionWidth = Px_To_Int(selection.style.width);
	let selectionHeight = Px_To_Int(selection.style.height);

	if( (cursorXY[0] >= selectionLeft) &&
		(cursorXY[0] <= selectionLeft + selectionWidth) &&
		(cursorXY[1] >= selectionTop) &&
		(cursorXY[1] <= selectionTop + selectionHeight) )
		return 1;
	return 0;
}

function Selection_Locked_To_Grid()
{
	STATE["selection"]["isLocked"] = true;

	let selection = document.getElementById("selection");
	selection.style.outline = SELECTION_LOCKED_OUTLINE;
}

function Unlock_Selection()
{
	STATE["selection"]["isLocked"] = false;
}

function Toggle_Grid(e)
{
	const gridButton = document.getElementById("grid-button");
	const canvasCells = document.querySelectorAll(".canvasCell");

	if(STATE["grid"]["isToggled"] === false)
	{
		Color_Toolbar_Button_As_Down(gridButton);
		canvasCells.forEach(function(cell) {
			cell.style.outline = GRID_OUTLINE_CSS;
		})
		STATE["grid"]["isToggled"] = true;
	}
	else
	{
		Color_Toolbar_Button_When_Up(gridButton);
		canvasCells.forEach(function(cell) {
			cell.style.outline = "";
		})
		STATE["grid"]["isToggled"] = false;
	}
}

function Transfer_Canvas_State_To_Screen(ptr)
{
	let savedCanvas = HISTORY_STATES.array[ptr];
	let canvasCells = document.querySelectorAll(".canvasCell");

	for(let i=0; i<CELLS_PER_ROW*CELLS_PER_ROW; i+=1)
		canvasCells[i].style.backgroundColor = savedCanvas[i];
}

function Undo()
{
	HISTORY_STATES.decPtr();
	Transfer_Canvas_State_To_Screen(HISTORY_STATES.ptr);
}

function Redo()
{
	HISTORY_STATES.incPtr();
	Transfer_Canvas_State_To_Screen(HISTORY_STATES.ptr);
}

function Select_Palette() {
	if(PALETTE_DISPLAY.radioNES.checked)
	{
		PALETTE_DISPLAY.nes.style.display = "block";
		PALETTE_DISPLAY.gameboy.style.display = "none";
	}
	else
	{
		PALETTE_DISPLAY.nes.style.display = "none";
		PALETTE_DISPLAY.gameboy.style.display = "block";
	}
}

Color_All_Toolbar_Buttons();
Update_Active_Color_Preview();
Populate_Canvas_With_Cells();
Populate_Palette_With_Cells();
Populate_GBPalette_With_Cells();
Add_Ids_To_Palette_Cells();
Update_Tooltip_Text();
Activate_Tool("pencil");
Select_Palette();

Add_EventHandlers();

const HISTORY_STATES = new History_States(MAX_UNDOS);
