console.log("Welcome to Pixel Paint");
console.log("https://github.com/Kully/pixel-paint/issues/1");

// VARIABLES
const GRID_WIDTH = 32;
const GRID_COLOR = "1px dashed #aaa";
const BUTTON_COLOR_OFF = "#50d890";
const BUTTON_COLOR_ON = "#c9f2dc";
const INIT_COLOR = "white";
const MAX_UNDOS = 25;

var KeyE_Counter = 0;
var KeyG_Counter = 0;
var KeyF_Counter = 0;
var KeyC_Counter = 0;

var last_active_color = "";
var active_color = "black";
var brush_down = false;
var palette_color_array = [
    "white",
    "black",
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
    "teal",
    "turquoise",
];


function Canvas_State_Object(maxSize) {
    let init_array = new Array(GRID_WIDTH * GRID_WIDTH).fill(INIT_COLOR);
    this.state_array = [init_array];    // empty array
    this.ptr = 0;                       // pointer
    this.maxSize = maxSize;             // maximum size
}
Canvas_State_Object.prototype.decPtr = function()
{
    if(this.ptr <= 0)
    {
        this.print();
        return;
    }
    this.ptr--;
    this.print();
};
Canvas_State_Object.prototype.incPtr = function()
{
    if(this.ptr >= this.state_array.length-1)
    { 
        this.print();
        return;
    }
    this.ptr++;
    this.print();
};
Canvas_State_Object.prototype.pushToPtr = function(item)
{
    if(canPush(item, this.state_array, this.ptr))
    {
        this.ptr++;
        this.state_array.splice(this.ptr, 0, item);
    }

    // slice off array after ptr
    this.state_array = this.state_array.slice(0, this.ptr+1);

    this._manageSize();
    this.print();
}
Canvas_State_Object.prototype._manageSize = function(item)
{
    if(this.state_array.length > this.maxSize)
    {
        this.state_array.shift();
        this.ptr--;
    }
    this.print();
}
Canvas_State_Object.prototype.ptrToEndOfStateArray = function(item)
{
    this.ptr = this.state_array.length - 1;
}
Canvas_State_Object.prototype.print = function()
{
    console.log(this);
}


function Color_Buttons()
{
    var buttons = document.querySelectorAll("button");
    buttons.forEach(function(b)
    {
        b.style.backgroundColor = BUTTON_COLOR_OFF;
    })
}

function Color_Active_Color_Div()
{
    var activeColorDiv = document.getElementById("active-color-div");
    activeColorDiv.style.backgroundColor = active_color;
}

function Populate_Canvas_With_Cells()
{
    const canvasDiv = document.getElementById("canvas-div");
    for(let i=0; i<GRID_WIDTH*GRID_WIDTH; i++)
    {
        let div = document.createElement("div");
        div.className = "canvasCell";
        div.id = i.toString().padStart(4, 0);
        div.style.backgroundColor = INIT_COLOR;
        canvasDiv.appendChild(div);
    }
}

function Populate_Palette_With_Cells()
{
    const paletteDiv = document.getElementById("palette-div");

    for(let i=0; i<palette_color_array.length; i++)
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
        j++;
    })
}

// PALETTE DIVS
function EventHandler_Update_Active_Color(e)
{
    active_color = e.target.style.backgroundColor;
    Color_Active_Color_Div();
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
    for(let i=0; i<GRID_WIDTH*GRID_WIDTH; i++)
    {
        canvasCells[i].style.backgroundColor = INIT_COLOR;
    }
}

function Add_EventHandlers_To_Reset_Button()
{
    const resetButton = document.getElementById("reset-button");
    resetButton.addEventListener("mousedown", Reset_Color_Of_Canvas_Cells)
    resetButton.addEventListener("mousedown", function(){
        let init_array = new Array(GRID_WIDTH * GRID_WIDTH).fill(INIT_COLOR);
        
        state_array.state_array = [init_array];
        state_array.ptr = 0;
        console.log("after reset button: ", state_array);
    })
}

function Add_EventHandlers_To_Canvas_Cells()
{
    function Color_Canvas_Cell_If_Drawing_Mode(e)
    {
        if(brush_down)
            e.target.style.backgroundColor = active_color;
    }

    const canvasCells = document.querySelectorAll(".canvasCell");
    for(let i=0; i<GRID_WIDTH*GRID_WIDTH; i++)
    {
        canvasCells[i].addEventListener("mousemove",
            Color_Canvas_Cell_If_Drawing_Mode
        );
        canvasCells[i].addEventListener("mousedown", function(e) {
            e.target.style.backgroundColor = active_color;
        });
    }
}

// GRIDS
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
    var gridButton = document.getElementById("toggle-grid-button");
    gridButton.addEventListener("click", Toggle_Grid);

    gridButton.addEventListener("click", function(e) {
        const canvasCells = document.querySelectorAll(".canvasCell");
        canvasCells.forEach(function(cell)
        {
            if(cell.style.outline == "")
                e.target.style.backgroundColor = BUTTON_COLOR_ON;
            else
                e.target.style.backgroundColor = BUTTON_COLOR_OFF;
        })
    });
}

function Add_EventHandlers_To_Save_Button()
{
    let saveButton = document.getElementById("save-button");
    let outputDiv = document.getElementById("output-div");
    saveButton.addEventListener("click", function(e){
        let text = ""; 
        Get_Canvas_State().forEach(function(color){
            text += color + "<br> ";
        })
        outputDiv.innerHTML = text;
    });
}

function _Arrays_Are_Equal(a, b)
{
    if(a === b.length) return true;
    if(a.length !== b.length) return false;

    for(let i=0; i<a.length;i++)
    {
        if(a[i] !== b[i]) return false;
    }
    return true;
}
function canPush(thisState, state_array, ptr)
{
    if(ptr === 0) return true;
    if(!_Arrays_Are_Equal(thisState, state_array[ptr-1])) return true;
    
    return false;
}


function Get_Canvas_State()
{
    let canvasCells = document.querySelectorAll(".canvasCell");
    let canvas_state = [];  // 32x32 color array
    canvasCells.forEach(function(cell){
        canvas_state.push(cell.style.backgroundColor);
    })

    return canvas_state;
}

function Transfer_Canvas_State_To_Screen(ptr)
{
    var saved_canvas = state_array.state_array[ptr];
    var canvasCells = document.querySelectorAll(".canvasCell");

    for(let i=0; i<GRID_WIDTH*GRID_WIDTH; i++)
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


function Add_EventHandlers_To_Document()
{
    function Exit_Drawing_Mode() { brush_down = false; }

    function Add_CanvasState_To_CanvasStateObject()
    {
        var canvas_state = Get_Canvas_State();
        state_array.pushToPtr(canvas_state);
    }

    document.addEventListener("mouseup", Add_CanvasState_To_CanvasStateObject);
    document.addEventListener("mouseup", Exit_Drawing_Mode);
    document.addEventListener("keydown", function(e){
        if(e.code === "KeyZ")
        {
            Undo();
        }
        if(e.code === "KeyX")
        {
            Redo();
        }
        if(e.code === "KeyG")
        {
            Toggle_Grid;
            KeyG_Counter += 1;
        }
        if(e.code === "KeyE")
        {
            KeyE_Counter += 1;
            if(KeyE_Counter === 1)
                last_active_color = active_color;
            if(KeyE_Counter > 0)
                active_color = INIT_COLOR;
        }
        if(e.code === "KeyC")
        {
            KeyC_Counter += 1;
            
            if(KeyC_Counter > 0) { document.body.style.cursor = "crosshair";}
        }
    })

    document.addEventListener("keyup", function(e){
        if(e.code == "KeyE")
        {
            KeyE_Counter = 0;
            active_color = last_active_color;
            last_active_color = "";
        }
        if(e.code == "KeyG")
        {
            KeyE_Counter = 0;
            Toggle_Grid();
        }
        if(e.code == "KeyC")
        {
            KeyC_Counter = 0;
            document.body.style.cursor = "default";
        }
    })
}


// **************
// CALL FUNCTIONS
// **************

// init
Color_Buttons();
Color_Active_Color_Div();
Populate_Canvas_With_Cells();
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

var state_array = new Canvas_State_Object(10);
