# Pixel Paint

Make intuitve pixel art in this simple drawing tool in _vanilla javascript_

![Image](gif/selectionCopy.gif)

## features
- [x] 100% vanilla javascript!
- [x] pencil, fill, eraser, selection and colorpicker tools
- [x] implements undo and redo with a stack of canvas states
- [x] color palette from the NES
- [x] save your pixel art to PNG
- [x] original 32x32 cursors/button icons

## hotkeys

| Command          | Hotkey              |
| :--------------- | :------------------ |
| pencil mode      | P                   |
| bucket mode      | B                   |
| mode eraser mode | E                   |
| colorpicker mode | V                   |
| selection mode   | S                   |
| copy selection   | ALT+click and drag  |
| remove selection | Esc                 |
| toggle grid      | G                   |
| undo             | Z                   |
| redo             | X                   |

## how to use selection tool

1. Select the selection tool from the toolbar ![Image](img/selectionOnToolbar.png)
2. Click and drag across the canvas to create rectangular outline
3. After you release the mouse you can copy and move copied selection by doing the following
    - hold `Alt`
    - click within the rectangular outline (this copies the selection)
    - move your mouse, dragging the copied selection across the canvas
    - release the mouse to lock the copied selection to the canvas

Have fun! :cake:
