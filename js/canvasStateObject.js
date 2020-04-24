function Canvas_Arrays_In_Memory(maxSize) {
    let init_array = new Array(CELLS_PER_ROW * CELLS_PER_ROW).fill(CANVAS_INIT_COLOR);
    this.state_array = [init_array];    // empty array
    this.ptr = 0;                       // pointer
    this.maxSize = maxSize;             // maximum size
}
Canvas_Arrays_In_Memory.prototype.decPtr = function()
{
    if(this.ptr <= 0)
        return;

    this.ptr--;
};
Canvas_Arrays_In_Memory.prototype.incPtr = function()
{
    if(this.ptr >= this.state_array.length-1)
        return;

    this.ptr += 1;
};
Canvas_Arrays_In_Memory.prototype.pushToPtr = function(item)
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
Canvas_Arrays_In_Memory.prototype._manageSize = function(item)
{
    if(this.state_array.length > this.maxSize)
    {
        this.state_array.shift();
        this.ptr--;
    }
}
Canvas_Arrays_In_Memory.prototype.ptrToEndOfStateArray = function(item)
{
    this.ptr = this.state_array.length - 1;
}
Canvas_Arrays_In_Memory.prototype.print = function()
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

console.log("canvasStateObject");
