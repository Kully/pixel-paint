console.log("https://github.com/Kully/pixel-paint/issues/1");

const CELLS_PER_ROW = 32;
const CELL_WIDTH_PX = 19;
const MAX_UNDOS = 25;
const GRID_CSS_OUTLINE = "1px dashed #aaa";
const BUTTON_UP_COLOR = "#dedede";
const BUTTON_UP_RGB = "rgb(222, 222, 222)";
const BUTTON_DOWN_COLOR = "#777";
const INIT_COLOR = "#fcfcfc";  // palette_color_array
const MAX_COLORS_IN_PALETTE = 14;

let pencilCursor = 'url("img/pencil2.png") -16 28, auto';
let selectionObj = {
    "id": "selection-button",
    "hotkey": "KeyS",
    "isKeyDown": false,
    "enabled": false,
    "cursor": "crosshair",
}
let fillObj = {
    "id": "fill-button",
    "hotkey": "KeyF",
    "isKeyDown": false,
    "enabled": false,
    "cursor": 'url("img/fill2.png") 28 16, auto',
}
let eraserObj = {
    "id": "eraser-button",
    "hotkey": "KeyE",
    "isKeyDown": false,
    "enabled": false,
    "cursor": 'url("img/eraser1919.png") 10 7, auto',
}
let colorpickerObj = {
    "id": "colorpicker-button",
    "hotkey": "KeyI",
    "isKeyDown": false,
    "enabled": false,
    "cursor": 'url("img/colorpicker2.png") -32 32, auto',
}

let palette_color_array = [
    "#fcfcfc",
    "#f8f8f8",
    "#bcbcbc",
    "#7c7c7c",
    
    "#a4e4fc",
    "#3cbcfc",
    "#0078f8",
    "#0007fc",
    
    "#b8b8f8",
    "#6888fc",
    "#0059f8",
    "#0004bc",
    
    "#d8b8f8",
    "#9878f8",
    "#6846fc",
    "#432abc",

    "#f8b8f8",
    "#f878f8",
    "#d801cc",
    "#940084",

    "#f8a4c0",
    "#f878f8",
    "#d801cc",
    "#a80020",
    
    "#f0cfb0",
    "#f87758",
    "#f83701",
    "#a80e00",
    
    "#fce0a8",
    "#fc9f44",
    "#e45b11",
    "#881400",

    "#f8d878",
    "#f8b801",
    "#ac7b01",
    "#503000",

    "#d8f878",
    "#b9f819",
    "#02b801",
    "#017800",

    "#b8f8b8",
    "#58d854",
    "#01a801",
    "#016800",

    "#b8f8d8",
    "#58f898",
    "#01a844",
    "#015800",

    "#00fcfc",
    "#00e8d8",
    "#008888",
    "#004058",

    "#c4c4c4",
    "#787878",
    "#000001",
    "#000000",
];

// VARIABLES
let last_active_color = "";
let active_color = "#000000";
let brush_down = false;
let active_tool = "";
let KeyG_Counter = 0;
let gridKeyCode = "KeyG";
let selectionLocked = false;
let selectionCopyOn = false;

let bodyMargin = 8;
let toolbarHeight = 32;
let canvasDivY = bodyMargin + toolbarHeight + 2;  // 2 for correction?


// *****
// UTILS
// *****

function rgbToHex(rgb)
{
    rgb = rgb.replace(" ", "");
    rgb = rgb.slice(4,rgb.length-1);

    let rgb_split = rgb.split(",");

    let r = parseInt(rgb_split[0]);
    let g = parseInt(rgb_split[1]);
    let b = parseInt(rgb_split[2]);

    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function Random_Color()
{
    let r = Math.floor(Math.random()*255);
    let g = Math.floor(Math.random()*255);
    let b = Math.floor(Math.random()*255);
    return "rgb(" + r + ", " + g + ", " + b + ")";
}

function Get_X_From_CellInt(idx)
{
    return idx % CELLS_PER_ROW;
}

function Get_Y_From_CellInt(idx)
{
    return Math.floor(idx / CELLS_PER_ROW);
}

function Get_CellInt_From_XY(x, y)
{
    return x + (y * CELLS_PER_ROW);
}

function Cell_ID_To_Int(id)
{
    return Number(id);
}

function Px_To_Int(str)
{
    return str.slice(0, str.length-2);
}

function Int_To_Px(int)
{
    return int + "px";
}

function Cell_Int_To_ID(int)
{
    return int.toString().padStart(4, 0);
}

function Add_Pencil_Cursor_To_Document()
{
    document.body.style.cursor = pencilCursor;
}

function Color_Buttons()
{
    let buttons = document.querySelectorAll("button");
    buttons.forEach(function(b) {
        b.style.backgroundColor = BUTTON_UP_COLOR;
    })
}

function Populate_Canvas_With_Cells()
{
    const canvasDiv = document.getElementById("canvas-div");
    for(let i=0; i<CELLS_PER_ROW*CELLS_PER_ROW; i+=1)
    {
        let div = document.createElement("div");
        div.className = "canvasCell";
        div.id = Cell_Int_To_ID(i);
        div.style.backgroundColor = INIT_COLOR;
        canvasDiv.appendChild(div);
    }
}

function Populate_Palette_With_Cells()
{
    const paletteDiv = document.getElementById("palette-div");

    for(let i=0; i<palette_color_array.length; i += 1)
    {
        let cell = document.createElement("div");
        cell.className = "paletteCell";
        cell.style.backgroundColor = palette_color_array[i];
        paletteDiv.appendChild(cell);
    }
}

function Add_EventHandlers_To_Canvas_Div()
{
    const canvasDiv = document.getElementById("canvas-div");
    canvasDiv.addEventListener("mousedown", function() {
        brush_down = true;
    });
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
    let activeColorDiv = document.getElementById("active-color-preview");
    activeColorDiv.style.backgroundColor = active_color;
    Update_Active_Color_Label();
}

function Update_Active_Color_Label()
{
    activeColorLabel = document.getElementById("active-color-label");

    if(active_color.includes("rgb"))
        active_color = rgbToHex(active_color);

    activeColorLabel.innerHTML = active_color;    // label
    activeColorLabel.style.color = active_color;  // text color
}

function Add_EventHandlers_To_Palette_Cells()
{
    const allPaletteCells = document.querySelectorAll(".paletteCell");
    allPaletteCells.forEach(function(cell){
        cell.addEventListener("click", function(e){
            active_color = e.target.style.backgroundColor;
            Update_Active_Color_Preview();
            Update_Active_Color_Label();
        })
    })
}

function Reset_Color_Of_Canvas_Cells()
{
    let canvasCells = document.querySelectorAll(".canvasCell");
    for(let i=0; i<CELLS_PER_ROW*CELLS_PER_ROW; i += 1)
    {
        canvasCells[i].style.backgroundColor = INIT_COLOR;
    }
}

function Does_CellID_Exist(id)
{
    if(!document.getElementById(id))
        return false;
    return true;
}

function Cell_Coordinates_Out_Of_Bounds(x, y)
{
    if((0 <= x) && (x <= CELLS_PER_ROW-1) && (0 <= y) && (y <= CELLS_PER_ROW-1))
        return false;
    return true;
}

function Cell_Coordinates_In_Bounds(x, y)
{
    if((0 <= x) && (x <= CELLS_PER_ROW-1) && (0 <= y) && (y <= CELLS_PER_ROW-1))
        return true;
    return false;
}

function Remove_Selection()
{
    let selection = document.getElementById("selection");
    if(selection)
        selection.remove();
}

function Add_EventHandlers_To_Canvas_Cells()
{
    function Crosshair_Mousedown(e)
    {
        let cursor = document.getElementById("canvas-div").style.cursor;
        if(cursor === selectionObj["cursor"])
        {
            Remove_Selection();
            Unlock_Selection_Div();

            const canvasDiv = document.getElementById("canvas-div");
            
            // create a selection div
            let selection = document.createElement("div");
            selection.id = "selection";

            // set top and left position of new selection div
            let closestCanvasCell = e.target.closest("div.canvasCell");

            let selectionLeft = 0;
            if( e.offsetX <= Math.floor( CELL_WIDTH_PX / 2 ) )
                selectionLeft = closestCanvasCell.offsetLeft;
            else
            {
                let cellId = parseInt(closestCanvasCell.id);

                // if cell is at right side of screen: dont draw it
                let rightCanvasCell = document.getElementById(
                    Cell_Int_To_ID(cellId+1)
                );
                selectionLeft = rightCanvasCell.offsetLeft;
            }


            let selectionTop = 0;
            if( e.offsetY <= Math.floor( CELL_WIDTH_PX / 2 ) )
                selectionTop = closestCanvasCell.offsetTop;
            else
            {
                let cellId = parseInt(closestCanvasCell.id);

                // what if cell is at bottom row?
                let belowCanvasCell = document.getElementById(
                    Cell_Int_To_ID(cellId+CELLS_PER_ROW)
                );
                selectionTop = belowCanvasCell.offsetTop;
            }

            selection.style.left = selectionLeft + "px";
            selection.style.top = selectionTop + "px";

            // append div to DOM
            canvasDiv.appendChild(selection);
        }
    }

    function Crosshair_Mousemove(e)
    {
        let cursor = document.getElementById("canvas-div").style.cursor;
        if((cursor === selectionObj["cursor"]) && (selectionLocked === false))
        {
            const canvasDiv = document.getElementById("canvas-div");
            const selection = document.getElementById("selection");
            
            if(!selection)
                return;

            let closestCanvasCell = e.target.closest("div.canvasCell");
            const cell_id_as_int = parseInt(closestCanvasCell.id);

            let cursorX = e.pageX - bodyMargin - e.offsetX - 4 + 2;
            let cursorY = e.pageY - canvasDivY - e.offsetY - 2 + 2;

            let newWidth = (cursorX - Px_To_Int(selection.style.left));
            let newHeight = (cursorY - Px_To_Int(selection.style.top));

            // sanatize width
            newWidth = Math.ceil(newWidth);
            newWidth = newWidth - (newWidth % CELL_WIDTH_PX) + CELL_WIDTH_PX-3;
            selection.style.width = newWidth + "px";
            
            // sanatize height
            newHeight = Math.floor(newHeight);
            newHeight = newHeight - (newHeight % CELL_WIDTH_PX) + CELL_WIDTH_PX-3;
            selection.style.height = newHeight + "px";

        }
    }

    function Crosshair_Mouseup(e)
    {
        let cursor = document.getElementById("canvas-div").style.cursor;
        if(cursor === selectionObj["cursor"])
        {
            Lock_Selection_Div();
        }
    }

    function Tool_Action_On_Canvas_Cell(e)
    {
        let cursor = document.getElementById("canvas-div").style.cursor;
        if(cursor === eraserObj["cursor"])
        {
            e.target.style.backgroundColor = INIT_COLOR;
        }
        else if(cursor === colorpickerObj["cursor"])
        {
            active_color = e.target.style.backgroundColor;
            Update_Active_Color_Preview();
            Update_Active_Color_Label();
        }
        else if(cursor === fillObj["cursor"])
        {
            // nothing
        }
        else if(cursor === selectionObj["cursor"])
        {
            // nothing
        }
        else
        {
            e.target.style.backgroundColor = active_color;
        }
    }

    const canvasCells = document.querySelectorAll(".canvasCell");
    for(let i=0; i<CELLS_PER_ROW*CELLS_PER_ROW; i += 1)
    {
        canvasCells[i].addEventListener("mousedown", Crosshair_Mousedown);
        canvasCells[i].addEventListener("mousemove", Crosshair_Mousemove);
        canvasCells[i].addEventListener("mouseup", Crosshair_Mouseup);
        canvasCells[i].addEventListener("mousemove", function(e) {
            if(brush_down)
                Tool_Action_On_Canvas_Cell(e)
        });
        
        canvasCells[i].addEventListener("mousedown", Tool_Action_On_Canvas_Cell);
        
        canvasCells[i].addEventListener("mouseup", function(e) {
            let cursor = document.getElementById("canvas-div").style.cursor;
            if(cursor === fillObj["cursor"])
            {
                let cell_id = e.target.id;
                let target_color = e.target.style.backgroundColor;
                let replacement_color = active_color;

                Flood_Fill_Algorithm(cell_id,
                                     target_color,
                                     replacement_color)
            }
            else if(cursor === selectionObj["cursor"])
            {
                // nothing
            }
        });
    }
}

function Lock_Selection_Div()
{
    selectionLocked = true;

    // make selection grabbable
    let selection = document.getElementById("selection");

    selection.style.backgroundColor = "#ff000033";
}

function Unlock_Selection_Div()
{
    selectionLocked = false;
}

function Color_Toolbar_Button_When_Down(elem)
{
    elem.style.backgroundColor = BUTTON_DOWN_COLOR;
}

function Color_Toolbar_Button_When_Up(elem)
{
    elem.style.backgroundColor = BUTTON_UP_COLOR;
}

function Toggle_Grid(e)
{
    const gridButton = document.getElementById("toggle-grid-button");
    const canvasCells = document.querySelectorAll(".canvasCell");

    // color toggle grid button
    if(canvasCells[0].style.outline === "")
        Color_Toolbar_Button_When_Down(gridButton);
    else
        Color_Toolbar_Button_When_Up(gridButton);

    canvasCells.forEach(function(cell)
    {
        if(cell.style.outline === "")
        {
            cell.style.outline = GRID_CSS_OUTLINE;
        }
        else
        {
            cell.style.outline = "";
        }
    })

}

function Add_EventHandlers_To_Copy_Button()
{
    function Delete_Popup(popupDiv)
    {

    }

    function Copy_To_Clipboard()
    {
        console.log("copy array to clipboard");

        // format array of canvas of colors
        let canvasState = Get_Canvas_State();
        let copiedText = "";
        canvasState.forEach(function(item) {
            copiedText += rgbToHex(item);
            copiedText += ",";
        })

        // insert hidden element into DOM
        const element = document.createElement("textarea");
        element.id = "hidden-text-div";
        element.value = copiedText;

        document.body.appendChild(element);

        // copy and remove element from DOM
        element.select();
        document.execCommand("copy");
        element.remove();

        // restart animation
        let popupMessage = document.getElementById("popup-message");
        popupMessage.classList.remove("fadeOutAnimation");
        void popupMessage.offsetWidth;
        popupMessage.innerHTML = "Copied to Clipboard!";
        popupMessage.classList.add("fadeOutAnimation");
    }

    let CopyButton = document.getElementById("copy-button");
    CopyButton.addEventListener("click", Copy_To_Clipboard);
}

function Add_EventHandlers_To_Grid_Button()
{
    const gridButton = document.getElementById("toggle-grid-button");

    gridButton.addEventListener("click", function(e) {
        const canvasCells = document.querySelectorAll(".canvasCell");
    });
}

function Add_EventHandlers_To_Selection_Div()
{
    let selection = document.getElementById("selection");
    selection.addEventListener("mouseover", function(e) {
        if(selectionCopyOn)
        {
            // selection.style.cursor = "move";
        }
    })
}

function Get_Canvas_State()
{
    let canvasCells = document.querySelectorAll(".canvasCell");
    let canvas_state = [];
    canvasCells.forEach(function(cell){
        canvas_state.push(cell.style.backgroundColor);
    })
    return canvas_state;
}

function Transfer_Canvas_State_To_Screen(ptr)
{
    let saved_canvas = state_array.state_array[ptr];
    let canvasCells = document.querySelectorAll(".canvasCell");

    for(let i=0; i<CELLS_PER_ROW*CELLS_PER_ROW; i += 1)
        canvasCells[i].style.backgroundColor = saved_canvas[i];
}

function Undo()
{
    console.log("undo");
    let canvas_state = Get_Canvas_State();
    state_array.decPtr();

    Transfer_Canvas_State_To_Screen(state_array.ptr);
    state_array.print();
}

function Redo()
{
    console.log("redo");
    let canvas_state = Get_Canvas_State();
    state_array.incPtr();

    Transfer_Canvas_State_To_Screen(state_array.ptr);
    state_array.print();
}

function Toggle_ToolbarButton_Color(object)
{
    object["isKeyDown"] = true;

    let button = document.getElementById(object["id"]);
    let bkgdColor = button.style.backgroundColor;
    let canvasDiv = document.getElementById("canvas-div");

    if(bkgdColor === BUTTON_UP_RGB)
    {
        // set cursor
        document.getElementById("canvas-div").style.cursor = object["cursor"];

        Color_Toolbar_Button_When_Down(button);

        // release all other buttons
        let toolbarObjectsArray = [
            selectionObj,
            fillObj,
            eraserObj,
            colorpickerObj,
        ];
        toolbarObjectsArray.forEach(function(item){
            if(item["id"] !== object["id"])
            {
                let btn = document.getElementById(item["id"]);
                Color_Toolbar_Button_When_Up(btn);
            }
        })
    }
    else
    { 
        document.getElementById("canvas-div").style.cursor = pencilCursor;
        
        Color_Toolbar_Button_When_Up(button);
    }
}

function Add_EventHandlers_To_Document()
{
    function Exit_Drawing_Mode()
    {
        brush_down = false;
    }

    function Add_CanvasState_To_CanvasStateObject()
    {
        let canvas_state = Get_Canvas_State();
        state_array.pushToPtr(canvas_state);
    }

    document.addEventListener("mouseup", Add_CanvasState_To_CanvasStateObject);
    document.addEventListener("mouseup", Exit_Drawing_Mode);
    document.addEventListener("keydown", function(e) {
        if(e.code === "AltLeft" || e.code === "AltRight")
        {
            // move to ifHoldingDown
            selectionCopyOn = !selectionCopyOn;
        }
        if(e.code === "Escape")
        {
            Remove_Selection();
        }
        if(e.code === "KeyZ")
        {
            Undo();
        }
        if(e.code === "KeyX")
        {
            Redo();
        }
        if(e.code === selectionObj["hotkey"])
        {
            if(selectionObj["isKeyDown"] === false)
            {
                // toggle enabled key
                selectionObj["enabled"] = !selectionObj["enabled"];
                Toggle_ToolbarButton_Color(selectionObj);
            }
        }
        if(e.code === fillObj["hotkey"])
        {
            if(fillObj["isKeyDown"] === false)
            {
                Toggle_ToolbarButton_Color(fillObj);
            }
        }
        if(e.code === eraserObj["hotkey"])
        {
            if(eraserObj["isKeyDown"] === false)
            {
                Toggle_ToolbarButton_Color(eraserObj);
            }
        }
        if(e.code === colorpickerObj["hotkey"])
        {
            if(colorpickerObj["isKeyDown"] === false)
            {
                Toggle_ToolbarButton_Color(colorpickerObj);
            }
        }
        if(e.code === gridKeyCode)  // grid
        {
            KeyG_Counter += 1;
        }
    })

    document.addEventListener("keyup", function(e){
        // toolbar
        if(e.code == selectionObj["hotkey"])
        {
            selectionObj["isKeyDown"] = false;
        }
        if(e.code == fillObj["hotkey"])
        {
            fillObj["isKeyDown"] = false;
        }
        if(e.code == eraserObj["hotkey"])
        {
            eraserObj["isKeyDown"] = false;
        }
        if(e.code == colorpickerObj["hotkey"])
        {
            colorpickerObj["isKeyDown"] = false;
        }
        if(e.code == gridKeyCode)  // grid
        {
            KeyG_Counter = 0;
            Toggle_Grid();
        }
    })
}


// **************
// CALL FUNCTIONS
// **************

// init
Color_Buttons();
Update_Active_Color_Preview();
Populate_Canvas_With_Cells();
Populate_Palette_With_Cells();
Add_Ids_To_Palette_Cells();
Add_Pencil_Cursor_To_Document();

// event handlers
Add_EventHandlers_To_Canvas_Cells();
Add_EventHandlers_To_Canvas_Div();
Add_EventHandlers_To_Document();
Add_EventHandlers_To_Palette_Cells();

// toolbar buttons
Add_EventHandlers_To_Grid_Button();
Add_EventHandlers_To_Copy_Button();

let state_array = new Canvas_State_Object(MAX_UNDOS);
