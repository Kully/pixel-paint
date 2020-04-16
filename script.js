console.log("https://github.com/Kully/pixel-paint/issues/1");

const CELLS_PER_ROW = 32;
const CELL_WIDTH_PX = 19;
const MAX_UNDOS = 35;
const GRID_OUTLINE_CSS = "1px dashed #aaa";
const SELECTION_LOCKED_OUTLINE = "1px dashed #ff0000c0";
const BUTTON_UP_COLOR = "#dedede";
const BUTTON_UP_RGB = "rgb(222, 222, 222)";
const BUTTON_DOWN_COLOR = "#777";
const INIT_COLOR = "#fcfcfc";
const MAX_COLORS_IN_PALETTE = 14;

let selectionObj = {
    "button-id": "selection-button",
    "hotkey": "KeyS",
    "cursor": "crosshair",
}
let fillObj = {
    "button-id": "fill-button",
    "hotkey": "KeyF",
    "cursor": 'url("img/fill2.png") 28 16, auto',
}
let eraserObj = {
    "button-id": "eraser-button",
    "hotkey": "KeyE",
    "cursor": 'url("img/eraser1919.png") 10 7, auto',
}
let colorpickerObj = {
    "button-id": "colorpicker-button",
    "hotkey": "KeyI",
    "cursor": 'url("img/colorpicker2.png") -32 32, auto',
}
let pencilObj = {
    "button-id": "pencil-button",
    "hotkey": "KeyN",
    "cursor": 'url("img/pencil2.png") -16 28, auto',
}
let gridObj = {
    "KeyG_Counter": 0,
    "hotkey": "KeyG",
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

// layout measurement
let bodyMargin = 8;
let toolbarHeight = 32;
let canvasDivY = bodyMargin + toolbarHeight + 2;  // 2 for correction?

// misc
let last_active_color = "";
let active_color = "#000000";
let brush_down = false;
let active_tool = "";
let selectionLocked = false;
let altKeyDown = false;


function Canvas_State_Object(maxSize) {
    let init_array = new Array(CELLS_PER_ROW * CELLS_PER_ROW).fill(INIT_COLOR);
    this.state_array = [init_array];    // empty array
    this.ptr = 0;                       // pointer
    this.maxSize = maxSize;             // maximum size
}
Canvas_State_Object.prototype.decPtr = function()
{
    if(this.ptr <= 0)
        return;

    this.ptr--;
};
Canvas_State_Object.prototype.incPtr = function()
{
    if(this.ptr >= this.state_array.length-1)
        return;

    this.ptr += 1;
};
Canvas_State_Object.prototype.pushToPtr = function(item)
{
    if(_Can_Push(item, this.state_array, this.ptr))
    {
        this.ptr += 1;
        this.state_array.splice(this.ptr, 0, item);
    }

    // slice off array after ptr
    this.state_array = this.state_array.slice(0, this.ptr+1);

    this._manageSize();
}
Canvas_State_Object.prototype._manageSize = function(item)
{
    if(this.state_array.length > this.maxSize)
    {
        this.state_array.shift();
        this.ptr--;
    }
}
Canvas_State_Object.prototype.ptrToEndOfStateArray = function(item)
{
    this.ptr = this.state_array.length - 1;
}
Canvas_State_Object.prototype.print = function()
{
    console.log(this);
}

function _Can_Push(thisState, state_array, ptr)
{
    if(ptr === 0)
    {
        return true;
    }
    if(_Arrays_Are_Equal(thisState, state_array[ptr]) === false)
    {
        return true;
    }
    
    return false;
}

function _Arrays_Are_Equal(a, b)
{
    if(a === b)
        return true;
    if(a.length !== b.length)
        return false;

    for(let i=0; i<a.length; i += 1)
    {
        if(a[i] !== b[i])
            return false;
    }
    return true;
}


// *****
// UTILS
// *****

function rgbToHex(rgb)
{
    // check if already in hex format
    if(rgb.includes("#"))
        return rgb;

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
    document.body.style.cursor = pencilObj["cursor"];
}

function Color_All_Toolbar_Buttons()
{
    let buttons = document.querySelectorAll("button:not(#copy-button)");
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
        div.classList.add("no-select");
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

    active_color = rgbToHex(active_color);

    activeColorLabel.innerHTML = active_color;    // label
    activeColorLabel.style.color = active_color;  // text color
}

function Add_EventHandlers_To_Palette_Cells()
{
    const allPaletteCells = document.querySelectorAll(".paletteCell");
    const colorPreview = document.getElementById("palette-preview");

    allPaletteCells.forEach(function(cell){
        // click palette to change color
        cell.addEventListener("click", function(e){
            active_color = e.target.style.backgroundColor;
            Update_Active_Color_Preview();
            Update_Active_Color_Label();
        })
        // on hover, update the color preview above
        cell.addEventListener("mouseenter", function(e){
             colorPreview.style.backgroundColor = e.target.style.backgroundColor;
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

function Remove_Selection()
{
    let selection = document.getElementById("selection");
    if(document.getElementById("selection"))
        selection.remove();
}

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

    // grab X,Y from ID of Cell
    let cell_int = Cell_ID_To_Int(cell_id);
    let cell_x = Get_X_From_CellInt(cell_int);
    let cell_y = Get_Y_From_CellInt(cell_int);

    Cell_Coordinates_In_Bounds(cell_x, cell_y+1)

    let cell_element = document.getElementById(cell_id);

    if(rgbToHex(target_color) === replacement_color)
        return;
    else if(cell_element.style.backgroundColor !== target_color)
        return;
    else
    {
        cell_element.style.backgroundColor = replacement_color;

        if(Cell_Coordinates_In_Bounds(cell_x, cell_y+1))
        {
            let next_cell_int = Get_CellInt_From_XY(cell_x, cell_y+1);
            let next_cell_id = Cell_Int_To_ID(next_cell_int);

            Flood_Fill_Algorithm(next_cell_id,
                                 target_color,
                                 replacement_color);
        }
        if(Cell_Coordinates_In_Bounds(cell_x, cell_y-1))
        {
            let next_cell_int = Get_CellInt_From_XY(cell_x, cell_y-1);
            let next_cell_id = Cell_Int_To_ID(next_cell_int);

            Flood_Fill_Algorithm(next_cell_id,
                                 target_color,
                                 replacement_color);
        }
        if(Cell_Coordinates_In_Bounds(cell_x-1, cell_y))
        {
            let next_cell_int = Get_CellInt_From_XY(cell_x-1, cell_y);
            let next_cell_id = Cell_Int_To_ID(next_cell_int);

            Flood_Fill_Algorithm(next_cell_id,
                                 target_color,
                                 replacement_color);
        }
        if(Cell_Coordinates_In_Bounds(cell_x+1, cell_y))
        {
            let next_cell_int = Get_CellInt_From_XY(cell_x+1, cell_y);
            let next_cell_id = Cell_Int_To_ID(next_cell_int);

            Flood_Fill_Algorithm(next_cell_id,
                                 target_color,
                                 replacement_color);
        }
    }
}





function Array_Of_Colors_In_Selection()
{
    const selection = document.getElementById("selection");

    // calculate
    let left = Px_To_Int(selection.style.left);
    let top = Px_To_Int(selection.style.top);
    let cell0 = Get_CellInt_From_XY(left / CELL_WIDTH_PX, top / CELL_WIDTH_PX);

    let width = Px_To_Int(selection.style.width) / CELL_WIDTH_PX;
    let height = Px_To_Int(selection.style.height) / CELL_WIDTH_PX;

    let color_array = [];
    for(let y=0; y<height; y+=1)
    for(let x=0; x<width; x+=1)
    {
        let id = Cell_Int_To_ID(y * CELLS_PER_ROW + cell0 + x);
        let cell = document.getElementById(id);
        let color = rgbToHex(cell.style.backgroundColor);
        color_array.push(color);
    }
    return color_array;
}





function Add_EventHandlers_To_Canvas_Cells()
{
    function Get_XY_Of_Cursor_Rounded_To_Neareset_Cell_Corner(e)
    {
        let parentCell = e.target.closest("div.canvasCell");
        let selectionLeft = 0;
        if( e.offsetX <= Math.floor( CELL_WIDTH_PX / 2 ) )
            selectionLeft = parentCell.offsetLeft;
        else
        {
            let cellId = parseInt(parentCell.id);

            let rightCell = document.getElementById(Cell_Int_To_ID(cellId+1));
            selectionLeft = rightCell.offsetLeft;
        }

        let selectionTop = 0;
        if( e.offsetY <= Math.floor( CELL_WIDTH_PX / 2 ) )
            selectionTop = parentCell.offsetTop;
        else
        {
            let cellId = parseInt(parentCell.id);
            let cellIdBelow = Cell_Int_To_ID(cellId+CELLS_PER_ROW);

            // TODO: what if cell is at bottom row?
            let belowCell = document.getElementById(cellIdBelow);
            selectionTop = belowCell.offsetTop;
        }
        return [selectionLeft, selectionTop];
    }

    function Create_Selection_Div(e)
    {
        const canvasDiv = document.getElementById("canvas-div");

        let selection = document.createElement("div");
        selection.id = "selection";

        const coords = Get_XY_Of_Cursor_Rounded_To_Neareset_Cell_Corner(e);
        let selectionLeft = coords[0];
        let selectionTop = coords[1];

        selection.style.left = selectionLeft + "px";
        selection.style.top = selectionTop + "px";

        selection.addEventListener("move", function() {
            console.log("moving over selection");
        })

        canvasDiv.appendChild(selection);

        document.getElementById("canvas-div").style.cursor
    }

    function Crosshair_Mousedown(e)
    {
        let cursor = document.getElementById("canvas-div").style.cursor;
        if(cursor === selectionObj["cursor"])
        {
            if(altKeyDown === true)
            {
                console.log("grab the selection");
                let color_array = Array_Of_Colors_In_Selection();
                console.log(color_array);
            }
            else
            {
                Remove_Selection();
                Unlock_Selection_Div();
                Create_Selection_Div(e);
            }
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

            // update width and height
            const coords = Get_XY_Of_Cursor_Rounded_To_Neareset_Cell_Corner(e);
            let newWidth = coords[0] - Px_To_Int(selection.style.left);
            let newHeight = coords[1] - Px_To_Int(selection.style.top);

            // sanatize width and height
            newWidth = Math.ceil(newWidth);
            newWidth = newWidth - (newWidth % CELL_WIDTH_PX) - 1;
            newHeight = Math.floor(newHeight);
            newHeight = newHeight - (newHeight % CELL_WIDTH_PX) - 1;

            // assign to the div
            selection.style.width = newWidth + "px";
            selection.style.height = newHeight + "px";

            return;
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
        canvasCells[i].addEventListener("mousedown", Tool_Action_On_Canvas_Cell);
        
        canvasCells[i].addEventListener("mousemove", function(e) {
            if(brush_down)
                Tool_Action_On_Canvas_Cell(e)
        });
        
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

    selection.style.outline = SELECTION_LOCKED_OUTLINE;
}

function Unlock_Selection_Div()
{
    selectionLocked = false;
}

function Color_Toolbar_Button_As_Down(elem)
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
        Color_Toolbar_Button_As_Down(gridButton);
    else
        Color_Toolbar_Button_When_Up(gridButton);

    canvasCells.forEach(function(cell)
    {
        if(cell.style.outline === "")
            cell.style.outline = GRID_OUTLINE_CSS;
        else
            cell.style.outline = "";
    })

}

function Add_EventHandlers_To_Copy_Button()
{
    function Copy_To_Clipboard()
    {
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
        popupMessage.innerHTML = "Hexvalues Copied to Clipboard!";
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
        if(altKeyDown)
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
    let canvas_state = Get_Canvas_State();
    state_array.decPtr();

    Transfer_Canvas_State_To_Screen(state_array.ptr);
}

function Redo()
{
    let canvas_state = Get_Canvas_State();
    state_array.incPtr();

    Transfer_Canvas_State_To_Screen(state_array.ptr);
}

function Activate_Tool(object)
{
    let button = document.getElementById(object["button-id"]);
    let bkgdColor = button.style.backgroundColor;

    if(bkgdColor === BUTTON_UP_RGB)  // check if tool is active already
    {
        // set cursor
        document.getElementById("canvas-div").style.cursor = object["cursor"];
        Color_Toolbar_Button_As_Down(button);

        // deactivate all other toolbar buttons
        const toolbarObjectArray = [
            selectionObj,
            fillObj,
            eraserObj,
            colorpickerObj,
            pencilObj,
        ];
        toolbarObjectArray.forEach(function(item){
            if(item["button-id"] !== object["button-id"])
            {
                let btn = document.getElementById(item["button-id"]);
                Color_Toolbar_Button_When_Up(btn);
            }
        })
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
            altKeyDown = true;
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

        // switch tool from toolbar
        if(e.code === selectionObj["hotkey"])
        {
            Activate_Tool(selectionObj);
        }
        else
        if(e.code === fillObj["hotkey"])
        {
             Activate_Tool(fillObj);
        }
        else
        if(e.code === eraserObj["hotkey"])
        {
             Activate_Tool(eraserObj);
        }
        else
        if(e.code === colorpickerObj["hotkey"])
        {
             Activate_Tool(colorpickerObj);
        }
        else
        if(e.code === pencilObj["hotkey"])
        {
             Activate_Tool(pencilObj);
        }

        if(e.code === gridObj["hotkey"])
        {
            gridObj["KeyG_Counter"] += 1;
        }
    })

    document.addEventListener("keyup", function(e){
        if(e.code === "AltLeft" || e.code === "AltRight")
        {
            altKeyDown = false;
        }
        if(e.code == gridObj["hotkey"])
        {
            gridObj["KeyG_Counter"] = 0;
            Toggle_Grid();
        }
    })
}

function Set_Palette_Preview_Color()
{
    palettePreview = document.getElementById("palette-preview");
    palettePreview.style.backgroundColor = active_color;
}


Color_All_Toolbar_Buttons();
Update_Active_Color_Preview();
Populate_Canvas_With_Cells();
Populate_Palette_With_Cells();
Set_Palette_Preview_Color();
Add_Ids_To_Palette_Cells();
Activate_Tool(pencilObj);

Add_EventHandlers_To_Canvas_Cells();
Add_EventHandlers_To_Canvas_Div();
Add_EventHandlers_To_Document();
Add_EventHandlers_To_Palette_Cells();
Add_EventHandlers_To_Grid_Button();
Add_EventHandlers_To_Copy_Button();

let state_array = new Canvas_State_Object(MAX_UNDOS);
