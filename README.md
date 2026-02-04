# Region Behaviour Adjustments
---
This module adds further customisation options to Foundry VTT Region Behaviours and a few completely new behaviours. Core behaviours adjustments can be toggled on/off in the world settings.

# Changed Behaviour Types:
- ## Teleport Token
  - ### Teleport Position
    - Allows for the selection of a destination [scene,level,x,y] without the need of a new region by simply clicking on the target.

- ## Change Level [v14]
  - #### Skip confirm dialogue
    This setting can make level changes a bit smoother and force the level change onto the player by removing the confirm/choose dialog when only one target region is available
  - #### Continue movement
    When active, the token will continue its previously planned movement after changing level, making the change a bit more convinient. This will respect the wall collision on the new level.
  - #### Target level
    A custom choice of target levels. This allows for more fine control and can make the creation of e.g. stair cases easier. Available options:
    - **Default (Foundry behaviour):** The default behaviour. This will only allow for the parent regions levels to be chosen, or all scene levels if the region has no set levels.
    - **Next higher elevation:** The next higher level compared to the tokens level. Here only level bottom elevations are compared.
    - **Next lower elevation:** The next lower level compared to the tokens level. Here only level bottom elevations are compared.
    - **Neighbouring elevations:** The next lower and the next higher level compared to the tokens level. Here only level bottom elevations are compared.
    - **Custom level choice:** The levels as chosen in the "Chosen levels" setting below
  - #### Chosen levels
    Custom level choice for the "Target level" setting
  - #### Excluded movement types
    A set of movement types that do not trigger this behaviour. Maybe the players can fly or jump over a gorge they would normally drop into, or a player can burrow down one level at a specific spot.

# New Behaviour Types
- ## Add Combatants
  - #### Combatants
    Combatants to add
  - #### Character Trigger
    So that it is only triggered by player characters
  - #### Tokens on Region
    Add all tokens on region as combatants
  - #### Player Characters
    Add all player characters as combatants
  - #### Once
 
- ## Change Movement Type
  - #### Enter Movement
    - Movement type tokens entering the region are set to
  - #### Leave Movement
    - Movement type tokens leaving the region are set to
   
- ## Change Visibility
  - #### Placeables
    - Placeables [Tokens, Tiles, Doors] whoose visibility will be altered
  - #### Character Trigger
    So that it is only triggered by player characters
  - #### Change
    Change type [Toggle, Show, Hide]
  - #### Tokens on Region
    If the tokens present on the region should also be changed
  - #### Once
 
- ## Conditional Trigger
  This Behaviour allows you to set certain conditions for the triggering of outher behaviours. You can also trigger behaviours of other regions. **Note**, that the trigger tpye of the target behaviour will need to match the trigger type of this behaviour
  - #### Logic
    With which logic operator values are combined [AND, OR]
  - #### Condition Types
    Choose applied condition types that are checked [Item in token, Macros, Script]
  - #### Invert
    If the result should be inverted
  - #### On TRUE
    Behaviours triggered when the outcome is TRUE
  - #### On FALSE
    Behaviours triggered when the outcome is FALSE
  - #### Ignore disabled
    If the disabled setting of triggered behaviours should be ignored. You normally want this set to true and all triggered behaviours disabled, as this behaviour will not prevent behaviours to be triggered the normal way.

- ## Give/Take Item
  - #### Items
    Items to be given taken
  - #### Mode
    What should be done to the items/the item quantity [give/remove/set to]
  - #### Quantity
    Quantity of the items
  - #### Delete on zero
    Delete item if it reaches a quantity of zero
  - #### Character Trigger
    So that it is only triggered by player characters
  - #### Once
 
  - ## Ping
    - #### Ping Position
      Position to ping on this scene
    - #### Ping Color
      Color of the Ping
    - #### Ping Duration
      Duration of the Ping
    - #### Ping Tokens on Region
      To also ping the tokens in the region
    - #### Once
   
  - ## Prevent Movement
    This Region prevents movement of a certain type/types into or within this region. A GM using unrestricted movement will ignore this behaviour.
    - #### Prevented Movement
      Movement type(s) to prevent

  - ## Roll Table
    - #### Roll Table
      Table(s) rolled by the triggering player
    - #### Character Trigger
      So that it is only triggered by player characters
    - #### Once

### Languages:

The module contains an English and a German (soon™) translation. If you want additional languages to be supported [let me know](https://github.com/Saibot393/regionba/issues).

---

Use `https://github.com/Saibot393/regionba/releases/latest/download/module.json` for install.

**If you have suggestions, questions, or requests for additional features please [let me know](https://github.com/Saibot393/regionba/issues).**
