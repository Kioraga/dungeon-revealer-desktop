The app is separated into two views: the dungeon master's view and the player view. Both live in the same app: the DM window, and a fullscreen player window on a second display.

## Dungeon Master

Start the app (see [Install](Install.md)). The main window is the DM view.

To get a map on screen:

1. Open the **Map Library** and load (or import) a map image.
2. Draw on the map to clear fog of war with the **Reveal** brush, or cover it again with **Shroud**. What appears as a shadow to the DM appears as pure blackness to players.
3. Click **Start Sharing** to push the map to the player window. The player window opens fullscreen on the screen selected via the **Screen** button.
4. **Stop Sharing** blanks the player window and closes it.

The **DM | Player** tabs at the top center of the DM window toggle between the DM view and a mirror of the player view, so you don't have to look at the projector. In the mirror you see the fog exactly as the players do, and its zoom / center-map controls also move the player window.

The **Mark** tool displays a circle for a period of time to indicate a point of interest.

You can add a [token](Tokens.md) with the **Token** tool. Click anywhere on the map to place it. Right-click a token to change its label, color and size. In this local setup the DM moves all tokens; the player window is view-only.

### Shortcuts

| Key            | Functionality                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------- |
| `1`            | select move tool.                                                                             |
| `2`            | select area tool.                                                                             |
| `3`            | select brush tool.                                                                            |
| `4`            | select mark tool.                                                                             |
| `5`            | select token tool.                                                                            |
| `Shift`        | toggle between hide/reveal.                                                                   |
| `CMD/Ctrl + S` | push map to players.                                                                          |
| Hold `Alt`     | use move tool while `Alt` key is pressed and return to previous mode after `Alt` is released. |

## Players

The player window shows the active map and fog of war live. It is view-only: no chat, no user list, no controls. The DM drives everything, including zoom and centering, from the mirror tab.
