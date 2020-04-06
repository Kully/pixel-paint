console.log("Welcome to Pixel Paint");
console.log("https://github.com/Kully/pixel-paint/issues/1");

// LAYOUT
const TOOLBAR_HEIGHT = 32;
const TOOLBAR_WIDTH = 700;
const PALETTE_WIDTH = 700;
const PALETTE_RMARGIN = 20;
const THE_CANVAS_TOTAL_W = (TOOLBAR_WIDTH - PALETTE_WIDTH - PALETTE_RMARGIN)/32;

const CELLS_PER_ROW = 32;
const CELL_WIDTH_PX = 19;
const MAX_UNDOS = 25;
const GRID_COLOR = "1px dashed #aaa";
const BUTTON_UP_COLOR = "#dedede";
const BUTTON_UP_RGB = "rgb(222, 222, 222)";
const BUTTON_DOWN_COLOR = "#777";
const INIT_COLOR = "white";

let crosshairObj = {
    "id": "crosshair-button",
    "hotkey": "KeyQ",
    "isKeyDown": false,
    "cursor": "crosshair",
}
let fillObj = {
    "id": "fill-button",
    "hotkey": "KeyW",
    "isKeyDown": false,
    "cursor": 'url("img/fill.png") 28 16, auto',
}
let eraserObj = {
    "id": "eraser-button",
    "hotkey": "KeyE",
    "isKeyDown": false,
    "cursor": 'url("img/eraser.png") 16 16, auto',
}
let colorpickerObj = {
    "id": "colorpicker-button",
    "hotkey": "KeyR",
    "isKeyDown": false,
    "cursor": 'url("img/colorpicker.png") -32 32, auto',
}

let palette_color_array = [
    "#fff",
    "#000",
    "gray",
    "red",
    "orange",
    "yellow",
    "blue",
    "deepskyblue",
    "navy",
    "green",
    "olive",
    "salmon",
    "pink",
    "purple",
    "teal"
];

// VARIABLES
let last_active_color = "";
let active_color = "black";
let brush_down = false;
let active_tool = "";
let KeyG_Counter = 0;


function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function Set_Width_Height_Of_CanvasCell()
{
    const canvasCellArray = document.querySelectorAll(".canvasCell");
    canvasCellArray.forEach(function(cell) {
        cell.style.width =  CELL_WIDTH_PX + "px";
        cell.style.height = CELL_WIDTH_PX + "px";
    })  
}

function Color_Buttons()
{
    let buttons = document.querySelectorAll("button");
    buttons.forEach(function(b) {
        b.style.backgroundColor = BUTTON_UP_COLOR;
    })
}

function Update_Active_Color_Preview()
{
    let activeColorDiv = document.getElementById("active-color-preview");
    activeColorDiv.style.backgroundColor = active_color;
}

function Populate_Canvas_With_Cells()
{
    const canvasDiv = document.getElementById("canvas-div");
    for(let i=0; i<CELLS_PER_ROW*CELLS_PER_ROW; i += 1)
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

        paletteDiv.appendChild(cell)
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
        item.id = "palette-cell-"+toString(j);
        j += 1;
    })
}

// PALETTE DIVS
function EventHandler_Update_Active_Color(e)
{
    active_color = e.target.style.backgroundColor;
    Update_Active_Color_Preview();
}

function Add_EventHandlers_To_Palette_Cells()
{
    const allPaletteCells = document.querySelectorAll(".paletteCell");
    allPaletteCells.forEach(function(item){
        item.addEventListener("mousedown",
            EventHandler_Update_Active_Color);
    })
}

// CANVAS
function Reset_Color_Of_Canvas_Cells()
{
    let canvasCells = document.querySelectorAll(".canvasCell");
    for(let i=0; i<CELLS_PER_ROW*CELLS_PER_ROW; i += 1)
    {
        canvasCells[i].style.backgroundColor = INIT_COLOR;
    }
}

function Add_EventHandlers_To_Reset_Button()
{
    const resetButton = document.getElementById("reset-button");
    resetButton.addEventListener("mousedown", Reset_Color_Of_Canvas_Cells)
    resetButton.addEventListener("mousedown", function(){
        let init_array = new Array(CELLS_PER_ROW * CELLS_PER_ROW).fill(INIT_COLOR);

        state_array.state_array = [init_array];
        state_array.ptr = 0;
        console.log("after reset button: ", state_array);
    })
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
    return x + CELLS_PER_ROW * y;
}

function Color_From_ID(node_id)
{
    return document.getElementById(node_id).style.backgroundColor;
}

function Cell_ID_To_Int(id)
{
    return Number(id);
}

function Cell_Int_To_ID(int)
{
    return int.toString().padStart(4, 0);
}

function Does_CellID_Exist(id)
{
    if(!document.getElementById(id))
        return false;
    return true;
}

function Cell_Coordinates_Out_Of_Bounds(x, y)
{
    if((0 <= x <= CELLS_PER_ROW-1) && (0 <= y <= CELLS_PER_ROW-1))
        return false;
    return true;
}

function Cell_Coordinates_In_Bounds(x, y)
{
    if((0 <= x <= CELLS_PER_ROW-1) && (0 <= y <= CELLS_PER_ROW-1))
        return true;
    return false;
}

function Flood_Fill_Algorithm(node_id, target_color, replacement_color)
{
    // grab X,Y from ID of Cell
    cell_int = Cell_ID_To_Int(node_id);
    cell_x = Get_X_From_CellInt(cell_int);
    cell_y = Get_Y_From_CellInt(cell_int);
    
    console.log(cell_x);
    console.log(cell_y);
    console.log("");
    return;

    if(Cell_Coordinates_Out_Of_Bounds(cell_x, cell_y))
        return;


    let cell_element = document.getElementById(node_id);
    if(target_color === replacement_color)
        return;
    else if(Color_From_ID(node_id) !== target_color)
        return;
    else
    {
        cell_element.style.backgroundColor = replacement_color;  // set color

        if(Cell_Coordinates_In_Bounds(x+1, y))
        {
            let cell_int = Get_CellInt_From_XY(cell_x, cell_y+1);
            let next_node_id = Cell_Int_To_ID(idx_new);

            Flood_Fill_Algorithm(next_node_id,
                                 target_color,
                                 replacement_color);
        }
        if(Cell_Coordinates_In_Bounds(x-1, y))
        {

        }
        if(Cell_Coordinates_In_Bounds(x, y+1))
        {

        }
        if(Cell_Coordinates_In_Bounds(x, y-1))
        {

        }

        // north
        if((0 <= cell_x <= CELLS_PER_ROW-1) && (0 <= cell_y-1 <= CELLS_PER_ROW-1))
        {
            console.log("  > north");
            let idx_new = Get_CellInt_From_XY(cell_x, cell_y-1);
            let next_node = Cell_Int_To_ID(idx_new);
            Flood_Fill_Algorithm(next_node,
                                 target_color,
                                 replacement_color);
        }

        // west
        if((0 <= cell_x-1 <= CELLS_PER_ROW-1) && (0 <= cell_y <= CELLS_PER_ROW-1))
        {
            console.log("  > west");
            let idx_new = Get_CellInt_From_XY(cell_x-1, cell_y);
            let next_node = Cell_Int_To_ID(idx_new);
            Flood_Fill_Algorithm(next_node,
                                 target_color,
                                 replacement_color);
        }

        // east
        if((0 <= cell_x+1 <= CELLS_PER_ROW-1) && (0 <= cell_y <= CELLS_PER_ROW-1))
        {
            console.log("  > east");
            let idx_new = Get_CellInt_From_XY(cell_x+1, cell_y);
            let next_node = Cell_Int_To_ID(idx_new);
            Flood_Fill_Algorithm(next_node,
                                 target_color,
                                 replacement_color);
        }
    }

// Flood-fill (node, target-color, replacement-color):
//  1. If target-color is equal to replacement-color, return.
//  2. ElseIf the color of node is not equal to target-color, return.
//  3. Else Set the color of node to replacement-color.
//  4. Perform Flood-fill (one step to the south of node, target-color, replacement-color).
//     Perform Flood-fill (one step to the north of node, target-color, replacement-color).
//     Perform Flood-fill (one step to the west of node, target-color, replacement-color).
//     Perform Flood-fill (one step to the east of node, target-color, replacement-color).
//  5. Return. 
}

function Add_EventHandlers_To_Canvas_Cells()
{
    function Tool_Action_On_Canvas_Cell(e)
    {
        const cursor = document.body.style.cursor;
        if(cursor === eraserObj["cursor"])
        {
            e.target.style.backgroundColor = INIT_COLOR;
        }
        else if(cursor === colorpickerObj["cursor"])
        {
            active_color = e.target.style.backgroundColor;
            Update_Active_Color_Preview()
        }
        else if(cursor === fillObj["cursor"])
        {
            // do nothing
        }
        else if(cursor === crosshairObj["cursor"])
        {
            // do nothing
        }
        else
        {
            e.target.style.backgroundColor = active_color;
        }
    }

    const canvasCells = document.querySelectorAll(".canvasCell");
    for(let i=0; i<CELLS_PER_ROW*CELLS_PER_ROW; i += 1)
    {
        canvasCells[i].addEventListener("mousemove", function(e) {
            if(brush_down)
                Tool_Action_On_Canvas_Cell(e)
        });
        canvasCells[i].addEventListener("mousedown", Tool_Action_On_Canvas_Cell);
        canvasCells[i].addEventListener("mouseup", function(e) {

            // FILL only works on mouse up
            const cursor = document.body.style.cursor;
            if(cursor === fillObj["cursor"])
            {
                let node = e.target.id;
                let target_color = e.target.style.backgroundColor;
                let replacement_color = active_color;

                Flood_Fill_Algorithm(e.target.id,
                                     target_color,
                                     replacement_color)
            }
        });
    }
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
    const canvasCells = document.querySelectorAll(".canvasCell");
    canvasCells.forEach(function(cell)
    {
        if(cell.style.outline == "")
            cell.style.outline = GRID_COLOR;
        else
            cell.style.outline = "";
    })
}

function Add_EventHandlers_To_Grid_Button()
{
    let gridButton = document.getElementById("toggle-grid-button");
    gridButton.addEventListener("click", Toggle_Grid);

    gridButton.addEventListener("click", function(e) {
        const canvasCells = document.querySelectorAll(".canvasCell");
    });
}

function Add_EventHandlers_To_Save_Button()
{
    let saveButton = document.getElementById("save-button");
    let outputDiv = document.getElementById("output-div");
    saveButton.addEventListener("click", function(e){
        let text = "array = [";
        Get_Canvas_State().forEach(function(color){
            text += color + ", ";
        })
        text += "]";
        alert(text);
    });
}

function _Arrays_Are_Equal(a, b)
{
    if(a === b.length) return true;
    if(a.length !== b.length) return false;

    for(let i=0; i<a.length;i += 1)
    {
        if(a[i] !== b[i]) return false;
    }
    return true;
}

function Get_Canvas_State()
{
    let canvasCells = document.querySelectorAll(".canvasCell");
    let canvas_state = [];  // 32 x 32 color array
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

function Toggle_ToolbarButton_Color(object)
{
    object["isKeyDown"] = true;

    let button = document.getElementById(object["id"]);
    let bkgdColor = button.style.backgroundColor;

    if(bkgdColor === BUTTON_UP_RGB)
    {
        // button press
        document.body.style.cursor = object["cursor"];
        Color_Toolbar_Button_When_Down(button);

        // release all other buttons
        let toolbarObjectsArray = [
            crosshairObj,
            fillObj,
            eraserObj,
            colorpickerObj,
        ];
        toolbarObjectsArray.forEach(function(item){
            console.log(item["id"]);
            if(item["id"] !== object["id"])
            {
                let btn = document.getElementById(item["id"]);
                Color_Toolbar_Button_When_Up(btn);
            }
        })
    }
    else
    {
        document.body.style.cursor = "default";  // reset cursor
        Color_Toolbar_Button_When_Up(button);    // button release
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
        if(e.code === "KeyZ")
        {
            Undo();
        }
        if(e.code === "KeyX")
        {
            Redo();
        }
        if(e.code === crosshairObj["hotkey"])
        {
            if(crosshairObj["isKeyDown"] === false)
            {
                Toggle_ToolbarButton_Color(crosshairObj);
                console.log("crosshairObj");
            }
        }
        if(e.code === fillObj["hotkey"])
        {
            if(fillObj["isKeyDown"] === false)
            {
                Toggle_ToolbarButton_Color(fillObj);
                console.log("fillObj");
            }
        }
        if(e.code === eraserObj["hotkey"])
        {
            if(eraserObj["isKeyDown"] === false)
            {
                Toggle_ToolbarButton_Color(eraserObj);
                 console.log("eraserObj");
            }
        }
        if(e.code === colorpickerObj["hotkey"])
        {
            if(colorpickerObj["isKeyDown"] === false)
            {
                Toggle_ToolbarButton_Color(colorpickerObj);
                console.log("colorpickerObj");
            }
        }


        if(e.code === "KeyG")  // grid
        {
            Toggle_Grid;
            KeyG_Counter += 1;
        }
    })

    document.addEventListener("keyup", function(e){
        // toolbar
        if(e.code == crosshairObj["hotkey"])
        {
            crosshairObj["isKeyDown"] = false;
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


        if(e.code == "KeyG")  // grid
        {
            KeyG_Counter = 0;
            Toggle_Grid();

            document.body.style.cursor = "default";
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
Set_Width_Height_Of_CanvasCell();
Populate_Palette_With_Cells();
Add_Ids_To_Palette_Cells();


// event handlers
Add_EventHandlers_To_Document();
Add_EventHandlers_To_Canvas_Div();
Add_EventHandlers_To_Canvas_Cells();
Add_EventHandlers_To_Palette_Cells();
Add_EventHandlers_To_Reset_Button();
Add_EventHandlers_To_Grid_Button();
Add_EventHandlers_To_Save_Button();

let state_array = new Canvas_State_Object(MAX_UNDOS);
