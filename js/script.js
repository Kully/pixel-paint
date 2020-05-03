const CELLS_PER_ROW = 32;
const CELL_WIDTH_PX = 16;
const MAX_UNDOS = 35;
const GRID_OUTLINE_CSS = "1px dashed #aaa";
const SELECTION_LOCKED_OUTLINE = "1px dashed #ff0000";
const BUTTON_UP_COLOR = "#a0a0a0";
const BUTTON_DOWN_COLOR = "#f0f0f0";
const CANVAS_INIT_COLOR = palette_color_array[0];


const State = {
    "activeColor": palette_color_array[2],
    "activeTool": "pencil-button",
    "brushDown": false,
    "canvasLayer2": new Array( Math.pow(CELLS_PER_ROW, 2) ).fill(-1),
    "grid": {
        "KeyG_Counter": 0,
        "hotkey": "KeyG",
        "isToggled": false,
    },
    "altKeyDown": false,
    "selection": {
        "startX": 0,
        "startY": 0,
        "isLocked": false,
        "floatingCopy": false,
    },
    "selectionCopy": {
        "initCursorX": 0,
        "initCursorY": 0,
        "left": 0,
        "top": 0,
        "colorArray": [],
    },
}


function Canvas_Cursor_XY(e)
{
    let parentCell = e.target.closest("div.canvasCell");
    let x = parentCell.offsetLeft;
    let y = parentCell.offsetTop;
    return [x, y];
}
    
function Canvas_Cursor_XY_Rounded_To_Neareset_Cell_Corner(e)
{
    let parentCell = e.target.closest("div.canvasCell");
    let parentCellId = parseInt(parentCell.id);
    const maxId = Math.pow(CELLS_PER_ROW, 2) - 1;

    let x = 0;
    if( e.offsetX <= Math.floor( CELL_WIDTH_PX / 2 ) )
    {
        x = parentCell.offsetLeft;
    }
    else if( Get_X_From_CellInt(Number(parentCellId)) === CELLS_PER_ROW - 1 )
    {
        x = parentCell.offsetLeft + CELL_WIDTH_PX;  // right side of canvas
    }
    else
    {
        let rightCell = document.getElementById(Pad_Start_Int(parentCellId+1));
        x = rightCell.offsetLeft;
    }

    let y = 0;
    if( e.offsetY <= Math.floor( CELL_WIDTH_PX / 2 ) )
    {
        y = parentCell.offsetTop;
    }
    else
    if( parseInt(parentCell.id)+CELLS_PER_ROW > maxId )  // bottom of canvas
    {
        y = parentCell.offsetTop + CELL_WIDTH_PX;
    }
    else
    {
        let cellIdBelow = Pad_Start_Int(parentCellId + CELLS_PER_ROW);
        let belowCell = document.getElementById(cellIdBelow);
        y = document.getElementById(cellIdBelow).offsetTop;
    }
    return [x, y];
}

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
    canvasDiv.addEventListener("mousedown", function() {
        State["brushDown"] = true;
    });

    canvasDiv.addEventListener("mousemove", Update_Cursor_Coordinates_On_Screen)
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
    activeColorDiv.style.backgroundColor = State["activeColor"];
    Update_Active_Color_Label();
}

function Alert_User(text)
{
    let popupMessage = document.getElementById("popup-message");
    popupMessage.classList.remove("fadeOutAnimation");
    void popupMessage.offsetWidth;
    popupMessage.innerHTML = text;
    popupMessage.style.animationPlayState = "running";
    popupMessage.classList.add("fadeOutAnimation");
}

function Update_Active_Color_Label()
{
    activeColorLabel = document.getElementById("active-color-label");

    State["activeColor"] = Rgb_To_Hex(State["activeColor"]);

    activeColorLabel.innerHTML = State["activeColor"];    // label
    activeColorLabel.style.color = State["activeColor"];  // text color
}

function Add_EventHandlers_To_Palette_Cells()
{
    const allPaletteCells = document.querySelectorAll(".paletteCell");
    const colorPreview = document.getElementById("palette-preview");

    allPaletteCells.forEach(function(cell){
        // click palette to change color
        cell.addEventListener("click", function(e){
            State["activeColor"] = e.target.style.backgroundColor;
            Update_Active_Color_Preview();
            Update_Active_Color_Label();
        })
        // on hover, update the color preview above
        cell.addEventListener("mouseenter", function(e){
             colorPreview.style.backgroundColor = e.target.style.backgroundColor;
        })
    })
}

function Canvas_Pixels_From_Selection(selection)
{
    let selectionLeft = Px_To_Int(selection.style.left);
    let selectionTop = Px_To_Int(selection.style.top);
    let selectionWidth = Px_To_Int(selection.style.width);
    let selectionHeight = Px_To_Int(selection.style.height);

    console.log("")
}

function Reset_Color_Of_Canvas_Cells()
{
    let canvasCells = document.querySelectorAll(".canvasCell");
    for(let i=0; i<CELLS_PER_ROW*CELLS_PER_ROW; i += 1)
    {
        canvasCells[i].style.backgroundColor = CANVAS_INIT_COLOR;
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
}

function Canvas_Pixels_From_Selection()
{
    const selection = document.getElementById("selection");

    // calculate
    let left = Px_To_Int(selection.style.left);
    let top = Px_To_Int(selection.style.top);
    let cell0 = Get_CellInt_From_CellXY(left / CELL_WIDTH_PX, top / CELL_WIDTH_PX);
    let width = Px_To_Int(selection.style.width) / CELL_WIDTH_PX;
    let height = Px_To_Int(selection.style.height) / CELL_WIDTH_PX;

    let colorArray = [];
    for(let y=0; y<height; y+=1)
    for(let x=0; x<width; x+=1)
    {
        let id = Pad_Start_Int(y * CELLS_PER_ROW + cell0 + x);
        let cell = document.getElementById(id);
        let color = Rgb_To_Hex(cell.style.backgroundColor);
        colorArray.push(color);
    }
    return colorArray;
}


function CursorXY_In_Selection(cursorXY, selection)
{
    let selectionLeft = Px_To_Int(selection.style.left);
    let selectionTop = Px_To_Int(selection.style.top);
    let selectionWidth = Px_To_Int(selection.style.width);
    let selectionHeight = Px_To_Int(selection.style.height);

    if( (cursorXY[0] >= selectionLeft) &&
        (cursorXY[0] <= selectionLeft + selectionWidth) &&
        (cursorXY[1] >= selectionTop) &&
        (cursorXY[1] <= selectionTop + selectionHeight) )
        return 1;
    return 0;
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

        State["selection"]["startX"] = cursorXY[0];
        State["selection"]["startY"] = cursorXY[1];

        canvasDiv.appendChild(selection);
    }

    function Selection_Mousedown(e)
    {
        if(State["activeTool"] === "selection")
        {
            let selection = document.getElementById("selection");
            let cursorXY = Canvas_Cursor_XY(e);

            if( (State["altKeyDown"] === true) &&
                (State["selection"]["isLocked"] === true) &&
                (selection) &&  // selection in DOM
                CursorXY_In_Selection(cursorXY, selection) )
            {
                console.log("FloatingCopy mode activated!");
                State["selection"]["floatingCopy"] = true;

                let colorArray = Canvas_Pixels_From_Selection();
                State["selectionCopy"]["colorArray"] = colorArray;

                State["selectionCopy"]["initCursorX"] = cursorXY[0] / CELL_WIDTH_PX;
                State["selectionCopy"]["initCursorY"] = cursorXY[1] / CELL_WIDTH_PX;
            }
            else
            {
                Remove_Selection();
                Init_Selection_Pixels();
                Unlock_Selection();
                Create_Selection_Div(e);
            }
        }
    }

    function Selection_Mousemove(e)
    {
        let cursor = Get_Cursor();
        const selection = document.getElementById("selection");

        if( (State["activeTool"] === "selection") &&
            (State["selection"]["isLocked"] === false) )
        {
            const canvasDiv = document.getElementById("canvas-div");

            if(!selection)
                return;

            // update selection coordinates and dimensions
            const cursorXY = Canvas_Cursor_XY_Rounded_To_Neareset_Cell_Corner(e);
            if(cursorXY[0] < State["selection"]["startX"])
            {
                selection.style.left = cursorXY[0] + "px";
                selection.style.width = Math.abs(cursorXY[0] - State["selection"]["startX"]) + "px";
            }
            else
            {
                let newWidth = cursorXY[0] - Px_To_Int(selection.style.left);
                newWidth = Math.ceil(newWidth);
                newWidth = newWidth - (newWidth % CELL_WIDTH_PX);

                selection.style.left = State["selection"]["startX"] + "px";
                selection.style.width = newWidth + "px";
            }

            if(cursorXY[1] < State["selection"]["startY"])
            {
                selection.style.top = cursorXY[1] + "px";
                selection.style.height = Math.abs(cursorXY[1] - State["selection"]["startY"]) + "px";
            }
            else
            {
                let newHeight = cursorXY[1] - Px_To_Int(selection.style.top);
                newHeight = Math.floor(newHeight);
                newHeight = newHeight - (newHeight % CELL_WIDTH_PX);

                selection.style.top = State["selection"]["startY"] + "px";
                selection.style.height = newHeight + "px";
            }

            // trim off a pixel for width and height
            let width = Px_To_Int(selection.style.width);
            selection.style.width = (width - 1) + "px";
            let height = Px_To_Int(selection.style.height);
            selection.style.height = (height - 1) + "px";

            return;
        }
        else
        if( (State["activeTool"] === "selection") &&
            (State["selection"]["isLocked"] === true) )
        {
            let cursorXY = Canvas_Cursor_XY(e);
            if( State["selection"]["floatingCopy"] === true )
            {
                Set_Cursor("move");
                console.log("Move_Floating_Copy");

                // drag copied selection
                let selection_dx = (cursorXY[0]/CELL_WIDTH_PX) - State["selectionCopy"]["initCursorX"];
                let selection_dy = (cursorXY[1]/CELL_WIDTH_PX) - State["selectionCopy"]["initCursorY"];
                let selectionLeft = Px_To_Int(selection.style.left) / CELL_WIDTH_PX;
                let selectionTop = Px_To_Int(selection.style.top) / CELL_WIDTH_PX;

                // boundaries check: newSelectionCopy strictly within canvas
                // ...

                if(1 === 2)
                    return;

                // draw canvas state before drag start
                for(let i=0; i<Math.pow(CELLS_PER_ROW, 2); i+=1)
                {
                    let cell = document.getElementById(Pad_Start_Int(i,4));
                    cell.style.backgroundColor = HISTORY_STATES.getCurrentState()[i];
                }

                // draw selectionCopy to screen
                let width = (Px_To_Int(selection.style.width)+1) / CELL_WIDTH_PX;
                let height = (Px_To_Int(selection.style.height)+1) / CELL_WIDTH_PX;
                let cell0 = Get_CellInt_From_CellXY(selectionLeft + selection_dx,
                                                    selectionTop + selection_dy);
                for(let y=0; y<height; y+=1)
                for(let x=0; x<width; x+=1)
                {
                    let id = Pad_Start_Int(cell0 + y*CELLS_PER_ROW + x);
                    let cell = document.getElementById(id);
                    let color = State["selectionCopy"]["colorArray"][x + y*width];
                    cell.style.backgroundColor = color;
                }

                // record new left and right
                State["selectionCopy"]["left"] = selectionLeft + selection_dx;
                State["selectionCopy"]["top"] = selectionTop + selection_dy;
            }
            else
            if( (CursorXY_In_Selection(cursorXY, selection) &&
                 State["altKeyDown"] === true) )
            {
                Set_Cursor("move");
                console.log("mousemove: cursorInSelection + altDown");
            }
        }
    }

    function Selection_Mouseup(e)
    {
        let cursor = Get_Cursor();

        if( State["activeTool"] === "selection" &&
            State["selection"]["isLocked"] === false )
        {
            let selection = document.getElementById("selection");
            let selectionWidth = selection.style.width;
            let selectionHeight = selection.style.height;

            if( (selectionWidth === "0px") || (selectionWidth === "") ||
                (selectionHeight === "0px") || (selectionHeight === "") )
            {
                Remove_Selection();
                Init_Selection_Pixels();
                Unlock_Selection();
            }
            else
            {
                Selection_Locked_To_Grid();
                Alert_User("<i>Alt+Drag</i> to Copy");
            }
        }
        else
        if( State["activeTool"] === "selection" &&
            State["selection"]["isLocked"] === true )
        {
            console.log("floatingCopy placed");
            let selection = document.getElementById("selection");
            let selectionWidth = selection.style.width;
            let selectionHeight = selection.style.height;

            // draw selection around placed copy
            selection.style.left = State["selectionCopy"]["left"] * CELL_WIDTH_PX + "px";
            selection.style.top = State["selectionCopy"]["top"] * CELL_WIDTH_PX + "px";
            State["selection"]["floatingCopy"] = false;

            if(State["altKeyDown"] === false)
            {
                Set_Cursor(Tools["selection"]["cursor"]);
            }
        }
    }

    function Tool_Action_On_Canvas_Cell(e)
    {
        let cursor = Get_Cursor();
        if(cursor === Tools["eraser"]["cursor"])
        {
            e.target.style.backgroundColor = CANVAS_INIT_COLOR;
        }
        else
        if(cursor === Tools["colorpicker"]["cursor"])
        {
            State["activeColor"] = e.target.style.backgroundColor;
            Update_Active_Color_Preview();
            Update_Active_Color_Label();
        }
        else
        if(cursor === Tools["fill"]["cursor"])
        {
            // nothing
        }
        else
        if(cursor === Tools["selection"]["cursor"])
        {
            // nothing
        }
        else if(cursor === Tools["pencil"]["cursor"])
        {
            e.target.style.backgroundColor = State["activeColor"];
        }
    }

    const canvasCells = document.querySelectorAll(".canvasCell");
    for(let i=0; i<CELLS_PER_ROW*CELLS_PER_ROW; i += 1)
    {
        canvasCells[i].addEventListener("mousedown", Selection_Mousedown);
        canvasCells[i].addEventListener("mousemove", Selection_Mousemove);
        canvasCells[i].addEventListener("mouseup", Selection_Mouseup);
        canvasCells[i].addEventListener("mousedown", Tool_Action_On_Canvas_Cell);

        canvasCells[i].addEventListener("mousemove", function(e) {
            if(State["brushDown"])
                Tool_Action_On_Canvas_Cell(e)
        });

        canvasCells[i].addEventListener("mouseup", function(e) {
            let cursor = Get_Cursor();
            if(cursor === Tools["fill"]["cursor"])
            {
                let cell_id = e.target.id;
                let target_color = e.target.style.backgroundColor;
                let replacement_color = State["activeColor"];

                Flood_Fill_Algorithm(cell_id,
                                     target_color,
                                     replacement_color)
            }
            else if(cursor === Tools["selection"]["cursor"])
            {
                // nothing
            }
        });
    
    }
}

function Selection_Locked_To_Grid()
{
    State["selection"]["isLocked"] = true;

    let selection = document.getElementById("selection");
    selection.style.outline = SELECTION_LOCKED_OUTLINE;
}

function Unlock_Selection()
{
    State["selection"]["isLocked"] = false;
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
    const gridButton = document.getElementById("grid-button");
    const canvasCells = document.querySelectorAll(".canvasCell");

    if(State["grid"]["isToggled"] === false)
    {
        Color_Toolbar_Button_As_Down(gridButton);
        canvasCells.forEach(function(cell) {
            cell.style.outline = GRID_OUTLINE_CSS;
        })
        State["grid"]["isToggled"] = true;
    }
    else
    {
        Color_Toolbar_Button_When_Up(gridButton);
        canvasCells.forEach(function(cell) {
            cell.style.outline = "";
        })
        State["grid"]["isToggled"] = false;
    }

    console.log(State["grid"]["isToggled"])
}

function Add_EventHandlers_To_Toolbar_Buttons()
{
    // let toolBtn;

    toolBtn = document.getElementById("undo-button");
    toolBtn.addEventListener("click", Undo);

    toolBtn = document.getElementById("redo-button");
    toolBtn.addEventListener("click", Redo);
    // toolBtn.addEventListener("click", function(e) {
    //     console.log("redo");
    //     Redo();
    // })

    toolBtn = document.getElementById("pencil-button");
    toolBtn.addEventListener("click", function(e) {
        Activate_Tool("pencil");
    })

    toolBtn = document.getElementById("fill-button");
    toolBtn.addEventListener("click", function(e) {
        Activate_Tool("fill");
    })

    toolBtn = document.getElementById("eraser-button");
    toolBtn.addEventListener("click", function(e) {
        Activate_Tool("eraser");
    })

    toolBtn = document.getElementById("selection-button");
    toolBtn.addEventListener("click", function(e) {
        Activate_Tool("selection");
    })

    toolBtn = document.getElementById("colorpicker-button");
    toolBtn.addEventListener("click", function(e) {
        Activate_Tool("colorpicker");
    })

    toolBtn = document.getElementById("grid-button");
    toolBtn.addEventListener("click", Toggle_Grid);
}

function Add_EventHandlers_To_Copy_Button()
{
    function Copy_To_Clipboard()
    {
        let canvasState = Get_Canvas_Pixels();
        let copiedText = "";
        canvasState.forEach(function(item) {
            copiedText += Rgb_To_Hex(item);
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

        Alert_User("Copied to Clipboard!");
    }

    let CopyButton = document.getElementById("copy-button");
    CopyButton.addEventListener("click", Copy_To_Clipboard);
}

function Remove_EventListeners_From_Selection()
{
    let selection = document.getElementById("selection");
}

function Get_Canvas_Pixels()
{
    let canvasCells = document.querySelectorAll(".canvasCell");
    let canvasPixels = [];
    canvasCells.forEach(function(cell){
        canvasPixels.push(cell.style.backgroundColor);
    })
    return canvasPixels;
}

function Transfer_Canvas_State_To_Screen(ptr)
{
    let savedCanvas = HISTORY_STATES.array[ptr];
    let canvasCells = document.querySelectorAll(".canvasCell");

    for(let i=0; i<CELLS_PER_ROW*CELLS_PER_ROW; i += 1)
        canvasCells[i].style.backgroundColor = savedCanvas[i];
}

function Init_Selection_Pixels()
{
    State["selection"]["pixels"] = [];
}

function Undo()
{
    HISTORY_STATES.decPtr();
    console.log(HISTORY_STATES);

    Transfer_Canvas_State_To_Screen(HISTORY_STATES.ptr);
}

function Redo()
{
    HISTORY_STATES.incPtr();
    console.log(HISTORY_STATES);

    Transfer_Canvas_State_To_Screen(HISTORY_STATES.ptr);
}

function Activate_Tool(label)
{
    let object = Tools[label];
    let button = document.getElementById(object["button-id"]);
    let buttonBkgdColor = button.style.backgroundColor;

    if(State["activeTool"] !== label)
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

        State["activeTool"] = label;
    }
}

function Add_EventHandlers_To_Document()
{
    function Exit_Drawing_Mode()
    {
        State["brushDown"] = false;
    }

    function Canvas_Pixels_To_History_States_Array()
    {
        console.log("Canvas_Pixels_To_History_States_Array");
        let canvasPixels = Get_Canvas_Pixels();
        HISTORY_STATES.pushToPtr(canvasPixels);
    }

    document.addEventListener("mouseup", function(e) {
        console.log(e.target.id !== "undo-button" && e.target.id !== "redo-button");
            Canvas_Pixels_To_History_States_Array(e);
    });
    document.addEventListener("mouseup", Exit_Drawing_Mode);
    document.addEventListener("keydown", function(e) {
        if(e.code === "AltLeft" || e.code === "AltRight")
        {
            State["altKeyDown"] = true;
            console.log("altkey => down");

            if( State["activeTool"] === "selection" &&
                State["selection"]["isLocked"] === true &&
                State["selection"]["isLocked"] === true)
            {
                Set_Cursor("move");
            }

        }
        if(e.code === "Escape")
        {
            Remove_Selection();
            Init_Selection_Pixels();
            Unlock_Selection();
            Set_Cursor(Tools[State["activeTool"]]["cursor"]);
        }
        if(e.code === "KeyZ")
        {
            Undo();
        }
        if(e.code === "KeyX")
        {
            Redo();
        }

        for(label in Tools)
        {
            if(e.code === Tools[label]["hotkey"])
            {
                Activate_Tool(label);
            }
        }

        if(e.code === State["grid"]["hotkey"])
        {
            State["grid"]["KeyG_Counter"] += 1;
        }
    })

    document.addEventListener("keyup", function(e){
        if(e.code === "AltLeft" || e.code === "AltRight")
        {
            State["altKeyDown"] = false;
            
            if( State["activeTool"] === "selection" &&
                State["selection"]["floatingCopy"] === false)
            {
                Set_Cursor(Tools["selection"]["cursor"]);
            }
        }
        if(e.code == State["grid"]["hotkey"])
        {
            State["grid"]["KeyG_Counter"] = 0;
            Toggle_Grid();
        }
    })
}

function Set_Palette_Preview_Color()
{
    palettePreview = document.getElementById("palette-preview");
    palettePreview.style.backgroundColor = State["activeColor"];
}


Color_All_Toolbar_Buttons();
Update_Active_Color_Preview();
Populate_Canvas_With_Cells();
Populate_Palette_With_Cells();
Set_Palette_Preview_Color();
Add_Ids_To_Palette_Cells();
Update_Tooltip_Text();
Activate_Tool("pencil");

Add_EventHandlers_To_Canvas_Cells();
Add_EventHandlers_To_Canvas_Div();
Add_EventHandlers_To_Document();
Add_EventHandlers_To_Palette_Cells();
Add_EventHandlers_To_Copy_Button();
Add_EventHandlers_To_Toolbar_Buttons();

let HISTORY_STATES = new History_States(MAX_UNDOS);

console.log("https://github.com/Kully/pixel-paint/issues/1");
