function Rgb_To_Hex(rgb)
{
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

function Pad_Start_Int(int, pad=4)
{
    return int.toString().padStart(pad, 0);
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
        div.id = Pad_Start_Int(i);
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
