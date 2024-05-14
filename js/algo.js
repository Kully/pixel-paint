function Flood_Fill_Algorithm(cell_id, target_color, replacement_color)
{
	function Cell_Coordinates_Out_Of_Bounds(x, y)
	{
		if((0<=x) && (x<=CELLS_PER_ROW-1) && (0<=y) && (y<=CELLS_PER_ROW-1))
			return false;
		return true;
	}

	function Cell_Coordinates_In_Bounds(x, y)
	{
		if((0<=x) && (x<=CELLS_PER_ROW-1) && (0<=y) && (y<=CELLS_PER_ROW-1))
			return true;
		return false;
	}

	let cell_int = Number(cell_id);
	let cell_x = Get_X_From_CellInt(cell_int);
	let cell_y = Get_Y_From_CellInt(cell_int);

	Cell_Coordinates_In_Bounds(cell_x, cell_y+1)

	let cell_element = document.getElementById(cell_id);

	if(Rgb_To_Hex(target_color) === replacement_color)
		return;
	else if(cell_element.style.backgroundColor !== target_color)
		return;
	else
	{
		cell_element.style.backgroundColor = replacement_color;

		if(Cell_Coordinates_In_Bounds(cell_x, cell_y+1))
		{
			let next_cell_int = Get_CellInt_From_CellXY(cell_x, cell_y+1);
			let next_cell_id = Pad_Start_Int(next_cell_int);

			Flood_Fill_Algorithm(next_cell_id,
								 target_color,
								 replacement_color);
		}
		if(Cell_Coordinates_In_Bounds(cell_x, cell_y-1))
		{
			let next_cell_int = Get_CellInt_From_CellXY(cell_x, cell_y-1);
			let next_cell_id = Pad_Start_Int(next_cell_int);

			Flood_Fill_Algorithm(next_cell_id,
								 target_color,
								 replacement_color);
		}
		if(Cell_Coordinates_In_Bounds(cell_x-1, cell_y))
		{
			let next_cell_int = Get_CellInt_From_CellXY(cell_x-1, cell_y);
			let next_cell_id = Pad_Start_Int(next_cell_int);

			Flood_Fill_Algorithm(next_cell_id,
								 target_color,
								 replacement_color);
		}
		if(Cell_Coordinates_In_Bounds(cell_x+1, cell_y))
		{
			let next_cell_int = Get_CellInt_From_CellXY(cell_x+1, cell_y);
			let next_cell_id = Pad_Start_Int(next_cell_int);

			Flood_Fill_Algorithm(next_cell_id,
								 target_color,
								 replacement_color);
		}
	}
};


