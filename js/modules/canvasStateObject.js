function Canvas_State_Object(maxSize) {
    let init_array = new Array(CELLS_PER_ROW * CELLS_PER_ROW).fill(INIT_COLOR);
    this.state_array = [init_array];    // empty array
    this.ptr = 0;                       // pointer
    this.maxSize = maxSize;             // maximum size
}
Canvas_State_Object.prototype.decPtr = function()
{
    if(this.ptr <= 0)
    {
        // this.print();
        return;
    }
    this.ptr--;
    // this.print();
};
Canvas_State_Object.prototype.incPtr = function()
{
    if(this.ptr >= this.state_array.length-1)
    {
        // this.print();
        return;
    }
    this.ptr += 1;
    // this.print();
};
Canvas_State_Object.prototype.pushToPtr = function(item)
{
    if(Can_Push(item, this.state_array, this.ptr))
    {
        this.ptr += 1;
        this.state_array.splice(this.ptr, 0, item);
    }

    // slice off array after ptr
    this.state_array = this.state_array.slice(0, this.ptr+1);

    this._manageSize();
    // this.print();
}
Canvas_State_Object.prototype._manageSize = function(item)
{
    if(this.state_array.length > this.maxSize)
    {
        this.state_array.shift();
        this.ptr--;
    }
    // this.print();
}
Canvas_State_Object.prototype.ptrToEndOfStateArray = function(item)
{
    this.ptr = this.state_array.length - 1;
}
Canvas_State_Object.prototype.print = function()
{
    console.log(this);
}

function Can_Push(thisState, state_array, ptr)
{
    if(ptr === 0) return true;
    if(!_Arrays_Are_Equal(thisState, state_array[ptr-1])) return true;    
    return false;
}


