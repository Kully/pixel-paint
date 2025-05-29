const Tools = {
	"pencil": {
		"button-id": "pencil-button",
		"hotkey": "KeyN",
		"cursor": 'url("img/pencil.png") 2 28, auto',
	},
	"fill": {
		"button-id": "fill-button",
		"hotkey": "KeyB",
		"cursor": 'url("img/fill.png") 28 22, auto',
	},
	"eraser": {
		"button-id": "eraser-button",
		"hotkey": "KeyE",
		"cursor": 'url("img/eraser.png") 1 16, auto',
	},
	"colorpicker": {
		"button-id": "colorpicker-button",
		"hotkey": "KeyV",
		"cursor": 'url("img/colorpicker.png") 3 30, auto',
	},
	"selection": {
		"button-id": "selection-button",
		"hotkey": "KeyS",
		"cursor": "crosshair",
	},
}

function Activate_Tool(label)
{
	let object = Tools[label];
	let button = document.getElementById(object["button-id"]);
	let buttonBkgdColor = button.style.backgroundColor;

	if (STATE["activeTool"] === "selection" && label !== "selection") {
        Remove_Selection();
        Unlock_Selection();
    }

	if(STATE["activeTool"] !== label)
	{
		Set_Cursor(object["cursor"]);
		Color_Toolbar_Button_As_Down(button);

		for(let l in Tools)
		{
			if(Tools[l]["button-id"] !== object["button-id"])
			{
				let btn = document.getElementById(Tools[l]["button-id"]);
				Color_Toolbar_Button_When_Up(btn);
			}
		}
		STATE["activeTool"] = label;
	}
}

function Get_Tool_Action_Callback()
{
	const cursor = Get_Cursor();
	if (cursor.includes("eraser.png")) {
		return function (cell) {
			cell.style.backgroundColor = CANVAS_INIT_COLOR;
		};
	} else if (cursor.includes("pencil.png")) {
		return function (cell) {
			cell.style.backgroundColor = STATE[ACTIVE_COLOR_SELECT];
		};
	} else if (cursor.includes("fill.png")) {
		return function (cell) {
			// Fill tool action can be defined here if needed
		};
	} else if (cursor.includes("colorpicker.png")) {
		return function (cell) {
			const pickedColor = cell.style.backgroundColor;
			STATE[ACTIVE_COLOR_SELECT] = pickedColor;
			Update_Active_Color_Preview();
			Update_Active_Color_Label();
		};
	} else if (cursor.includes("selection.png")) {
		return function (cell) {
			// Selection tool action can be defined here if needed
		};
	} else {
		console.warn("Unknown tool action");
		return function (cell) {
			// Do nothing for unknown tool action
		};
	}
}
