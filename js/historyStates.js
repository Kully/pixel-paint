function History_States(maxSize) {
    let arr = new Array(CELLS_PER_ROW * CELLS_PER_ROW).fill(CANVAS_INIT_COLOR);
    this.array = [arr];        // empty array
    this.ptr = 0;              // pointer
    this.maxSize = maxSize;    // maximum size
}
History_States.prototype.getCurrentState = function()
{
    return this.array[this.ptr];
}

History_States.prototype.decPtr = function()
{
    if(this.ptr <= 0)
        return;

    this.ptr--;
};
History_States.prototype.incPtr = function()
{
    if(this.ptr >= this.array.length-1)
        return;

    this.ptr += 1;
};
History_States.prototype.pushToPtr = function(item)
{
    if(_Can_Push(item, this.array, this.ptr))
    {
        this.ptr += 1;
        this.array.splice(this.ptr, 0, item);
    }

    // slice off array after ptr
    this.array = this.array.slice(0, this.ptr+1);

    this._manageSize();
}
History_States.prototype._manageSize = function(item)
{
    if(this.array.length > this.maxSize)
    {
        this.array.shift();
        this.ptr--;
    }
}
History_States.prototype.ptrToEndOfStateArray = function(item)
{
    this.ptr = this.array.length - 1;
}
History_States.prototype.print = function()
{
    console.log(this);
}


function _Can_Push(thisState, array, ptr)
{
    if(ptr === 0)
    {
        return true;
    }
    if(_Arrays_Are_Equal(thisState, array[ptr]) === false)
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
