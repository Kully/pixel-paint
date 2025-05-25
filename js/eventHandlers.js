const CLIPBOARD = {
    "hasData": false,
    "colorArray": [],
    "width": 0,
    "height": 0
};

let previousCursorX = null;
let previousCursorY = null;

let lastMouseX = 0;
let lastMouseY = 0;

function Copy_Selection() {
    const selection = document.getElementById("selection");
    if (STATE["activeTool"] === "selection" && selection && STATE["selection"]["isLocked"]) {
        let colorArray = Canvas_Pixels_From_Selection();
        let width = (Px_To_Int(selection.style.width) + 1) / CELL_WIDTH_PX;
        let height = (Px_To_Int(selection.style.height) + 1) / CELL_WIDTH_PX;
        
        CLIPBOARD.colorArray = colorArray;
        CLIPBOARD.width = width;
        CLIPBOARD.height = height;
        CLIPBOARD.hasData = true;
        
        Alert_User("Copied selection");
        return true;
    }
    return false;
}

function Cut_Selection() {
    if (Copy_Selection()) {
        Delete_Selected();
        Save_Canvas_State();
        Alert_User("Cut selection");
        return true;
    }
    return false;
}

function Track_Mouse_Position(e) {
    const canvasDiv = document.getElementById("canvas-div");
    const rect = canvasDiv.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    lastMouseX = Math.floor(x / CELL_WIDTH_PX);
    lastMouseY = Math.floor(y / CELL_WIDTH_PX);
    
    lastMouseX = Math.max(0, Math.min(lastMouseX, CELLS_PER_ROW - 1));
    lastMouseY = Math.max(0, Math.min(lastMouseY, CELLS_PER_ROW - 1));
}

function Paste_Selection() {
    if (!CLIPBOARD.hasData) {
        Alert_User("Nothing to paste");
        return false;
    }
    Remove_Selection();
    Unlock_Selection();
    
    let pasteX = lastMouseX;
    let pasteY = lastMouseY;
    
    if (pasteX + CLIPBOARD.width > CELLS_PER_ROW) {
        pasteX = CELLS_PER_ROW - CLIPBOARD.width;
    }
    if (pasteY + CLIPBOARD.height > CELLS_PER_ROW) {
        pasteY = CELLS_PER_ROW - CLIPBOARD.height;
    }
    
    pasteX = Math.max(0, pasteX);
    pasteY = Math.max(0, pasteY);
    
    const canvasDiv = document.getElementById("canvas-div");
    let selection = document.createElement("div");
    selection.id = "selection";
    
	selection.style.opacity = "0";
    selection.style.left = (pasteX * CELL_WIDTH_PX) + "px";
    selection.style.top = (pasteY * CELL_WIDTH_PX) + "px";
    selection.style.width = (CLIPBOARD.width * CELL_WIDTH_PX - 1) + "px";
    selection.style.height = (CLIPBOARD.height * CELL_WIDTH_PX - 1) + "px";
    
    canvasDiv.appendChild(selection);
    
    Selection_Locked_To_Grid();
    STATE["selection"]["floatingCopy"] = true;
    STATE["selectionCopy"]["colorArray"] = [...CLIPBOARD.colorArray];
    STATE["selectionCopy"]["left"] = pasteX;
    STATE["selectionCopy"]["top"] = pasteY;
    STATE["selectionCopy"]["initCursorX"] = pasteX;
    STATE["selectionCopy"]["initCursorY"] = pasteY;
    
    let cell0 = Get_CellInt_From_CellXY(pasteX, pasteY);
    for (let y = 0; y < CLIPBOARD.height; y += 1) {
        for (let x = 0; x < CLIPBOARD.width; x += 1) {
            let id = Pad_Start_Int(cell0 + y * CELLS_PER_ROW + x);
            let cell = document.getElementById(id);
            let idx = x + y * CLIPBOARD.width;
            let color = CLIPBOARD.colorArray[idx];
            if (color && color !== "transparent") {
                cell.style.backgroundColor = color;
            }
        }
    }
    
    Activate_Tool("selection");
    Alert_User("Pasted selection");

    return true;
}


function Add_EventHandlers_To_Canvas_Div()
{
	let isDrawingOutside = false;
	let lastOutsideX = null;
	let lastOutsideY = null;

	function Update_Cursor_Coordinates_On_Screen(e)
	{
		const cursorXY = Canvas_Cursor_XY(e);
		let cellX = Math.floor(cursorXY[0] / CELL_WIDTH_PX);
		let cellY = Math.floor(cursorXY[1] / CELL_WIDTH_PX);

		cellX = Pad_Start_Int(cellX, 2);
		cellY = Pad_Start_Int(cellY, 2);

		document.getElementById("cursor-coords-display").innerHTML = "(" + cellX + ", " + cellY + ")";
	}

	const canvasDiv = document.getElementById("canvas-div");
	canvasDiv.addEventListener("mousedown", function () {
		STATE["brushDown"] = true;
		isDrawingOutside = false;
	});
	canvasDiv.addEventListener("mousemove", Update_Cursor_Coordinates_On_Screen);
	canvasDiv.addEventListener("mousemove", Track_Mouse_Position);
	canvasDiv.addEventListener("mouseup", function () {
		STATE["brushDown"] = false;
		previousCursorX = previousCursorY = null;
		Save_Canvas_State();
	});
	canvasDiv.addEventListener("mouseleave", function (e) {
		if (STATE["brushDown"]) {
			const canvasRect = canvasDiv.getBoundingClientRect();
			const x = Math.max(0, Math.min(e.clientX - canvasRect.left, canvasRect.width - 1));
			const y = Math.max(0, Math.min(e.clientY - canvasRect.top, canvasRect.height - 1));
			const targetCell = document.elementFromPoint(x + canvasRect.left, y + canvasRect.top);

			if (targetCell && targetCell.classList.contains('canvasCell')) {
				const targetX = targetCell.offsetLeft / CELL_WIDTH_PX;
				const targetY = targetCell.offsetTop / CELL_WIDTH_PX;
				// console.log(`Previous Cursor: (${previousCursorX}, ${previousCursorY}) Exit Target: (${targetX}, ${targetY})`);
				if (previousCursorX !== null && previousCursorY !== null) {
					Bresenham_Line_Algorithm(previousCursorX, previousCursorY, targetX, targetY, Get_Tool_Action_Callback());
				}
				previousCursorX = previousCursorY = null;
			}
			document.addEventListener("mousemove", Track_Mouse_Outside);
		}
		isDrawingOutside = true;
	});
	canvasDiv.addEventListener("mouseenter", function (e) {
		if (STATE["brushDown"] && isDrawingOutside) {
			isDrawingOutside = false;
			const targetCell = document.elementFromPoint(e.clientX, e.clientY);

			if (targetCell && targetCell.classList.contains('canvasCell')) {
				const targetX = targetCell.offsetLeft / CELL_WIDTH_PX;
				const targetY = targetCell.offsetTop / CELL_WIDTH_PX;

				let entryPointX, entryPointY;
				const deltaX = targetX - lastOutsideX;
				const deltaY = targetY - lastOutsideY;

				if (Math.abs(deltaX) > Math.abs(deltaY)) {
					if (deltaX > 0) { entryPointX = 0; }
					else { entryPointX = CELLS_PER_ROW - 1; }
					entryPointY = Math.floor(lastOutsideY);
				} else {
					if (deltaY > 0) { entryPointY = 0; }
					else { entryPointY = CELLS_PER_ROW - 1; }
					entryPointX = Math.floor(lastOutsideX);
				}
				entryPointX = Math.max(0, Math.min(entryPointX, CELLS_PER_ROW - 1));
				entryPointY = Math.max(0, Math.min(entryPointY, CELLS_PER_ROW - 1));

				if (entryPointX === 0 || entryPointX === CELLS_PER_ROW - 1) {
					entryPointY = Math.floor(lastOutsideY);
				} else if (entryPointY === 0 || entryPointY === CELLS_PER_ROW - 1) {
					entryPointX = Math.floor(lastOutsideX);
				}
				// console.log(`Entry Point: (${entryPointX}, ${entryPointY}) Target: (${targetX}, ${targetY})`);
				Bresenham_Line_Algorithm(entryPointX, entryPointY, targetX, targetY, Get_Tool_Action_Callback());

				previousCursorX = targetX;
				previousCursorY = targetY;
				document.removeEventListener("mousemove", Track_Mouse_Outside);
			}
		}
	});

	function Track_Mouse_Outside(e)
	{
		const canvasRect = canvasDiv.getBoundingClientRect();
		lastOutsideX = (e.clientX - canvasRect.left) / CELL_WIDTH_PX;
		lastOutsideY = (e.clientY - canvasRect.top) / CELL_WIDTH_PX;
		// console.log(`Mouse Outside Position: (${lastOutsideX}, ${lastOutsideY})`);
	}
}

function Add_EventHandlers_To_Palette_Cells()
{
	const allPaletteCells = document.querySelectorAll(".paletteCell");
	allPaletteCells.forEach(function (cell) {
		cell.addEventListener("click", function (e) {
			STATE[ACTIVE_COLOR_SELECT] = e.target.style.backgroundColor;
			Update_Active_Color_Preview();
			Update_Active_Color_Label();
		})
	})
}

function Add_EventHandlers_To_Color_Preview()
{
	const allColorPreviews = document.querySelectorAll(".active-color-preview");
	allColorPreviews.forEach(function (preview) {
		preview.addEventListener("click", function (e) {
			Swap_Active_Color()
		})
	})
}

function Add_EventHandlers_To_Canvas_Cells()
{
	function Create_Selection_Div(e)
	{
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

	function Selection_Mousedown(e) 
	{
		if (STATE["activeTool"] === "selection") {
			let selection = document.getElementById("selection");
			let cursorXY = Canvas_Cursor_XY(e);

			if ((STATE["selection"]["isLocked"] === true) &&
				(selection) &&
				CursorXY_In_Selection(cursorXY, selection)) {
				if (STATE["altKeyDown"] === true) {
					STATE["selection"]["floatingCopy"] = true;

					let colorArray = Canvas_Pixels_From_Selection();
					STATE["selectionCopy"]["colorArray"] = colorArray;

					STATE["selectionCopy"]["initCursorX"] = cursorXY[0] / CELL_WIDTH_PX;
					STATE["selectionCopy"]["initCursorY"] = cursorXY[1] / CELL_WIDTH_PX;
				} else {

					let colorArray = Canvas_Pixels_From_Selection();
					STATE["selectionCopy"]["colorArray"] = colorArray;

					let origLeft = Px_To_Int(selection.style.left) / CELL_WIDTH_PX;
					let origTop = Px_To_Int(selection.style.top) / CELL_WIDTH_PX;

					STATE["selection"]["isMoving"] = true;
					STATE["selectionMove"] = {
						initCursorX: cursorXY[0] / CELL_WIDTH_PX,
						initCursorY: cursorXY[1] / CELL_WIDTH_PX,
						initLeft: origLeft,
						initTop: origTop
					};
				}
			} else {
				Remove_Selection();
				Unlock_Selection();
				Create_Selection_Div(e);
			}
		}
	}

	function Selection_Mousemove(e) 
	{
		const selection = document.getElementById("selection");

		if ((STATE["activeTool"] === "selection") &&
			(STATE["selection"]["isLocked"] === false)) {
			const canvasDiv = document.getElementById("canvas-div");

			if (!selection)
				return;

			const cursorXY = Canvas_Cursor_XY_Rounded_To_Neareset_Cell_Corner(e);
			if (cursorXY[0] < STATE["selection"]["startX"]) {
				selection.style.left = cursorXY[0] + "px";
				selection.style.width = Math.abs(cursorXY[0] - STATE["selection"]["startX"]) + "px";
			} else {
				let newWidth = cursorXY[0] - Px_To_Int(selection.style.left);
				newWidth = Math.ceil(newWidth);
				newWidth = newWidth - (newWidth % CELL_WIDTH_PX);

				selection.style.left = STATE["selection"]["startX"] + "px";
				selection.style.width = newWidth + "px";
			}

			if (cursorXY[1] < STATE["selection"]["startY"]) {
				selection.style.top = cursorXY[1] + "px";
				selection.style.height = Math.abs(cursorXY[1] - STATE["selection"]["startY"]) + "px";
			} else {
				let newHeight = cursorXY[1] - Px_To_Int(selection.style.top);
				newHeight = Math.floor(newHeight);
				newHeight = newHeight - (newHeight % CELL_WIDTH_PX);

				selection.style.top = STATE["selection"]["startY"] + "px";
				selection.style.height = newHeight + "px";
			}

			let width = Px_To_Int(selection.style.width);
			selection.style.width = (width - 1) + "px";
			let height = Px_To_Int(selection.style.height);
			selection.style.height = (height - 1) + "px";

			return;
		} else 
		if ((STATE["activeTool"] === "selection") &&
			(STATE["selection"]["isLocked"] === true)) 
		{
			let cursorXY = Canvas_Cursor_XY(e);
			if (STATE["selection"]["floatingCopy"] === true) {
				Set_Cursor("move"); // drag copied selection
				let dx = (cursorXY[0] / CELL_WIDTH_PX) - STATE["selectionCopy"]["initCursorX"];
				let dy = (cursorXY[1] / CELL_WIDTH_PX) - STATE["selectionCopy"]["initCursorY"];
				let selectionLeft = Px_To_Int(selection.style.left) / CELL_WIDTH_PX;
				let selectionTop = Px_To_Int(selection.style.top) / CELL_WIDTH_PX;

				let selectionWidth = (Px_To_Int(selection.style.width) + 1) / CELL_WIDTH_PX;
				let selectionHeight = (Px_To_Int(selection.style.height) + 1) / CELL_WIDTH_PX;

				let SelectionOffScreen = (
					(selectionTop + dy < 0) ||
					(selectionTop + dy + selectionHeight > CELLS_PER_ROW) ||
					(selectionLeft + dx + selectionWidth > CELLS_PER_ROW) ||
					(selectionLeft + dx < 0)
				);

				if (SelectionOffScreen) { return; }

				for (let i = 0; i < CELLS_PER_ROW * CELLS_PER_ROW; i += 1) {
					let cell = document.getElementById(Pad_Start_Int(i, 4));
					cell.style.backgroundColor = HISTORY_STATES.getCurrentState()[i];
				}

				let cell0 = Get_CellInt_From_CellXY(selectionLeft + dx, selectionTop + dy);
				for (let y = 0; y < selectionHeight; y += 1)
					for (let x = 0; x < selectionWidth; x += 1) {
						let id = Pad_Start_Int(cell0 + y * CELLS_PER_ROW + x);
						let cell = document.getElementById(id);
						let idx = x + y * selectionWidth;
						let color = STATE["selectionCopy"]["colorArray"][idx];
						if (color && color !== "transparent") {
							cell.style.backgroundColor = color;
						}
					}

				STATE["selectionCopy"]["left"] = selectionLeft + dx;
				STATE["selectionCopy"]["top"] = selectionTop + dy;
			} else if (STATE["selection"]["isMoving"] === true) {
				Set_Cursor("move");
				let dx = (cursorXY[0] / CELL_WIDTH_PX) - STATE["selectionMove"]["initCursorX"];
				let dy = (cursorXY[1] / CELL_WIDTH_PX) - STATE["selectionMove"]["initCursorY"];
			  
				let newLeft = STATE["selectionMove"]["initLeft"] + dx;
				let newTop = STATE["selectionMove"]["initTop"] + dy;
			  
				let selectionWidth = (Px_To_Int(selection.style.width) + 1) / CELL_WIDTH_PX;
				let selectionHeight = (Px_To_Int(selection.style.height) + 1) / CELL_WIDTH_PX;
			  
				if (
				  newLeft < 0 || newTop < 0 ||
				  (newLeft + selectionWidth) > CELLS_PER_ROW ||
				  (newTop + selectionHeight) > CELLS_PER_ROW
				) {
				  return;
				}
			  
				if (!STATE["selection"]["originalCleared"]) {
				  for (let y = 0; y < selectionHeight; y++) {
					for (let x = 0; x < selectionWidth; x++) {
					  let index = (STATE["selectionMove"]["initTop"] + y) * CELLS_PER_ROW +
								  (STATE["selectionMove"]["initLeft"] + x);
					  HISTORY_STATES.getCurrentState()[index] = "transparent";
					}
				  }
				  STATE["selection"]["originalCleared"] = true;
				}
			  
				for (let i = 0; i < CELLS_PER_ROW * CELLS_PER_ROW; i++) {
				  let cell = document.getElementById(Pad_Start_Int(i, 4));
				  cell.style.backgroundColor = HISTORY_STATES.getCurrentState()[i];
				}
			  
				let cell0 = Get_CellInt_From_CellXY(newLeft, newTop);
				for (let y = 0; y < selectionHeight; y++) {
				  for (let x = 0; x < selectionWidth; x++) {
					let id = Pad_Start_Int(cell0 + y * CELLS_PER_ROW + x);
					let cell = document.getElementById(id);
					let idx = x + y * selectionWidth;
					let color = STATE["selectionCopy"]["colorArray"][idx];
					if (color && color !== "transparent") {
					  cell.style.backgroundColor = color;
					}
				  }
				}
			  
				selection.style.left = newLeft * CELL_WIDTH_PX + "px";
				selection.style.top = newTop * CELL_WIDTH_PX + "px";
			  } else 
			if (CursorXY_In_Selection(cursorXY, selection) && STATE["altKeyDown"] === true) {
				Set_Cursor("move");
			}
		}
	}

	function Selection_Mouseup(e) 
	{
		if (STATE["activeTool"] === "selection" &&
			STATE["selection"]["isLocked"] === false) {
			let selection = document.getElementById("selection");
			let selectionWidth = selection.style.width;
			let selectionHeight = selection.style.height;

			if ((selectionWidth === "0px") || (selectionWidth === "") ||
				(selectionHeight === "0px") || (selectionHeight === "")) {
				Remove_Selection();
				Unlock_Selection();
			} else {
				Selection_Locked_To_Grid();

				if (STATE["selection"]["totalCount"] < 3)
					Alert_User("<i>Alt</i> to copy");
				STATE["selection"]["totalCount"] += 1;
			}
			if (STATE["selection"]["floatingCopy"] === true) {
				selection.style.left = STATE["selectionCopy"]["left"] * CELL_WIDTH_PX + "px";
				selection.style.top = STATE["selectionCopy"]["top"] * CELL_WIDTH_PX + "px";
				STATE["selection"]["floatingCopy"] = false;
			}
		} else 
		if (STATE["activeTool"] === "selection" &&
			STATE["selection"]["isLocked"] === true) {
			let selection = document.getElementById("selection");

			if (STATE["selection"]["floatingCopy"] === true) {
				selection.style.left = STATE["selectionCopy"]["left"] * CELL_WIDTH_PX + "px";
				selection.style.top = STATE["selectionCopy"]["top"] * CELL_WIDTH_PX + "px";
				STATE["selection"]["floatingCopy"] = false;
			}
			if (STATE["selection"]["isMoving"] === true) {
				STATE["selection"]["isMoving"] = false;
				STATE["selection"]["originalCleared"] = false;
			}
			if (STATE["altKeyDown"] === false) {
				Set_Cursor(Tools["selection"]["cursor"]);
			}
		}
	}

	function Tool_Action_On_Canvas_Cell(e)
	{
		const cell = e.target;
		const x = Math.floor(cell.offsetLeft / CELL_WIDTH_PX);
		const y = Math.floor(cell.offsetTop / CELL_WIDTH_PX);
		const callback = Get_Tool_Action_Callback();

		if (typeof callback === 'function') {
			if (previousCursorX !== null && previousCursorY !== null) {
				Bresenham_Line_Algorithm(previousCursorX, previousCursorY, x, y, callback, true);
			} else {
				Save_Canvas_State();
			}
			previousCursorX = x;
			previousCursorY = y;
			callback(cell);
		}
	}

	const canvasCells = document.querySelectorAll(".canvasCell");
	for (let i = 0; i < CELLS_PER_ROW * CELLS_PER_ROW; i += 1) {
		canvasCells[i].addEventListener("mousedown", function (e) {
			Reset_Previous_Cursor_Position();
			Selection_Mousedown(e);
			Tool_Action_On_Canvas_Cell(e);
		});
		canvasCells[i].addEventListener("mousemove", Selection_Mousemove);
		canvasCells[i].addEventListener("mouseup", Selection_Mouseup);
		canvasCells[i].addEventListener("mousedown", Tool_Action_On_Canvas_Cell);

		canvasCells[i].addEventListener("mousemove", function (e) {
			if (STATE["brushDown"]) {
				Tool_Action_On_Canvas_Cell(e);
			}
		});

		canvasCells[i].addEventListener("mouseup", function (e) {
			let cursor = Get_Cursor();
			if (cursor.includes("fill.png")) {
				let cell_id = e.target.id;
				let target_color = e.target.style.backgroundColor;
				let replacement_color = STATE[ACTIVE_COLOR_SELECT];

				Flood_Fill_Algorithm(cell_id, target_color, replacement_color);
			}
			Reset_Previous_Cursor_Position();
		});

		canvasCells[i].addEventListener("click", function (e) {
			let cursor = Get_Cursor();
			if (cursor.includes("colorpicker.png")) {
				const cell = e.target;
				const pickedColor = cell.style.backgroundColor;
				STATE[ACTIVE_COLOR_SELECT] = pickedColor;
				Update_Active_Color_Preview();
				Update_Active_Color_Label();
			}
		});
	}

	document.addEventListener("mouseup", function (e) {
		Exit_Drawing_Mode();
		Reset_Previous_Cursor_Position();
		if (e.target.id !== "undo-button" && e.target.id !== "redo-button") {
			Save_Canvas_State();
		}
	});
}

function Add_EventHandlers_To_Toolbar_Buttons()
{
	const toolbarButtons = document.querySelectorAll(".toolbarButton");
	toolbarButtons.forEach(button => {
		switch (button.id) {
			case "undo-button":
				button.addEventListener("click", Undo);
				break;
			case "redo-button":
				button.addEventListener("click", Redo);
				break;
			case "pencil-button":
				button.addEventListener("click", () => Activate_Tool("pencil"));
				break;
			case "fill-button":
				button.addEventListener("click", () => Activate_Tool("fill"));
				break;
			case "eraser-button":
				button.addEventListener("click", () => Activate_Tool("eraser"));
				break;
			case "selection-button":
				button.addEventListener("click", () => Activate_Tool("selection"));
				break;
			case "colorpicker-button":
				button.addEventListener("click", () => Activate_Tool("colorpicker"));
				break;
			case "grid-button":
				button.addEventListener("click", Toggle_Grid);
				break;
		}
	});
}

function Add_EventHandlers_To_Save_Button()
{
	function Save_To_PNG() {
		let temporaryCanvas = document.createElement("canvas");
		let width = CELLS_PER_ROW;
		let height = CELLS_PER_ROW;

		temporaryCanvas.width = width;
		temporaryCanvas.height = height;

		let context = temporaryCanvas.getContext("2d");
		let imageData = context.createImageData(width, height);

		let pixelIndex = 0;
		Get_Canvas_Pixels().forEach(function (pixel) {
			let rgbArray = Get_Array_From_Rgb(pixel);
			imageData.data[pixelIndex] = rgbArray[0];
			imageData.data[pixelIndex + 1] = rgbArray[1];
			imageData.data[pixelIndex + 2] = rgbArray[2];
			imageData.data[pixelIndex + 3] = rgbArray[3] !== undefined ? rgbArray[3] : (pixel === "transparent" ? 0 : 255);
			pixelIndex += 4;
		});
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

function Exit_Drawing_Mode()
{
	STATE["brushDown"] = false;
}

function Reset_Previous_Cursor_Position()
{
	previousCursorX = null;
	previousCursorY = null;
}

function Add_EventHandlers_To_Document()
{
	const keyDownHandler = function (e) {
		if ((e.ctrlKey || e.metaKey) && e.code === "KeyC" && !e.shiftKey) {
			e.preventDefault();
			Copy_Selection();
			return;
		}
		
		if ((e.ctrlKey || e.metaKey) && e.code === "KeyX" && !e.shiftKey) {
			e.preventDefault();
			Cut_Selection();
			return;
		}
		
		if ((e.ctrlKey || e.metaKey) && e.code === "KeyV" && !e.shiftKey) {
			e.preventDefault();
			Paste_Selection();
			return;
		}
		
		if (e.code === "AltLeft" || e.code === "AltRight") {
			STATE["altKeyDown"] = true;

			if (STATE["activeTool"] === "selection" &&
				STATE["selection"]["isLocked"] === true &&
				STATE["selection"]["isLocked"] === true) {
				Set_Cursor("move");
			}
		}
		if (e.code === "Delete" || e.code === "Backspace") {
			Delete_Selected();
			Save_Canvas_State();
		}
		if (e.code === "Escape") {
			Remove_Selection();
			Unlock_Selection();
			Set_Cursor(Tools[STATE["activeTool"]]["cursor"]);
			STATE["selection"]["floatingCopy"] = false;
		}
		if (e.code === "KeyZ" && !(e.ctrlKey || e.metaKey)) {
			Undo();
		}
		if (e.code === "KeyX" && !(e.ctrlKey || e.metaKey)) {
			Redo();
		}
		if (e.code === "KeyC" && !(e.ctrlKey || e.metaKey)) {
			Swap_Active_Color();
		}

		if (e.code === STATE["grid"]["hotkey"]) {
			STATE["grid"]["KeyG_Counter"] += 1;
		}

		for (const [toolLabel, toolConfig] of Object.entries(Tools)) {
			if (e.code === toolConfig["hotkey"]) {
				Activate_Tool(toolLabel);
				Reset_Previous_Cursor_Position();
				break;
			}
		}
	};
	const keyUpHandler = function (e) {
		if (e.code === "AltLeft" || e.code === "AltRight") {
			STATE["altKeyDown"] = false;

			if (STATE["activeTool"] === "selection" &&
				STATE["selection"]["floatingCopy"] === false) {
				Set_Cursor(Tools["selection"]["cursor"]);
			}
		}
		if (e.code === STATE["grid"]["hotkey"]) {
			STATE["grid"]["KeyG_Counter"] = 0;
			Toggle_Grid();
		}
	};
	document.addEventListener("keydown", keyDownHandler);
	document.addEventListener("keyup", keyUpHandler);
}

function Add_EventHandlers()
{
	Add_EventHandlers_To_Canvas_Cells();
	Add_EventHandlers_To_Canvas_Div();
	Add_EventHandlers_To_Document();
	Add_EventHandlers_To_Palette_Cells();
	Add_EventHandlers_To_Color_Preview();
	Add_EventHandlers_To_Save_Button();
	Add_EventHandlers_To_Toolbar_Buttons();
}