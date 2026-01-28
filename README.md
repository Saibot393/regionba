# Region Behaviour Adjustments
---
This module adds further customisation options to Foundry VTT Region Behaviours.

Changed Behaviour Types:

- ## Change Level
  - #### Skip confirm dialogue
    This setting can make level changes a bit smoother and force the level change onto the player by removing the confirm/choose dialog when only one target region is available
  - #### Continue movement
    When active, the token will continue its previously planned movement after changing level, making the change a bit more convinient. This will respect the wall collision on the new level.
  - #### Target level
    A custom choice of target levels. This allows for more fine control and can make the creation of stair cases easier. Available options:
    - **Default (Foundry behaviour):** The default behaviour. This will only allow for the parent regions levels to be chosen, or all scene levels if the region has no set levels.
    - **Next higher elevation:** The next higher level compared to the tokens level. Here only level bottom elevations are compared.
    - **Next lower elevation:** The next lower level compared to the tokens level. Here only level bottom elevations are compared.
    - **Neighbouring elevations:** The next lower and the next higher level compared to the tokens level. Here only level bottom elevations are compared.
    - **Custom level choice:** The levels as chosen in the "Chosen levels" setting below
  - #### Chosen levels
    Custom level choice for the "Target level" setting
  - #### Excluded movement types
    A set of movement types that do not trigger this behaviour. Maybe the players can fly or jump over a gorge they would normally drop into, or a player can burrow down a level at a specific spot.

### Languages:

The module contains an English and a German translation. If you want additional languages to be supported [let me know](https://github.com/Saibot393/regionba/issues).

---

**If you have suggestions, questions, or requests for additional features please [let me know](https://github.com/Saibot393/regionba/issues).**
