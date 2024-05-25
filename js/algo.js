function Flood_Fill_Algorithm(cell_id, target_color, replacement_color) {
	function Cell_Coordinates_Out_Of_Bounds(x, y) {
		if ((0 <= x) && (x <= CELLS_PER_ROW - 1) && (0 <= y) && (y <= CELLS_PER_ROW - 1))
			return false;
		return true;
	}

	function Cell_Coordinates_In_Bounds(x, y) {
		if ((0 <= x) && (x <= CELLS_PER_ROW - 1) && (0 <= y) && (y <= CELLS_PER_ROW - 1))
			return true;
		return false;
	}

	let cell_int = Number(cell_id);
	let cell_x = Get_X_From_CellInt(cell_int);
	let cell_y = Get_Y_From_CellInt(cell_int);

	Cell_Coordinates_In_Bounds(cell_x, cell_y + 1);

	let cell_element = document.getElementById(cell_id);

	if (Rgb_To_Hex(target_color) === replacement_color)
		return;
	else if (cell_element.style.backgroundColor !== target_color)
		return;
	else {
		cell_element.style.backgroundColor = replacement_color;

		if (Cell_Coordinates_In_Bounds(cell_x, cell_y + 1)) {
			let next_cell_int = Get_CellInt_From_CellXY(cell_x, cell_y + 1);
			let next_cell_id = Pad_Start_Int(next_cell_int);

			Flood_Fill_Algorithm(next_cell_id, target_color, replacement_color);
		}
		if (Cell_Coordinates_In_Bounds(cell_x, cell_y - 1)) {
			let next_cell_int = Get_CellInt_From_CellXY(cell_x, cell_y - 1);
			let next_cell_id = Pad_Start_Int(next_cell_int);

			Flood_Fill_Algorithm(next_cell_id, target_color, replacement_color);
		}
		if (Cell_Coordinates_In_Bounds(cell_x - 1, cell_y)) {
			let next_cell_int = Get_CellInt_From_CellXY(cell_x - 1, cell_y);
			let next_cell_id = Pad_Start_Int(next_cell_int);

			Flood_Fill_Algorithm(next_cell_id, target_color, replacement_color);
		}
		if (Cell_Coordinates_In_Bounds(cell_x + 1, cell_y)) {
			let next_cell_int = Get_CellInt_From_CellXY(cell_x + 1, cell_y);
			let next_cell_id = Pad_Start_Int(next_cell_int);

			Flood_Fill_Algorithm(next_cell_id, target_color, replacement_color);
		}
	}
};

/**
 * Draws a line using the Bresenham's line algorithm. The line is drawn from (startX, startY) to (endX, endY)
 *
 * @param {number} startX - The x-coordinate of the starting point.
 * @param {number} startY - The y-coordinate of the starting point.
 * @param {number} endX - The x-coordinate of the ending point.
 * @param {number} endY - The y-coordinate of the ending point.
 * @param {function} callback - The callback function to be called for each cell on the line.
 * @return {void} This function does not return a value.
 */
function Bresenham_Line_Algorithm(startX, startY, endX, endY, callback)
{
	if (typeof callback !== 'function') { console.error("Invalid callback function"); return; }
	let deltaX = Math.abs(endX - startX);
	let deltaY = Math.abs(endY - startY);
	let stepX = (startX < endX) ? 1 : -1;
	let stepY = (startY < endY) ? 1 : -1;
	let error = deltaX - deltaY;

	while (true)
	{
		let cellId = Pad_Start_Int(Get_CellInt_From_CellXY(Math.round(startX), Math.round(startY)));
		let currentCell = document.getElementById(cellId);
		
		if (currentCell) {
			callback(currentCell);
		}
		if (Math.round(startX) === Math.round(endX) &&
			Math.round(startY) === Math.round(endY)) break;

		let error2 = 2 * error;
		if (error2 > -deltaY) {
			error -= deltaY;
			startX += stepX;
		}
		if (error2 < deltaX) {
			error += deltaX;
			startY += stepY;
		}
	}
};
