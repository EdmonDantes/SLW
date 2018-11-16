#LIVe lib
* Usage
* Base
* Database
* Permissions
* Preference
* Net
* User Engine
## Usage
####Initialization
```js
require("live_lib")(<Module name>);
```
**or**
```js
require("live_lib")([<Module name 1>, <Module name 2>, ...]);
```
####Use in code
```js
...
LiveLib.<Module name>.<Method>([args]);
...
```
## Base
All modules using this module, because you may not write one in Initialization. This module change standard ```console.log()``` to ```Logger.log()```  
All methods and classes in this module use after ```LiveLib.```
###Methods
* ```argsIndex(args (strings' array))``` - return the first index of the entry any string from array in process' argument
* ```haveArgs(args (strings' array))``` - return true if process' arguments have any string of array
* ```getArg(arg (string), default_value (object))``` - return value process' argument after arg if process' arguments have arg else return default_value
* ```createClass(c1 (class), c2 (class))``` - set c2 is parent c1
* ```createRandomString(length (number)[, chars (string)])``` - create random string with length from chars
* ```getLogger()``` - return object from logging information.
###Classes
#### 1. object
Standard class for all classes in this library.
#####Methods
* ```toString()``` - return string representation of this object
#### 2. Style
Class for set style in command line  
```Style(style, color, backcolor)``` - style is number of styles' number ANSI. color is number of colors' ANSI or array of RGB. backcolor is number of colors' ANSI or array of RGB.
#####Methods
* ```get()``` - return style`s string for terminal
#####Not prototype methods  
* ```style(style (string))``` - create Style object and set text`s type in one.
* ```frontColor(color_or_r, g, b)``` - create Style and set front color in one. *(You can use HEX or RBG)*
* ```backColor(color_or_r, g, b)``` - create Style and set backfront color in one. *(You can use HEX or RBG)*
* ```frontColorHex(color)``` - create Style and set front color in one. *(You can use only HEX)*
* ```backColorHex(color)``` - create Style and set backfront color in one. *(You can use only HEX)*
#####Styles
1. *bold* or *br*
1. *faint* or *dim*
1. *italic* or *it*
1. *underline* or *line*
1. *blink*
1. *reverse*
1. *invisible* or *inv*
1. *crossline* or *cline*
1. *doubleline* or *dline*
1. *overline* or *oline*
#####Colors
1. black
1. red
1. green
1. yellow
1. blue
1. magenta
1. cyan
1. while
1. br_black
1. br_red
1. br_green
1. br_yellow
1. br_blue
1. br_magenta
1. br_cyan
1. br_white
#### 3. Logger
Class for logging information  
```Logger(name (string))``` - create Logger with name.
#####Methods
* ```log(...)``` - logging information. *(You can use class Style for terminal`s style)*
* ```isTrace()``` - return true if level >= trace
* ```isDebug()``` - return true if level >= debug
* ```isInfo()``` - return true if level >= info
* ```isWarn()``` - return true if level >= warn
* ```isError()``` - return true if level >= error
* ```isFatal()``` - return true if level >= fatal
* ```getLevel()``` - return level's string.
* ```setLevel(level (string of number))``` - set logging`s level. *(You can use level's string or number)*
* ```trace(...)``` - logging information with trace`s level
* ```verbose(...)``` - logging information with trace`s level
* ```debug(...)``` - logging information with debug`s level
* ```info(...)``` - logging information with info`s info
* ```warn(...)``` - logging information with warn`s level
* ```error(...)``` - logging information with error`s level
* ```fatal(...)``` - logging information with fatal`s level

## Database
This module create for mysql database.
###How to start
```js
require("live_lib")([["db", {
  host: "host",
  user: "user",
  password: "pass"
}]]);
```
You can set other settings
* port
* database
* count_pools - how much connection will create in pool
###or
```js
require("live_lib")("db");
LiveLib.db.updateConnection("host","user", "pass");
```
###Methods
* `updateConnection(host (string), user (string), password (string)[, port (number), database (string), count_pools (string)])` - update or create connection to mysql. If database not exists, create one.
* `createRequest(request, callback)` - send query to mysql. Arguments after first change "?" to one.
* `changeDB(database, callback)` - change database.
* `deleteDB(database, callback)` - drop database.
* `createTable(table, ..., callback)` - create table with name of first argument. In other argument you can use string or special object.
    * **Special Object**
        * `<name>` - string
        * `<type>` - string
        * `[default]` - string
        * `[foreign]` - object
            * `<table>` - string (from witch table get key)
            * `<key>` - string  (what key)
        * `[autoincrement]` - bool
        * `[notnull]` - bool
        * `[unique]` - bool
        * `[primary]` - bool
* `deleteTable(table, callback)` - drop table.
* `insert(table, ..., callback)` - insert information to table. You can use 2 array or object.
* `select(table [,filters (string or array), where (string or array), groupBy (string or array), limit (number or string), offset (number or string. Need limit for using), having (string., Need groupBy for using)], callback)` - select information from table.
* `update(table, ..., callback)` - update table. You can use 2 arrays or objects for set updating value in keys. If you want to set condition use key `$$WHERE`
###Classes
* `SQLError`
    * name - "SQLError"
    * message - Error message
    * code - SQL Error code
## Permissions

