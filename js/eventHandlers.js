let previousCursorX = null;
let previousCursorY = null;
let isDrawingOutside = false;
let lastOutsideX = null;
let lastOutsideY = null;

function Add_EventHandlers_To_Canvas_Div()
{
	function Update_Cursor_Coordinates_On_Screen(e)
	{
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
	canvasDiv.addEventListener("mousedown", function () {
		STATE["brushDown"] = true;
		isDrawingOutside = false;
	});
	canvasDiv.addEventListener("mousemove", Update_Cursor_Coordinates_On_Screen);
	canvasDiv.addEventListener("mouseup", function () {
		STATE["brushDown"] = false;
		previousCursorX = null;
		previousCursorY = null;
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
				console.log(`Previous Cursor: (${previousCursorX}, ${previousCursorY}) Exit Target: (${targetX}, ${targetY})`);
				if (previousCursorX !== null && previousCursorY !== null) {
					Bresenham_Line_Algorithm(previousCursorX, previousCursorY, targetX, targetY, Get_Tool_Action_Callback());
				}
				previousCursorX = null;
				previousCursorY = null;
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
					if (deltaX > 0) {
						entryPointX = 0;
					} else {
						entryPointX = CELLS_PER_ROW - 1;
					}
					entryPointY = Math.max(0, Math.min(Math.floor(lastOutsideY), CELLS_PER_ROW - 1));
				} else {
					if (deltaY > 0) {
						entryPointY = 0;
					} else {
						entryPointY = CELLS_PER_ROW - 1;
					}
					entryPointX = Math.max(0, Math.min(Math.floor(lastOutsideX), CELLS_PER_ROW - 1));
				}

				if (entryPointX !== 0 && entryPointX !== CELLS_PER_ROW - 1) {
					entryPointX = Math.floor(lastOutsideX);
				}
				if (entryPointY !== 0 && entryPointY !== CELLS_PER_ROW - 1) {
					entryPointY = Math.floor(lastOutsideY);
				}

				console.log(`Entry Point: (${entryPointX}, ${entryPointY}) Target: (${targetX}, ${targetY})`);
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

			if ((STATE["altKeyDown"] === true) &&
				(STATE["selection"]["isLocked"] === true) &&
				(selection) &&  // selection in DOM
				CursorXY_In_Selection(cursorXY, selection)) {
				STATE["selection"]["floatingCopy"] = true;

				let colorArray = Canvas_Pixels_From_Selection();
				STATE["selectionCopy"]["colorArray"] = colorArray;

				STATE["selectionCopy"]["initCursorX"] = cursorXY[0] / CELL_WIDTH_PX;
				STATE["selectionCopy"]["initCursorY"] = cursorXY[1] / CELL_WIDTH_PX;
			} else {
				Remove_Selection();
				Unlock_Selection();
				Create_Selection_Div(e);
			}
		}
	}

	function Selection_Mousemove(e)
	{
		let cursor = Get_Cursor();
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

				let cell0 = Get_CellInt_From_CellXY(selectionLeft + dx,
					selectionTop + dy);
				for (let y = 0; y < selectionHeight; y += 1)
					for (let x = 0; x < selectionWidth; x += 1) {
						let id = Pad_Start_Int(cell0 + y * CELLS_PER_ROW + x);
						let cell = document.getElementById(id);
						let idx = x + y * selectionWidth;
						let color = STATE["selectionCopy"]["colorArray"][idx];
						cell.style.backgroundColor = color;
					}

				STATE["selectionCopy"]["left"] = selectionLeft + dx;
				STATE["selectionCopy"]["top"] = selectionTop + dy;
			} else
			if ((CursorXY_In_Selection(cursorXY, selection) &&
				STATE["altKeyDown"] === true))
			{
				Set_Cursor("move");
			}
		}
	}

	function Selection_Mouseup(e) {
		let cursor = Get_Cursor();

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
		} else
		if (STATE["activeTool"] === "selection" &&
			STATE["selection"]["isLocked"] === true) {
			let selection = document.getElementById("selection");
			let selectionWidth = selection.style.width;
			let selectionHeight = selection.style.height;

			selection.style.left = STATE["selectionCopy"]["left"] * CELL_WIDTH_PX + "px";
			selection.style.top = STATE["selectionCopy"]["top"] * CELL_WIDTH_PX + "px";
			STATE["selection"]["floatingCopy"] = false;

			if (STATE["altKeyDown"] === false) {
				Set_Cursor(Tools["selection"]["cursor"]);
			}
		}
	}

	function Tool_Action_On_Canvas_Cell(e)
	{
		let cursor = Get_Cursor();
		let cell = e.target;
		let x = cell.offsetLeft / CELL_WIDTH_PX;
		let y = cell.offsetTop / CELL_WIDTH_PX;

		if (previousCursorX !== null && previousCursorY !== null) {
			Bresenham_Line_Algorithm(previousCursorX, previousCursorY, x, y, Get_Tool_Action_Callback());
		}

		previousCursorX = x;
		previousCursorY = y;
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
	let toolBtn;

	toolBtn = document.getElementById("undo-button");
	toolBtn.addEventListener("click", Undo);

	toolBtn = document.getElementById("redo-button");
	toolBtn.addEventListener("click", Redo);

	toolBtn = document.getElementById("pencil-button");
	toolBtn.addEventListener("click", function (e) {
		Activate_Tool("pencil");
	})

	toolBtn = document.getElementById("fill-button");
	toolBtn.addEventListener("click", function (e) {
		Activate_Tool("fill");
	})

	toolBtn = document.getElementById("eraser-button");
	toolBtn.addEventListener("click", function (e) {
		Activate_Tool("eraser");
	})

	toolBtn = document.getElementById("selection-button");
	toolBtn.addEventListener("click", function (e) {
		Activate_Tool("selection");
	})

	toolBtn = document.getElementById("colorpicker-button");
	toolBtn.addEventListener("click", function (e) {
		Activate_Tool("colorpicker");
	})

	toolBtn = document.getElementById("grid-button");
	toolBtn.addEventListener("click", Toggle_Grid);
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
	document.addEventListener("mouseup", function (e) {
		Exit_Drawing_Mode();
		Reset_Previous_Cursor_Position();
		if (e.target.id !== "undo-button" && e.target.id !== "redo-button") {
			Save_Canvas_State();
		}
	});
	document.addEventListener("mouseup", Exit_Drawing_Mode);
	document.addEventListener("keydown", function (e) {
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
		if (e.code === "KeyZ") {
			Undo();
		}
		if (e.code === "KeyX") {
			Redo();
		}
		if (e.code === "KeyC") {
			Swap_Active_Color();
		}

		for (label in Tools) {
			if (e.code === Tools[label]["hotkey"]) {
				Activate_Tool(label);
				Reset_Previous_Cursor_Position();
			}
		}

		if (e.code === STATE["grid"]["hotkey"]) {
			STATE["grid"]["KeyG_Counter"] += 1;
		}
	})

	document.addEventListener("keyup", function (e) {
		if (e.code === "AltLeft" || e.code === "AltRight") {
			STATE["altKeyDown"] = false;

			if (STATE["activeTool"] === "selection" &&
				STATE["selection"]["floatingCopy"] === false) {
				Set_Cursor(Tools["selection"]["cursor"]);
			}
		}
		if (e.code == STATE["grid"]["hotkey"]) {
			STATE["grid"]["KeyG_Counter"] = 0;
			Toggle_Grid();
		}
	})
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
