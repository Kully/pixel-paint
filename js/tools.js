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
