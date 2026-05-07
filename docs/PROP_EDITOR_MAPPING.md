# Prop Editor Mapping

API value kinds map to visual editors:

| API kind | Editor |
|---|---|
| string | text |
| number | number |
| boolean | switch |
| enum | select |
| reactNode | reactNode |
| object | objectEditor |
| array | arrayEditor |
| function | interactionEvent |
| css | styleEditor |
| semanticClass | classNameEditor |
| unknown | advancedJson |

Function editors are interaction affordances only. They do not create JavaScript inputs.
