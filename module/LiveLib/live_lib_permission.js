const util = require("util");
var _live_lib_permission = function () {//TODO: Edit with new version
  try {
    if (!global.LiveLib) require("./live_lib_base")();
    if (!global.LiveLib.permissions || !global.LiveLib.permissions.init) global.LiveLib.permissions = {
      init: true
    };
    else return false;
    global.LiveLib.permissions.Version = "2.0";

    global.LiveLib.permissions.PermissionsTree = function (parent, value, not, childs, perm, e) {
      try {
        this.parent = parent;
        this.value = value;
        this.is_perm = perm ? true : false;
        this.is_negative = not ? true : false;
        this.childs = childs ? childs : new Set();
      } catch (err) {
        if (e) throw err;
        else global.LiveLib.getLogger().error("LiveLib: Module \"Permission\": PermissionsTree => new () - %o", err);
      }
    }

    util.inherits(global.LiveLib.permissions.PermissionsTree, global.LiveLib.object);

    global.LiveLib.permissions.PermissionsTree.SPLIT_STRING = ".";
    global.LiveLib.permissions.PermissionsTree.ALL_STRING = "*";

    global.LiveLib.permissions.PermissionsTree.setSplitString = function (string) {
      try {
        this.SPLIT_STRING = string;
        return true;
      } catch (err) {
        global.LiveLib.getLogger().error("LiveLib: Module \"Permission\": PermissionsTree => setSplitString - %o", err);
        return false;
      }
    }

    global.LiveLib.permissions.PermissionsTree.getSplitString = function () {
      return global.LiveLib.permissions.PermissionsTree.SPLIT_STRING;
    }

    global.LiveLib.permissions.PermissionsTree.setAllString = function (string) {
      try {
        this.ALL_STRING = string;
        return true;
      } catch (err) {
        global.LiveLib.getLogger().error("LiveLib: Module \"Permission\": PermissionsTree => setAllString - %o", err);
        return false;
      }
    }

    global.LiveLib.permissions.PermissionsTree.getAllString = function () {
      return global.LiveLib.permissions.PermissionsTree.ALL_STRING;
    }

    global.LiveLib.permissions.PermissionsTree.prototype.setValue = function (value) {
      try {
        this.value = value;
        return true;
      } catch (err) {
        global.LiveLib.getLogger().error("LiveLib: Module \"Permission\": PermissionsTree => setValue - %o", err);
        return false;
      }
    }

    global.LiveLib.permissions.PermissionsTree.prototype.getValue = function () {
      return this.value;
    }

    global.LiveLib.permissions.PermissionsTree.prototype.setParent = function (parent) {
      try {
        this.parent = parent;
        return true;
      } catch (err) {
        global.LiveLib.getLogger().error("LiveLib: Module \"Permission\": PermissionsTree => setParent - %o", err);
        return false;
      }
    }

    global.LiveLib.permissions.PermissionsTree.prototype.getParent = function () {
      return this.parent;
    }

    global.LiveLib.permissions.PermissionsTree.prototype.setChilds = function (childs) {
      try {
        if (childs && childs instanceof Set) {
          this.childs = childs;
          return true;
        }
      } catch (err) {
        global.LiveLib.getLogger().error("LiveLib: Module \"Permission\": PermissionsTree => setChilds - %o", err);
      }
      return false;
    }

    global.LiveLib.permissions.PermissionsTree.prototype.getChilds = function () {
      return this.childs;
    }

    global.LiveLib.permissions.PermissionsTree.prototype.addObject = function (obj, e) {
      try {
        if (obj instanceof global.LiveLib.permissions.PermissionsTree) {
          this.childs.add(obj);
          return obj;
        } else {
          let tmp = new global.LiveLib.permissions.PermissionsTree(this, obj);
          this.childs.add(tmp);
          return tmp;
        }
      } catch (err) {
        if (e) throw err;
        else global.LiveLib.getLogger().error("LiveLib: Module \"Permission\": PermissionsTree => addObject - %o", err);
      }
      return undefined;
    }

    global.LiveLib.permissions.PermissionsTree.prototype.getObjectTree = function (obj, e) {
      try {
        for (let child of this.childs)
          if (child.value === obj) return child;
      } catch (err) {
        if (e) throw err;
        else global.LiveLib.getLogger().error("LiveLib: Module \"Permission\": PermissionsTree => getObjectTree - %o", err);
      }
      return undefined;
    }

    global.LiveLib.permissions.PermissionsTree.prototype.hasObjectTree = function (obj, e) {
      try {
        for (let child of this.childs)
          if (child.value === obj) return true;
      } catch (err) {
        if (e) throw err;
        else global.LiveLib.getLogger().error("LiveLib: Module \"Permission\": PermissionsTree => hasObjectTree - %o", err);
      }
      return false;
    }

    global.LiveLib.permissions.PermissionsTree.prototype.deleteObjectTree = function (obj, e) {
      try {
        if (obj instanceof global.LiveLib.permissions.PermissionsTree) return this.childs.delete(obj);
        else
          for (let child of this.childs)
            if (child.value === obj) return this.childs.delete(child.value);
      } catch (err) {
        if (e) throw err;
        else global.LiveLib.getLogger().error("LiveLib: Module \"Permission\": PermissionsTree => deleteObjectTree - %o", err);
      }
      return false;
    }

    global.LiveLib.permissions.PermissionsTree.prototype.down = function (value, e) {
      try {
        if (value) {
          if (this.value === global.LiveLib.permissions.PermissionsTree.ALL_STRING) return this;
          let tmp = this.getObjectTree(value, true);
          return tmp ? tmp : this.addObject(value, true);
        }
      } catch (err) {
        if (e) throw err;
        else global.LiveLib.getLogger().error("LiveLib: Module \"Permission\": PermissionsTree => down - %o", err);
      }
      return undefined;
    }

    global.LiveLib.permissions.PermissionsTree.prototype.up = function () {
      return this.parent;
    }

    global.LiveLib.permissions.PermissionsTree.prototype.addPermission = function (string, not, e) {
      try {
        if (string) {
          let parts = string.split(global.LiveLib.permissions.PermissionsTree.SPLIT_STRING);
          let tmp = this;
          for (let obj of parts) {
            if (tmp.value === global.LiveLib.permissions.PermissionsTree.ALL_STRING && !not) break;
            tmp = tmp.down(obj, true);
          }
          tmp.is_negative = not ? true : false;
          tmp.is_perm = true;

          if (tmp.getValue() !== global.LiveLib.permissions.PermissionsTree.ALL_STRING) {
            tmp = tmp.addObject(global.LiveLib.permissions.PermissionsTree.ALL_STRING, true);
            tmp.is_perm = true;
            tmp.is_negative = not ? true : false;
          }
          return true;
        }
      } catch (err) {
        if (e) throw err;
        else global.LiveLib.getLogger().error("LiveLib: Module \"Permission\": PermissionsTree => addPermission - %o", err);
      }
      return false;
    }

    global.LiveLib.permissions.PermissionsTree.prototype.checkPermission = function (string, e) {
      try {
        let parts = string.split(global.LiveLib.permissions.PermissionsTree.SPLIT_STRING);
        let tmp = this;
        for (let obj of parts) {
          if (!tmp) return false;

          let local = tmp.getObjectTree(obj, true);
          if (local) tmp = local;
          else {
            if (tmp.value !== global.LiveLib.permissions.PermissionsTree.ALL_STRING) tmp = tmp.getObjectTree(global.LiveLib.permissions.PermissionsTree.ALL_STRING, true);
          }
        }
        return tmp !== undefined && tmp != null && tmp.is_perm && !tmp.is_negative;
      } catch (err) {
        if (e) throw e;
        else global.LiveLib.getLogger().error("LiveLib: Module \"Permission\": PermissionsTree => checkPermission - %o", err);
      }
    }

    global.LiveLib.permissions.PermissionsTree.prototype.deletePermission = function (string, e) {
      try {
        let parts = string.split(global.LiveLib.permissions.PermissionsTree.SPLIT_STRING);
        let tmp = this;
        for (let obj of parts) {
          if (obj === "*") break;
          tmp = tmp.down(obj);
        }

        tmp.is_perm = true;
        tmp.is_negative = !tmp.is_negative;
        tmp.childs.clear();
        let local = tmp.addObject(global.LiveLib.permissions.PermissionsTree.ALL_STRING, true);
        local.is_perm = true;
        local.is_negative = tmp.is_negative;
      } catch (err) {
        if (e) throw e;
        else global.LiveLib.getLogger().error("LiveLib: Module \"Permission\": PermissionsTree => deletePermission - %o", err);
      }
    }

    global.LiveLib.permissions.PermissionsTree.prototype.toJSON = function (e) {
      try {
        let tmp = new Array(this.childs.size);
        let i = 0;
        for (let child of this.childs) {
          tmp[i++] = child.toJSON(true);
        }
        return {
          value: this.value,
          is_perm: this.is_perm ? true : undefined,
          is_negative: this.is_negative ? true : undefined,
          childs: tmp
        }
      } catch (err) {
        if (e) throw err;
        else global.LiveLib.getLogger().error("LiveLib: Module \"Permission\": PermissionsTree => toJSON - %o", err)
      }
      return undefined
    }

    global.LiveLib.permissions.PermissionsTree.prototype.toString = function (e) {
      try {
        return JSON.stringify(this.toJSON(true), null, 2);
      } catch (err) {
        if (e) throw err;
        else global.LiveLib.getLogger().error("LiveLib: Module \"Permission\": PermissionsTree => toString - %o", err)
      }
      return undefined
    }

    global.LiveLib.permissions.PermissionsTree.fromJSON = function (json, e) {
      try {
        if (json) {
          let childs = new Set();
          for (let child of json.childs) {
            childs.add(global.LiveLib.permissions.PermissionsTree.fromJSON(child));
          }
          return new PermissionsTree(json.parent, json.value, json.is_negative, childs, json.is_perm);
        }
      } catch (err) {
        if (e) throw err;
        else global.LiveLib.getLogger().error("LiveLib: Module \"Permission\": PermissionsTree => fromJSON - %o", err)
      }
      return undefined;
    }

    global.LiveLib.permissions.PermissionsTree.fromString = function (str, e) {
      try {
        return global.LiveLib.permissions.PermissionsTree.fromJSON(JSON.parse(str), true);
      } catch (err) {
        if (e) throw err;
        else global.LiveLib.getLogger().error("LiveLib: Module \"Permission\": PermissionsTree => fromString - %o", err)
      }
      return undefined;
    }

    global.LiveLib.permissions.GroupManager = function () {
      this.groups = new Map();
    }

    util.inherits(global.LiveLib.permissions.GroupManager, global.LiveLib.object);

    global.LiveLib.permissions.GroupManager.Group = function (parent, tree) {
      this.parent = parent;
      this.tree = tree;
    }

    util.inherits(global.LiveLib.permissions.GroupManager, global.LiveLib.object);

    global.LiveLib.permissions.GroupManager.Group.prototype.toJSON = function (e) {
      try {
        return {
          parent: this.parent,
          tree: this.tree.toJSON(true)
        }
      } catch (err) {
        if (e) throw err;
        else global.LiveLib.getLogger().error("LiveLib: Module \"Permission\": GroupManager.Group => toJSON - %o", err)
      }
      return undefined;
    }

    global.LiveLib.permissions.GroupManager.prototype.addGroup = function (name, parent, ...args) {
      try {
        if (!name) return false;
        let index_tree = -1;
        for (let i = 0; i < args.length; i++) {
          if (args[i] instanceof global.LiveLib.permissions.PermissionsTree) {
            index_tree = i;
            break;
          }
        }

        let tree = index_tree > -1 ? args[index_tree] : new global.LiveLib.permissions.PermissionsTree();
        for (let i = 0; i < args.length; i++) {
          if (i !== index_tree) {
            if (args[i] instanceof String || typeof args[i] === "string") {
              let local = args[i][0] === "!";
              tree.addPermission(local ? args[i].substr(1) : args[i], local, true);
            } else if (args[i] instanceof Array)
              for (let j = 0; j < args[i].length; j++)
                if (args[i][j] instanceof String || typeof args[i][j] === "string") {
                  let local = args[i][j][0] === "!";
                  tree.addPermission(local ? args[i][j].substr(1) : args[i][j], local, true);
                }
          }
        }
        this.groups.set(name, new global.LiveLib.permissions.GroupManager.Group(parent ? parent : undefined, tree));
        return true;
      } catch (err) {
        global.LiveLib.getLogger().error("LiveLib: Module \"Permission\": PermissionsTree => addGroup - %o", err)
        return false;
      }
    }

    global.LiveLib.permissions.GroupManager.prototype.getGroup = function (name) {
      if (!name) return false;
      return this.groups.get(name);
    }

    global.LiveLib.permissions.GroupManager.prototype.deleteGroup = function (name) {
      if (!name) return false;
      return this.groups.delete(name);
    }


    global.LiveLib.permissions.GroupManager.prototype.addPermission = global.LiveLib.permissions.GroupManager.prototype.addPermissions = function (name, ...args) {
      try {
        if (!name) return false;
        let group = this.groups.get(name);
        if (!group) return false;
        for (let obj of args) {
          if (obj instanceof String || typeof obj === "string") {
            let local = obj[0] === "!";
            group.tree.addPermission(local ? obj.substr(1) : obj, local, true);
          } else if (obj instanceof Array)
            for (let j = 0; j < obj.length; j++)
              if (obj[j] instanceof String || typeof obj[j] === "string") {
                let local = obj[j][0] === "!";
                group.tree.addPermission(local ? obj[j].substr(1) : obj[j], local, true);
              }
        }
        return true;
      } catch (err) {
        global.LiveLib.getLogger().error("LiveLib: Module \"Permission\": GroupManager => addPermission[s] - %o", err)
        return false;
      }
    }

    global.LiveLib.permissions.GroupManager.prototype.checkPermission = global.LiveLib.permissions.GroupManager.prototype.checkPermissions = function (name, ...args) {
      try {
        if (!name) return false;
        let group = this.groups.get(name);
        if (!group) return false;
        let parent = this.groups.get(group.parent);
        for (let obj of args) {
          if (obj instanceof String || typeof obj === "string") {
            if (!group.tree.checkPermission(obj, true) && parent && !parent.tree.checkPermission(obj, true)) return false;
          } else if (obj instanceof Array)
            for (let j = 0; j < obj.length; j++)
              if (obj[j] instanceof String || typeof obj[j] === "string")
                if (!group.tree.checkPermission(obj[j], true) && parent && !parent.tree.checkPermission(obj[j], true)) return false;
        }
        return true;
      } catch (err) {
        global.LiveLib.getLogger().error("LiveLib: Module \"Permission\": GroupManager => checkPermission[s] - %o", err)
        return false;
      }
    }

    global.LiveLib.permissions.GroupManager.prototype.deletePermission = global.LiveLib.permissions.GroupManager.prototype.deletePermissions = function (name, ...args) {
      try {
        if (!name) return false;
        let group = this.groups.get(name);
        if (!group) return false;
        for (let obj of args) {
          if (obj instanceof String || typeof obj === "string") {
            group.tree.deletePermission(obj, true);
          } else if (obj instanceof Array)
            for (let j = 0; j < obj.length; j++)
              if (obj[j] instanceof String || typeof obj[j] === "string")
                group.tree.deletePermission(obj[j], true);
        }
        return true;
      } catch (err) {
        global.LiveLib.getLogger().error("LiveLib: Module \"Permission\": GroupManager => deletePermission[s] - %o", err)
        return false;
      }
    }

    global.LiveLib.permissions.GroupManager.prototype.toJSON = function (e) {
      try {
        let tmp = new Array(this.groups.size);
        let i = 0;
        for (let [key, value] of this.groups) {
          tmp[i++] = [key, value.toJSON(true)];
        }
        return {
          value: tmp
        }
      } catch (err) {
        if (e) throw err;
        else global.LiveLib.getLogger().error("LiveLib: Module \"Permission\": GroupManager => toJSON - %o", err)
      }
    }

    global.LiveLib.permissions.GroupManager.prototype.toString = function (e) {
      try {
        return JSON.stringify(this.toJSON(true), null, 2);
      } catch (err) {
        if (e) throw err;
        else global.LiveLib.getLogger().error("LiveLib: Module \"Permission\": GroupManager => toString - %o", err);
      }
    }

    global.LiveLib.permissions.GroupManager.fromJSON = function (json, e) {

    }

    return global.LiveLib.permissions;
  } catch (err) {
    global.LiveLib.getLogger().error("LiveLib: Module \"Permission\": - %o", err)
    return false;
  }
}

module.exports = _live_lib_permission;
