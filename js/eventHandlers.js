let previousCursorX = null;
let previousCursorY = null;

function Add_EventHandlers_To_Canvas_Div() {
	function Update_Cursor_Coordinates_On_Screen(e) {
		const coords = Canvas_Cursor_XY(e);
		let cursorX = coords[0];
		let cursorY = coords[1];

		let cellX = cursorX / CELL_WIDTH_PX;
		let cellY = cursorY / CELL_WIDTH_PX;

		cellX = Pad_Start_Int(cellX, 2);
		cellY = Pad_Start_Int(cellY, 2);

		const coordsDisplay = document.getElementById("cursor-coords-display");
		coordsDisplay.innerHTML = "(" + cellX + ", " + cellY + ")";
	}

	const canvasDiv = document.getElementById("canvas-div");
	canvasDiv.addEventListener("mousedown", function() {
		STATE["brushDown"] = true;
	});

	canvasDiv.addEventListener("mousemove", Update_Cursor_Coordinates_On_Screen)
}

function Add_EventHandlers_To_Palette_Cells() {
	const allPaletteCells = document.querySelectorAll(".paletteCell");
	allPaletteCells.forEach(function(cell){
		// click palette to change color
		cell.addEventListener("click", function(e){
			STATE[ACTIVE_COLOR_SELECT] = e.target.style.backgroundColor;
			Update_Active_Color_Preview();
			Update_Active_Color_Label();
		})
	})
}

function Add_EventHandlers_To_Color_Preview() {
	const allColorPreviews = document.querySelectorAll(".active-color-preview");
	allColorPreviews.forEach(function(preview){
		// click color preview to change active
		preview.addEventListener("click", function(e){
			Swap_Active_Color()
		})
	})
}

function Add_EventHandlers_To_Canvas_Cells() {
	function Create_Selection_Div(e) {
		const canvasDiv = document.getElementById("canvas-div");

		let selection = document.createElement("div");
		selection.id = "selection";

		const cursorXY = Canvas_Cursor_XY_Rounded_To_Neareset_Cell_Corner(e);
		selection.style.left = cursorXY[0] + "px";
		selection.style.top = cursorXY[1] + "px";

		STATE["selection"]["startX"] = cursorXY[0];
		STATE["selection"]["startY"] = cursorXY[1];

		canvasDiv.appendChild(selection);
	}

	function Selection_Mousedown(e) {
		if(STATE["activeTool"] === "selection") {
			let selection = document.getElementById("selection");
			let cursorXY = Canvas_Cursor_XY(e);

			if( (STATE["altKeyDown"] === true) &&
				(STATE["selection"]["isLocked"] === true) &&
				(selection) &&  // selection in DOM
				CursorXY_In_Selection(cursorXY, selection) )
			{
				STATE["selection"]["floatingCopy"] = true;

				let colorArray = Canvas_Pixels_From_Selection();
				STATE["selectionCopy"]["colorArray"] = colorArray;

				STATE["selectionCopy"]["initCursorX"] = cursorXY[0] / CELL_WIDTH_PX;
				STATE["selectionCopy"]["initCursorY"] = cursorXY[1] / CELL_WIDTH_PX;
			}
			else
			{
				Remove_Selection();
				Unlock_Selection();
				Create_Selection_Div(e);
			}
		}
	}

	function Selection_Mousemove(e) {
		let cursor = Get_Cursor();
		const selection = document.getElementById("selection");

		if( (STATE["activeTool"] === "selection") &&
			(STATE["selection"]["isLocked"] === false) )
		{
			const canvasDiv = document.getElementById("canvas-div");

			if(!selection)
				return;

			// update selection coordinates and dimensions
			const cursorXY = Canvas_Cursor_XY_Rounded_To_Neareset_Cell_Corner(e);
			if(cursorXY[0] < STATE["selection"]["startX"])
			{
				selection.style.left = cursorXY[0] + "px";
				selection.style.width = Math.abs(cursorXY[0] - STATE["selection"]["startX"]) + "px";
			}
			else
			{
				let newWidth = cursorXY[0] - Px_To_Int(selection.style.left);
				newWidth = Math.ceil(newWidth);
				newWidth = newWidth - (newWidth % CELL_WIDTH_PX);

				selection.style.left = STATE["selection"]["startX"] + "px";
				selection.style.width = newWidth + "px";
			}

			if(cursorXY[1] < STATE["selection"]["startY"])
			{
				selection.style.top = cursorXY[1] + "px";
				selection.style.height = Math.abs(cursorXY[1] - STATE["selection"]["startY"]) + "px";
			}
			else
			{
				let newHeight = cursorXY[1] - Px_To_Int(selection.style.top);
				newHeight = Math.floor(newHeight);
				newHeight = newHeight - (newHeight % CELL_WIDTH_PX);

				selection.style.top = STATE["selection"]["startY"] + "px";
				selection.style.height = newHeight + "px";
			}

			// trim off a pixel for width and height
			let width = Px_To_Int(selection.style.width);
			selection.style.width = (width - 1) + "px";
			let height = Px_To_Int(selection.style.height);
			selection.style.height = (height - 1) + "px";

			return;
		}
		else
		if( (STATE["activeTool"] === "selection") &&
			(STATE["selection"]["isLocked"] === true) )
		{
			let cursorXY = Canvas_Cursor_XY(e);
			if( STATE["selection"]["floatingCopy"] === true )
			{
				Set_Cursor("move");

				// drag copied selection
				let dx = (cursorXY[0]/CELL_WIDTH_PX) - STATE["selectionCopy"]["initCursorX"];
				let dy = (cursorXY[1]/CELL_WIDTH_PX) - STATE["selectionCopy"]["initCursorY"];
				let selectionLeft = Px_To_Int(selection.style.left) / CELL_WIDTH_PX;
				let selectionTop = Px_To_Int(selection.style.top) / CELL_WIDTH_PX;

				let selectionWidth = (Px_To_Int(selection.style.width)+1) / CELL_WIDTH_PX;
				let selectionHeight = (Px_To_Int(selection.style.height)+1) / CELL_WIDTH_PX;

				let SelectionOffScreen = (
					(selectionTop + dy < 0) ||
					(selectionTop + dy + selectionHeight > CELLS_PER_ROW) ||
					(selectionLeft + dx + selectionWidth > CELLS_PER_ROW) ||
					(selectionLeft + dx < 0)
				);

				if( SelectionOffScreen ) { return; }

				// canvas state to look before drag start
				for(let i=0; i<CELLS_PER_ROW*CELLS_PER_ROW; i+=1)
				{
					let cell = document.getElementById(Pad_Start_Int(i,4));
					cell.style.backgroundColor = HISTORY_STATES.getCurrentState()[i];
				}

				// draw selectionCopy to screen
				let cell0 = Get_CellInt_From_CellXY(selectionLeft + dx,
													selectionTop + dy);
				for(let y=0; y<selectionHeight; y+=1)
				for(let x=0; x<selectionWidth; x+=1)
				{
					let id = Pad_Start_Int(cell0 + y*CELLS_PER_ROW + x);
					let cell = document.getElementById(id);
					let idx = x + y*selectionWidth;
					let color = STATE["selectionCopy"]["colorArray"][idx];
					cell.style.backgroundColor = color;
				}

				// record new left and right
				STATE["selectionCopy"]["left"] = selectionLeft + dx;
				STATE["selectionCopy"]["top"] = selectionTop + dy;
			}
			else
			if( (CursorXY_In_Selection(cursorXY, selection) &&
				 STATE["altKeyDown"] === true) )
			{
				Set_Cursor("move");
			}
		}
	}

	function Selection_Mouseup(e) {
		let cursor = Get_Cursor();

		if( STATE["activeTool"] === "selection" &&
			STATE["selection"]["isLocked"] === false )
		{
			let selection = document.getElementById("selection");
			let selectionWidth = selection.style.width;
			let selectionHeight = selection.style.height;

			if( (selectionWidth === "0px") || (selectionWidth === "") ||
				(selectionHeight === "0px") || (selectionHeight === "") )
			{
				Remove_Selection();
				Unlock_Selection();
			}
			else
			{
				Selection_Locked_To_Grid();

				if(STATE["selection"]["totalCount"] < 3)
					Alert_User("<i>Alt</i> to copy");
				STATE["selection"]["totalCount"] += 1;
			}
		}
		else
		if( STATE["activeTool"] === "selection" &&
			STATE["selection"]["isLocked"] === true )
		{
			let selection = document.getElementById("selection");
			let selectionWidth = selection.style.width;
			let selectionHeight = selection.style.height;

			// redraw selection
			selection.style.left = STATE["selectionCopy"]["left"] * CELL_WIDTH_PX + "px";
			selection.style.top = STATE["selectionCopy"]["top"] * CELL_WIDTH_PX + "px";
			STATE["selection"]["floatingCopy"] = false;

			if(STATE["altKeyDown"] === false)
			{
				Set_Cursor(Tools["selection"]["cursor"]);
			}
		}
	}

	function Tool_Action_On_Canvas_Cell(e) {
		let cursor = Get_Cursor();
		let cell = e.target;
		let x = cell.offsetLeft / CELL_WIDTH_PX;
		let y = cell.offsetTop / CELL_WIDTH_PX;

		if (previousCursorX !== null && previousCursorY !== null) {
			// calculate point between previous and current cursor position
			let dx = x - previousCursorX;
			let dy = y - previousCursorY;
			let steps = Math.max(Math.abs(dx), Math.abs(dy));
			
			for (let i = 0; i <= steps; i++) {
				let intermediateX = previousCursorX + (dx * i) / steps;
				let intermediateY = previousCursorY + (dy * i) / steps;
				let cellId = Pad_Start_Int(Get_CellInt_From_CellXY(Math.round(intermediateX), Math.round(intermediateY)));
				let intermediateCell = document.getElementById(cellId);
				if (intermediateCell) {
					if (cursor.includes("eraser.png")) {
						intermediateCell.style.backgroundColor = CANVAS_INIT_COLOR;
					} else if (cursor.includes("pencil.png")) {
						intermediateCell.style.backgroundColor = STATE[ACTIVE_COLOR_SELECT];
					}
				}
			}
		}

		if (cursor.includes("eraser.png")) {
			cell.style.backgroundColor = CANVAS_INIT_COLOR;
		} else if (cursor.includes("colorpicker.png")) {
			STATE[ACTIVE_COLOR_SELECT] = cell.style.backgroundColor;
			Update_Active_Color_Preview();
			Update_Active_Color_Label();
		} else if (cursor.includes("pencil.png")) {
			cell.style.backgroundColor = STATE[ACTIVE_COLOR_SELECT];
		}

		previousCursorX = x;
		previousCursorY = y;
	}

	function Reset_Previous_Cursor_Position() {
		previousCursorX = null;
		previousCursorY = null;
	}

	const canvasCells = document.querySelectorAll(".canvasCell");
	for(let i = 0; i < CELLS_PER_ROW * CELLS_PER_ROW; i += 1) {
		canvasCells[i].addEventListener("mousedown", Selection_Mousedown);
		canvasCells[i].addEventListener("mousemove", Selection_Mousemove);
		canvasCells[i].addEventListener("mouseup", Selection_Mouseup);
		canvasCells[i].addEventListener("mousedown", Tool_Action_On_Canvas_Cell);

		canvasCells[i].addEventListener("mousemove", function(e) {
			if(STATE["brushDown"])
				Tool_Action_On_Canvas_Cell(e)
		});

		canvasCells[i].addEventListener("mouseup", function(e) {
			let cursor = Get_Cursor();
			if(cursor.includes("fill.png")) {
				let cell_id = e.target.id;
				let target_color = e.target.style.backgroundColor;
				let replacement_color = STATE[ACTIVE_COLOR_SELECT];

				Flood_Fill_Algorithm(cell_id, target_color, replacement_color)
			}
			Reset_Previous_Cursor_Position(); // reset mouse position
		});
	}
}

function Add_EventHandlers_To_Toolbar_Buttons() {
	let toolBtn;

	toolBtn = document.getElementById("undo-button");
	toolBtn.addEventListener("click", Undo);

	toolBtn = document.getElementById("redo-button");
	toolBtn.addEventListener("click", Redo);

	toolBtn = document.getElementById("pencil-button");
	toolBtn.addEventListener("click", function(e) {
		Activate_Tool("pencil");
	})

	toolBtn = document.getElementById("fill-button");
	toolBtn.addEventListener("click", function(e) {
		Activate_Tool("fill");
	})

	toolBtn = document.getElementById("eraser-button");
	toolBtn.addEventListener("click", function(e) {
		Activate_Tool("eraser");
	})

	toolBtn = document.getElementById("selection-button");
	toolBtn.addEventListener("click", function(e) {
		Activate_Tool("selection");
	})

	toolBtn = document.getElementById("colorpicker-button");
	toolBtn.addEventListener("click", function(e) {
		Activate_Tool("colorpicker");
	})

	toolBtn = document.getElementById("grid-button");
	toolBtn.addEventListener("click", Toggle_Grid);
}

function Add_EventHandlers_To_Save_Button() {
	function Save_To_PNG() {
		let temporaryCanvas = document.createElement("canvas");
		let width = CELLS_PER_ROW;
		let height = CELLS_PER_ROW;
		
		temporaryCanvas.width = width;
		temporaryCanvas.height = height;
		
		let context = temporaryCanvas.getContext("2d");
		let imageData = context.createImageData(width, height);

		let pixelIndex = 0;
		Get_Canvas_Pixels().forEach(function(pixel){
			let rgbArray = Get_Array_From_Rgb(pixel);
			imageData.data[pixelIndex    ] = rgbArray[0];
			imageData.data[pixelIndex + 1] = rgbArray[1];
			imageData.data[pixelIndex + 2] = rgbArray[2];
			imageData.data[pixelIndex + 3] = 255;
			pixelIndex += 4;
		})
		context.putImageData(imageData, 0, 0);

		let download = document.createElement('a');
		download.href = temporaryCanvas.toDataURL("image/png");
		download.download = 'pixelpaint.png';
		download.click();

		Alert_User("Saved!");
	}

	let saveButton = document.getElementById("save-button");
	saveButton.addEventListener("click", Save_To_PNG);
}

function Remove_EventListeners_From_Selection()
{
	let selection = document.getElementById("selection");
}

function Add_EventHandlers_To_Document() {
	function Exit_Drawing_Mode() {
		STATE["brushDown"] = false;
	}

	function Canvas_Pixels_To_History_States_Array() {
		let canvasPixels = Get_Canvas_Pixels();
		HISTORY_STATES.pushToPtr(canvasPixels);
	}

	document.addEventListener("mouseup", function(e) {
		if(e.target.id !== "undo-button" && e.target.id !== "redo-button")
			Canvas_Pixels_To_History_States_Array(e);
	});
	document.addEventListener("mouseup", Exit_Drawing_Mode);
	document.addEventListener("keydown", function(e) {
		if(e.code === "AltLeft" || e.code === "AltRight") {
			STATE["altKeyDown"] = true;

			if( STATE["activeTool"] === "selection" &&
				STATE["selection"]["isLocked"] === true &&
				STATE["selection"]["isLocked"] === true)
			{
				Set_Cursor("move");
			}

		}
		if(e.code === "Delete" || e.code === "Backspace") {
			Delete_Selected();
		}
		if(e.code === "Escape") {
			Remove_Selection();
			Unlock_Selection();
			Set_Cursor(Tools[STATE["activeTool"]]["cursor"]);
			STATE["selection"]["floatingCopy"] = false;
		}
		if(e.code === "KeyZ") {
			Undo();
		}
		if(e.code === "KeyX") {
			Redo();
		}
		if(e.code === "KeyC") {
		  Swap_Active_Color();
		}

		for(label in Tools)
		{
			if(e.code === Tools[label]["hotkey"])
			{
				Activate_Tool(label);
			}
		}

		if(e.code === STATE["grid"]["hotkey"]) {
			STATE["grid"]["KeyG_Counter"] += 1;
		}
	})

	document.addEventListener("keyup", function(e){
		if(e.code === "AltLeft" || e.code === "AltRight") {
			STATE["altKeyDown"] = false;
			
			if( STATE["activeTool"] === "selection" &&
				STATE["selection"]["floatingCopy"] === false)
			{
				Set_Cursor(Tools["selection"]["cursor"]);
			}
		}
		if(e.code == STATE["grid"]["hotkey"]) {
			STATE["grid"]["KeyG_Counter"] = 0;
			Toggle_Grid();
		}
	})
}

function Add_EventHandlers() {
	Add_EventHandlers_To_Canvas_Cells();
	Add_EventHandlers_To_Canvas_Div();
	Add_EventHandlers_To_Document();
	Add_EventHandlers_To_Palette_Cells();
	Add_EventHandlers_To_Color_Preview();
	Add_EventHandlers_To_Save_Button();
	Add_EventHandlers_To_Toolbar_Buttons();
}