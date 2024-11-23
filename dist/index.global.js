// Name: CST 3D
// ID: cst12293d
// Description: Bring your sprites into the third dimension.
// Original: CST1229 <https://scratch.mit.edu/users/CST1229/>
// By: Fath11 <https://github.com/fath11>
// License: MPL-2.0

(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // src/index.js
  (async function(Scratch2) {
    "use strict";
    if (!Scratch2.extensions.unsandboxed) {
      throw new Error("3D must be run unsandboxed");
    }
    const IN_3D = "threed.in3d";
    const OBJECT = "threed.object";
    const THREED_DIRTY = "threed.dirty";
    const SIDE_MODE = "threed.sidemode";
    const TEX_FILTER = "threed.texfilter";
    const Z_POS = "threed.zpos";
    const YAW = "threed.yaw";
    const PITCH = "threed.pitch";
    const ROLL = "threed.roll";
    const ATTACHED_TO = "threed.attachedto";
    let LIGHTS = {};
    if (!Scratch2.extensions.unsandboxed) {
      throw new Error("CST 3D must be run unsandboxed");
    }
    const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.webgpu.min.js");
    const extId = "cst12293d";
    const vm = Scratch2.vm;
    const runtime = vm.runtime;
    const renderer = Scratch2.renderer;
    const PATCHES_ID = "__patches" + extId;
    const patch = (obj, functions) => {
      if (obj[PATCHES_ID]) return;
      obj[PATCHES_ID] = {};
      for (const name in functions) {
        const original = obj[name];
        obj[PATCHES_ID][name] = obj[name];
        if (original) {
          obj[name] = function(...args) {
            const callOriginal = (...ogArgs) => original.call(this, ...ogArgs);
            return functions[name].call(this, callOriginal, ...args);
          };
        } else {
          obj[name] = function(...args) {
            return functions[name].call(this, () => {
            }, ...args);
          };
        }
      }
    };
    const _unpatch = (obj) => {
      if (!obj[PATCHES_ID]) return;
      for (const name in obj[PATCHES_ID]) {
        obj[name] = obj[PATCHES_ID][name];
      }
      delete obj[PATCHES_ID];
    };
    const Skin = renderer.exports.Skin;
    class SimpleSkin extends Skin {
      constructor(id, renderer2) {
        super(id, renderer2);
        const gl = renderer2.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        this._texture = texture;
        this._rotationCenter = [240, 180];
        this._size = [480, 360];
      }
      dispose() {
        if (this._texture) {
          this._renderer.gl.deleteTexture(this._texture);
          this._texture = null;
        }
        super.dispose();
      }
      set size(value) {
        this._size = value;
        this._rotationCenter = [value[0] / 2, value[1] / 2];
      }
      get size() {
        return this._size;
      }
      getTexture(scale) {
        return this._texture || super.getTexture(scale);
      }
      setContent(textureData) {
        const gl = this._renderer.gl;
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          textureData
        );
        this.emitWasAltered();
      }
    }
    class ThreeD {
      constructor() {
        window.threed = this;
        runtime[extId] = this;
        this.THREE = THREE;
        this.hideVanillaBlocks = !!runtime.extensionStorage?.[extId]?.hideVanillaBlocks;
        runtime.on("PROJECT_LOADED", () => {
          this.uninit();
          const oldHideVanillaBlocks = this.hideVanillaBlocks;
          this.hideVanillaBlocks = !!runtime.extensionStorage?.[extId]?.hideVanillaBlocks;
          if (oldHideVanillaBlocks != this.hideVanillaBlocks) {
            vm.extensionManager.refreshBlocks();
          }
        });
      }
      getInfo() {
        return {
          id: extId,
          name: "CST 3D",
          color1: "#2a47e8",
          color2: "#2439ad",
          color3: "#1b2d94",
          blocks: [
            {
              blockType: Scratch2.BlockType.BUTTON,
              text: "Open Documentation",
              func: "viewDocs"
            },
            "---",
            {
              opcode: "setMode",
              blockType: Scratch2.BlockType.COMMAND,
              text: "set 3D mode to [MODE]",
              arguments: {
                MODE: {
                  type: Scratch2.ArgumentType.STRING,
                  menu: "MODE_MENU",
                  defaultValue: "flat"
                }
              }
            },
            {
              blockType: Scratch2.BlockType.LABEL,
              text: "Motion and Sensing"
            },
            this.vanillaBlock(`
            <block type="motion_setx">
                <value name="X">
                    <shadow id="setx" type="math_number">
                        <field name="NUM">0</field>
                    </shadow>
                </value>
            </block>
            <block type="motion_sety">
                <value name="Y">
                    <shadow id="sety" type="math_number">
                        <field name="NUM">0</field>
                    </shadow>
                </value>
            </block>
          `),
            {
              opcode: "setZ",
              blockType: Scratch2.BlockType.COMMAND,
              text: "set z to [Z]",
              arguments: {
                Z: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 0
                }
              }
            },
            this.vanillaBlock(`
            <block type="motion_changexby">
                <value name="DX">
                    <shadow type="math_number">
                        <field name="NUM">0</field>
                    </shadow>
                </value>
            </block>
            <block type="motion_changeyby">
                <value name="DY">
                    <shadow type="math_number">
                        <field name="NUM">0</field>
                    </shadow>
                </value>
            </block>
          `),
            {
              opcode: "changeZ",
              blockType: Scratch2.BlockType.COMMAND,
              text: "change z by [Z]",
              arguments: {
                Z: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 10
                }
              }
            },
            this.vanillaBlock(`
            <block type="motion_xposition"></block>
            <block type="motion_yposition"></block>
          `),
            {
              opcode: "getZ",
              blockType: Scratch2.BlockType.REPORTER,
              text: "z position"
            },
            {
              opcode: "set3DPos",
              blockType: Scratch2.BlockType.COMMAND,
              text: "go to x: [X] y: [Y] z: [Z]",
              arguments: {
                X: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 0
                },
                Y: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 0
                },
                Z: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 0
                }
              }
            },
            {
              opcode: "change3DPos",
              blockType: Scratch2.BlockType.COMMAND,
              text: "change position by x: [X] y: [Y] z: [Z]",
              arguments: {
                X: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 10
                },
                Y: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 0
                },
                Z: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 0
                }
              }
            },
            "---",
            {
              opcode: "moveSteps",
              blockType: Scratch2.BlockType.COMMAND,
              text: "move [STEPS] steps in 3D",
              arguments: {
                STEPS: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: "10"
                }
              }
            },
            {
              opcode: "set3DDir",
              blockType: Scratch2.BlockType.COMMAND,
              text: "point in [DIRECTION] [DEGREES]",
              arguments: {
                DIRECTION: {
                  type: Scratch2.ArgumentType.STRING,
                  menu: "direction",
                  defaultValue: "y"
                },
                DEGREES: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 0
                }
              }
            },
            {
              opcode: "rotate3D",
              blockType: Scratch2.BlockType.COMMAND,
              text: "turn [DIRECTION] [DEGREES] degrees",
              arguments: {
                DIRECTION: {
                  type: Scratch2.ArgumentType.STRING,
                  menu: "turnDirection",
                  defaultValue: "right"
                },
                DEGREES: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 15
                }
              }
            },
            {
              opcode: "direction3D",
              blockType: Scratch2.BlockType.REPORTER,
              text: "direction around [DIRECTION]",
              arguments: {
                DIRECTION: {
                  type: Scratch2.ArgumentType.STRING,
                  menu: "direction",
                  defaultValue: "y"
                }
              }
            },
            this.vanillaBlock(`
            <block type="sensing_touchingobject">
                <value name="TOUCHINGOBJECTMENU">
                    <shadow type="sensing_touchingobjectmenu"/>
                </value>
            </block>
          `),
            {
              blockType: Scratch2.BlockType.LABEL,
              text: "Looks"
            },
            {
              opcode: "setTexFilter",
              blockType: Scratch2.BlockType.COMMAND,
              text: "set texture filter to [FILTER]",
              arguments: {
                FILTER: {
                  type: Scratch2.ArgumentType.STRING,
                  menu: "texFilter",
                  defaultValue: "nearest"
                }
              }
            },
            {
              opcode: "setSideMode",
              blockType: Scratch2.BlockType.COMMAND,
              text: "set shown faces to [SIDE]",
              arguments: {
                SIDE: {
                  type: Scratch2.ArgumentType.STRING,
                  menu: "side",
                  defaultValue: "both"
                }
              }
            },
            "---",
            {
              opcode: "setCubeTexture",
              blockType: Scratch2.BlockType.COMMAND,
              text: "set side textures for right: [RIGHT] left: [LEFT] top: [TOP] bottom: [BOTTOM] front: [FRONT] back: [BACK]",
              arguments: {
                RIGHT: {
                  type: Scratch2.ArgumentType.COSTUME
                },
                LEFT: {
                  type: Scratch2.ArgumentType.COSTUME
                },
                TOP: {
                  type: Scratch2.ArgumentType.COSTUME
                },
                BOTTOM: {
                  type: Scratch2.ArgumentType.COSTUME
                },
                FRONT: {
                  type: Scratch2.ArgumentType.COSTUME
                },
                BACK: {
                  type: Scratch2.ArgumentType.COSTUME
                }
              }
            },
            {
              blockType: Scratch2.BlockType.LABEL,
              text: "Attachments"
            },
            {
              opcode: "attach",
              blockType: Scratch2.BlockType.COMMAND,
              text: "attach myself to [TARGET]",
              arguments: {
                TARGET: {
                  type: Scratch2.ArgumentType.STRING,
                  menu: "spriteMenu"
                }
              }
            },
            {
              opcode: "attachVar",
              blockType: Scratch2.BlockType.COMMAND,
              text: "attach myself to sprite with variable [VARIABLE] set to [VALUE]",
              arguments: {
                TARGET: {
                  type: Scratch2.ArgumentType.STRING,
                  menu: "spriteMenu"
                },
                VARIABLE: {
                  type: Scratch2.ArgumentType.STRING,
                  default: "my variable"
                },
                VALUE: {
                  type: Scratch2.ArgumentType.STRING,
                  default: "0"
                }
              }
            },
            {
              opcode: "detach",
              blockType: Scratch2.BlockType.COMMAND,
              text: "detach myself",
              arguments: {}
            },
            {
              opcode: "attachedSprite",
              blockType: Scratch2.BlockType.REPORTER,
              text: "sprite I'm attached to",
              arguments: {}
            },
            {
              opcode: "attachedSpriteVar",
              blockType: Scratch2.BlockType.REPORTER,
              text: "variable [VARIABLE] of sprite I'm attached to",
              arguments: {
                VARIABLE: {
                  type: Scratch2.ArgumentType.STRING,
                  default: "my variable"
                }
              }
            },
            {
              blockType: Scratch2.BlockType.LABEL,
              text: "Camera"
            },
            {
              opcode: "setCam",
              blockType: Scratch2.BlockType.COMMAND,
              text: "move camera to x: [X] y: [Y] z: [Z]",
              arguments: {
                X: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 0
                },
                Y: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 0
                },
                Z: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 0
                }
              }
            },
            {
              opcode: "changeCam",
              blockType: Scratch2.BlockType.COMMAND,
              text: "change camera by x: [X] y: [Y] z: [Z]",
              arguments: {
                X: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 10
                },
                Y: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 0
                },
                Z: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 0
                }
              }
            },
            {
              opcode: "camX",
              blockType: Scratch2.BlockType.REPORTER,
              text: "camera x"
            },
            {
              opcode: "camY",
              blockType: Scratch2.BlockType.REPORTER,
              text: "camera y"
            },
            {
              opcode: "camZ",
              blockType: Scratch2.BlockType.REPORTER,
              text: "camera z"
            },
            "---",
            {
              opcode: "moveCamSteps",
              blockType: Scratch2.BlockType.COMMAND,
              text: "move camera [STEPS] steps",
              arguments: {
                STEPS: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: "10"
                }
              }
            },
            {
              opcode: "setCamDir",
              blockType: Scratch2.BlockType.COMMAND,
              text: "point camera in [DIRECTION] [DEGREES]",
              arguments: {
                DIRECTION: {
                  type: Scratch2.ArgumentType.STRING,
                  menu: "direction",
                  defaultValue: "y"
                },
                DEGREES: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 0
                }
              }
            },
            {
              opcode: "rotateCam",
              blockType: Scratch2.BlockType.COMMAND,
              text: "turn camera [DIRECTION] [DEGREES] degrees",
              arguments: {
                DIRECTION: {
                  type: Scratch2.ArgumentType.STRING,
                  menu: "turnDirection",
                  defaultValue: "right"
                },
                DEGREES: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 15
                }
              }
            },
            {
              opcode: "camDir",
              blockType: Scratch2.BlockType.REPORTER,
              text: "camera direction around [DIRECTION]",
              arguments: {
                DIRECTION: {
                  type: Scratch2.ArgumentType.STRING,
                  menu: "direction",
                  defaultValue: "y"
                }
              }
            },
            "---",
            {
              opcode: "setCameraParam",
              blockType: Scratch2.BlockType.COMMAND,
              text: "set camera [PARAM] to [VALUE]",
              arguments: {
                PARAM: {
                  type: Scratch2.ArgumentType.STRING,
                  menu: "cameraParam",
                  defaultValue: "vertical FOV"
                },
                VALUE: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: "50"
                }
              }
            },
            {
              opcode: "getCameraParam",
              blockType: Scratch2.BlockType.REPORTER,
              text: "camera [PARAM]",
              arguments: {
                PARAM: {
                  type: Scratch2.ArgumentType.STRING,
                  menu: "cameraParam",
                  defaultValue: "vertical FOV"
                }
              }
            },
            {
              blockType: Scratch2.BlockType.LABEL,
              text: "Fog"
            },
            {
              opcode: "setFog",
              blockType: Scratch2.BlockType.COMMAND,
              text: "set fog near: [n] far: [f] color: [color]",
              arguments: {
                n: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 700
                },
                f: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 800
                },
                color: {
                  type: Scratch2.ArgumentType.COLOR,
                  defaultValue: "#ffffff"
                }
              }
            },
            {
              opcode: "setFogAtt",
              blockType: Scratch2.BlockType.COMMAND,
              text: "set fog [att] to [v]",
              arguments: {
                att: {
                  type: Scratch2.ArgumentType.STRING,
                  menu: "fogAtt"
                },
                v: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 0
                }
              }
            },
            {
              opcode: "clearFog",
              blockType: Scratch2.BlockType.COMMAND,
              text: "reset fog"
            },
            {
              blockType: Scratch2.BlockType.LABEL,
              text: "Lighting"
            },
            {
              opcode: "newLight",
              blockType: Scratch2.BlockType.COMMAND,
              text: "create light named [name] with type: [typ] color: [color]",
              arguments: {
                name: {
                  type: Scratch2.ArgumentType.STRING,
                  defaultValue: "light"
                },
                typ: {
                  type: Scratch2.ArgumentType.STRING,
                  menu: "lightType"
                },
                color: {
                  type: Scratch2.ArgumentType.COLOR,
                  defaultValue: "#ffffff"
                }
              }
            },
            {
              opcode: "setLightIntensity",
              blockType: Scratch2.BlockType.COMMAND,
              text: "set light [name] intensity to [v]",
              arguments: {
                name: {
                  type: Scratch2.ArgumentType.STRING,
                  defaultValue: "light"
                },
                v: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 1
                }
              }
            },
            {
              opcode: "setLightDistance",
              blockType: Scratch2.BlockType.COMMAND,
              text: "set light [name] max distance to [v]",
              arguments: {
                name: {
                  type: Scratch2.ArgumentType.STRING,
                  defaultValue: "light"
                },
                v: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 0
                }
              }
            },
            {
              opcode: "setLightPos",
              blockType: Scratch2.BlockType.COMMAND,
              text: "move light [name] to x: [x] y: [y] z: [z]",
              arguments: {
                name: {
                  type: Scratch2.ArgumentType.STRING,
                  defaultValue: "light"
                },
                x: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 0
                },
                y: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 0
                },
                z: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 0
                }
              }
            },
            {
              opcode: "changeLightPos",
              blockType: Scratch2.BlockType.COMMAND,
              text: "change light [name] by x: [x] y: [y] z: [z]",
              arguments: {
                name: {
                  type: Scratch2.ArgumentType.STRING,
                  defaultValue: "light"
                },
                x: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 0
                },
                y: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 0
                },
                z: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 0
                }
              }
            },
            {
              opcode: "setLightDir",
              blockType: Scratch2.BlockType.COMMAND,
              text: "point light [name] in [direction] [degrees]",
              arguments: {
                name: {
                  type: Scratch2.ArgumentType.STRING,
                  defaultValue: "light"
                },
                direction: {
                  type: Scratch2.ArgumentType.STRING,
                  menu: "direction",
                  defaultValue: "y"
                },
                degrees: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 0
                }
              }
            },
            {
              opcode: "changeLightDir",
              blockType: Scratch2.BlockType.COMMAND,
              text: "turn light [name] [DIRECTION] [DEGREES] degrees",
              arguments: {
                name: {
                  type: Scratch2.ArgumentType.STRING,
                  defaultValue: "light"
                },
                DIRECTION: {
                  type: Scratch2.ArgumentType.STRING,
                  menu: "turnDirection",
                  defaultValue: "right"
                },
                DEGREES: {
                  type: Scratch2.ArgumentType.NUMBER,
                  defaultValue: 15
                }
              }
            },
            {
              opcode: "deleteLight",
              blockType: Scratch2.BlockType.COMMAND,
              text: "delete light [name]",
              arguments: {
                name: {
                  type: Scratch2.ArgumentType.STRING,
                  defaultValue: "light"
                }
              }
            },
            {
              opcode: "deleteLights",
              blockType: Scratch2.BlockType.COMMAND,
              text: "delete all lights",
              arguments: {}
            },
            {
              opcode: "getLightPos",
              blockType: Scratch2.BlockType.REPORTER,
              text: "[pos] position of light [name]",
              arguments: {
                pos: {
                  type: Scratch2.ArgumentType.NUMBER,
                  menu: "axis"
                },
                name: {
                  type: Scratch2.ArgumentType.STRING,
                  defaultValue: "light"
                }
              }
            }
          ],
          menus: {
            MODE_MENU: {
              acceptReporters: true,
              items: [
                "disabled",
                "flat",
                "flat triangle",
                "sprite",
                "cube",
                "sphere",
                "low-poly sphere"
              ]
            },
            turnDirection: {
              acceptReporters: false,
              items: [
                "left",
                "right",
                "up",
                "down",
                {
                  text: "\u27F2",
                  value: "ccw"
                },
                {
                  text: "\u27F3",
                  value: "cw"
                }
              ]
            },
            direction: {
              acceptReporters: true,
              items: [
                { value: "y", text: "y (yaw)" },
                { value: "x", text: "x (pitch)" },
                { value: "z", text: "z (roll)" }
              ]
            },
            cameraParam: {
              acceptReporters: true,
              items: [
                "vertical FOV",
                "minimum render distance",
                "maximum render distance"
              ]
            },
            side: {
              acceptReporters: true,
              items: ["both", "front", "back"]
            },
            texFilter: {
              acceptReporters: true,
              items: ["nearest", "linear"]
            },
            spriteMenu: {
              acceptReporters: true,
              items: "getSprites"
            },
            fogAtt: {
              acceptReporters: true,
              items: ["near", "far"]
            },
            lightType: {
              acceptReporters: true,
              items: ["point", "spotlight", "hemisphere"]
            },
            axis: {
              acceptReporters: true,
              items: ["x", "y", "z"]
            }
          }
        };
      }
      viewDocs() {
        alert(`This extension also makes many other vanilla blocks (e.g most of Motion) work with 3D sprites, try them out!
Default camera position: x0, y0, z200.
Default camera parameters: vertical FOV 60, min render distance 0.5, max render distance 4800.

More things will be added here as things that need explaining are added.
If I ever decide to release this extension on the gallery, this will be replaced with an actual docs page.`);
      }
      toggleVanillaBlocks() {
        this.hideVanillaBlocks = !this.hideVanillaBlocks;
        vm.extensionManager.refreshBlocks();
        if (!runtime.extensionStorage) return;
        if (!runtime.extensionStorage[extId]) {
          runtime.extensionStorage[extId] = {};
        }
        runtime.extensionStorage[extId].hideVanillaBlocks = this.hideVanillaBlocks;
      }
      vanillaBlock(xml) {
        return {
          blockType: Scratch2.BlockType.XML,
          xml,
          hideFromPalette: this.hideVanillaBlocks
        };
      }
      init() {
        if (this.scene) return;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1e3);
        this.camera.position.set(0, 0, 200);
        this.camera.lookAt(0, 0, 0);
        this.camera.near = 0.5;
        this.camera.far = 4800;
        this.renderer = new THREE.WebGPURenderer();
        this.renderer.setClearAlpha(0);
        this.threeSkinId = renderer._nextSkinId++;
        this.threeSkin = new SimpleSkin(
          this.threeSkinId,
          renderer
        );
        renderer._allSkins[this.threeSkinId] = this.threeSkin;
        this.threeDrawableId = renderer.createDrawable("pen");
        renderer._allDrawables[this.threeDrawableId].customDrawableName = "CST 3D Layer";
        renderer.updateDrawableSkinId(
          this.threeDrawableId,
          this.threeSkinId
        );
        this.stageSizeEvent = (() => {
          this.updateScale();
        }).bind(this);
        vm.on("STAGE_SIZE_CHANGED", this.stageSizeEvent);
        this.stampRenderTarget = new THREE.WebGLRenderTarget();
        this.raycaster = new THREE.Raycaster();
        this.applyPatches();
        this.updateScale();
      }
      uninit() {
        for (const dr of renderer._allDrawables) {
          if (!dr) continue;
          this.disable3DForDrawable(dr.id);
          delete dr[IN_3D];
          delete dr[OBJECT];
        }
        if (this.scene) this.scene.clear();
        this.scene = void 0;
        this.camera = void 0;
        if (this.renderer) this.renderer.dispose();
        this.renderer = void 0;
        if (this.threeSkinId)
          this.threeSkin.dispose();
        this.threeSkinId = void 0;
        if (this.threeDrawableId)
          renderer._allDrawables[this.threeDrawableId].dispose();
        this.threeDrawableId = void 0;
        if (this.stageSizeEvent)
          vm.off("STAGE_SIZE_CHANGED", this.stageSizeEvent);
        this.stageSizeEvent = void 0;
        if (this.stampRenderTarget) this.stampRenderTarget.dispose();
        this.stampRenderTarget = void 0;
        runtime.requestRedraw();
      }
      // call when the native size of the canvas changes
      updateScale() {
        const w = runtime.stageWidth || 480;
        const h = runtime.stageHeight || 360;
        this.threeSkin[0] = w;
        this.threeSkin[1] = h;
        this.camera.aspect = w / h;
        this.renderer.setSize(w, h);
        this.stampRenderTarget.setSize(w, h);
        this.camera.updateProjectionMatrix();
        this.updateRenderer();
      }
      // patches for stuff
      applyPatches() {
        const Drawable = renderer.exports.Drawable;
        const threed = this;
        patch(Drawable.prototype, {
          getVisible(og) {
            if (this[IN_3D]) return false;
            return og();
          },
          updateVisible(og, value) {
            if (this[IN_3D]) {
              const o = this[OBJECT];
              if (o.visible !== value) {
                o.visible = value;
                threed.updateRenderer();
              }
            }
            return og(value);
          },
          updatePosition(og, position) {
            if (this[IN_3D]) {
              const o = this[OBJECT];
              o.position.x = position[0];
              o.position.y = position[1];
              threed.updateRenderer();
            }
            return og(position);
          },
          updateDirection(og, direction) {
            if (this[IN_3D]) {
              this[ROLL] = THREE.MathUtils.degToRad(direction);
              threed.updateSpriteAngle(this);
              threed.updateRenderer();
            }
            return og(direction);
          },
          updateScale(og, scale) {
            if (this[IN_3D]) {
              const obj = this[OBJECT];
              obj.scale.x = (obj._sizeX ?? 100) / 100 * scale[0];
              obj.scale.y = (obj._sizeY ?? 100) / 100 * scale[1];
              obj.scale.z = (obj._sizeZ ?? 100) / 100 * scale[0];
              threed.updateRenderer();
            }
            return og(scale);
          },
          dispose(og) {
            if (this[OBJECT]) {
              this[OBJECT].removeFromParent();
              this[OBJECT].material.dispose();
              if (Array.isArray(this[OBJECT].material)) {
                this[OBJECT].material.forEach((material) => {
                  material.map.dispose();
                });
              } else {
                this[OBJECT].material.dispose();
                if (this[OBJECT].material.map) this[OBJECT].material.map.dispose();
              }
              this[OBJECT].geometry.dispose();
              this[OBJECT] = null;
              threed.updateRenderer();
            }
            return og();
          },
          _skinWasAltered(og) {
            og();
            if (this[IN_3D]) {
              threed.updateDrawableSkin(this);
              threed.updateRenderer();
            }
          }
        });
        patch(renderer, {
          draw(og) {
            if (this[THREED_DIRTY]) {
              threed.doUpdateRenderer();
              this[THREED_DIRTY] = false;
            }
            return og();
          },
          isTouchingDrawables(og, drawableID, candidateIDs = this._drawList) {
            const dr = this._allDrawables[drawableID];
            if (dr[IN_3D]) {
              const candidates = candidateIDs.filter(
                (id) => this._allDrawables[id][IN_3D]
              );
              for (const candidate of candidates) {
                if (threed.touching3D(
                  dr[OBJECT],
                  this._allDrawables[candidate][OBJECT]
                ))
                  return true;
              }
              return false;
            }
            return og(
              drawableID,
              candidateIDs.filter((id) => !this._allDrawables[id][IN_3D])
            );
          },
          penStamp(og, penSkinID, stampID) {
            const dr = this._allDrawables[stampID];
            if (!dr) return;
            if (dr[IN_3D]) {
              const threed2 = Drawable.threed;
              threed2.renderer.render(dr[OBJECT], threed2.camera);
              this._allSkins[threed2.threeSkinId].setContent(
                threed2.renderer.domElement
              );
              og(penSkinID, threed2.threeDrawableId);
              threed2.updateRenderer();
              return;
            }
            return og(penSkinID, stampID);
          },
          pick(og, centerX, centerY, touchWidth, touchHeight, candidateIDs) {
            const pick2d = og(
              centerX,
              centerY,
              touchWidth,
              touchHeight,
              candidateIDs
            );
            if (pick2d !== -1) return pick2d;
            if (!threed.raycaster) return false;
            const bounds = this.clientSpaceToScratchBounds(
              centerX,
              centerY,
              touchWidth,
              touchHeight
            );
            if (bounds.left === -Infinity || bounds.bottom === -Infinity) {
              return false;
            }
            const candidates = (candidateIDs || this._drawList).map((id) => this._allDrawables[id]).filter((dr) => dr[IN_3D]);
            if (candidates.length <= 0) return -1;
            const scratchCenterX = (bounds.left + bounds.right) / this._gl.canvas.clientWidth;
            const scratchCenterY = (bounds.top + bounds.bottom) / this._gl.canvas.clientHeight;
            threed.raycaster.setFromCamera(
              new THREE.Vector2(scratchCenterX, scratchCenterY),
              threed.camera
            );
            const object = threed.raycaster.intersectObject(threed.scene, true)[0]?.object;
            if (!object) return -1;
            const drawable = candidates.find(
              (c) => c[IN_3D] && c[OBJECT] === object
            );
            if (!drawable) return -1;
            return drawable._id;
          },
          drawableTouching(og, drawableID, centerX, centerY, touchWidth, touchHeight) {
            const drawable = this._allDrawables[drawableID];
            if (!drawable) {
              return false;
            }
            if (!drawable[IN_3D]) {
              return og(drawableID, centerX, centerY, touchWidth, touchHeight);
            }
            if (!threed.raycaster) return false;
            const bounds = this.clientSpaceToScratchBounds(
              centerX,
              centerY,
              touchWidth,
              touchHeight
            );
            const scratchCenterX = (bounds.left + bounds.right) / this._gl.canvas.clientWidth;
            const scratchCenterY = (bounds.top + bounds.bottom) / this._gl.canvas.clientHeight;
            threed.raycaster.setFromCamera(
              new THREE.Vector2(scratchCenterX, scratchCenterY),
              threed.camera
            );
            const intersect = threed.raycaster.intersectObject(threed.scene, true);
            const object = intersect[0]?.object;
            return object === drawable[OBJECT];
          },
          extractDrawableScreenSpace(og, drawableID) {
            const drawable = this._allDrawables[drawableID];
            if (!drawable)
              throw new Error(
                `Could not extract drawable with ID ${drawableID}; it does not exist`
              );
            if (!drawable[IN_3D]) return og(drawableID);
            threed.renderer.render(drawable[OBJECT], threed.camera);
            this._allSkins[threed.threeSkinId].setContent(
              threed.renderer.domElement
            );
            const extracted = og(threed.threeDrawableId);
            threed.updateRenderer();
            return extracted;
          }
        });
        patch(renderer.exports.Skin, {
          dispose(og) {
            if (this._3dCachedTexture) this._3dCachedTexture.dispose();
            og();
          },
          _setTexture(og, textureData) {
            if (this._3dCachedTexture) {
              this._3dCachedTexture.dispose();
              this._3dCachedTexture = null;
              const returnValue = og(textureData);
              threed.getThreeTextureFromSkin(this);
              return returnValue;
            }
            return og(textureData);
          }
        });
      }
      updateRenderer() {
        renderer[THREED_DIRTY] = true;
        runtime.requestRedraw();
      }
      // pushes the current 3d render state into the drawable
      doUpdateRenderer() {
        this.init();
        this.renderer.renderAsync(this.scene, this.camera);
        if (!this.threeSkinId) return;
        this.threeSkin.setContent(
          this.renderer.domElement
        );
      }
      updateDrawableSkin(drawable) {
        if (drawable[OBJECT] && drawable[OBJECT].material) {
          if (Array.isArray(drawable[OBJECT].material)) {
            drawable[OBJECT].material.forEach((material) => {
              material.map = this.getThreeTextureFromSkin(
                drawable.skin
              );
            });
          } else {
            drawable[OBJECT].material.map = this.getThreeTextureFromSkin(
              drawable.skin
            );
          }
        }
      }
      /// GENERAL UTILS ///
      hexToNumber(hex) {
        return parseInt(hex.slice(1), 16);
      }
      /// MISC OBJECT UTILS ////
      getThreeTextureFromSkin(skin) {
        if (skin._3dCachedTexture) return skin._3dCachedTexture;
        skin._3dCachedTexture = new THREE.CanvasTexture(
          this.getCanvasFromSkin(skin)
        );
        skin._3dCachedTexture.colorSpace = THREE.SRGBColorSpace;
        return skin._3dCachedTexture;
      }
      objectShape(obj) {
        let shape = null;
        if (obj.geometry) {
          if (obj.geometry instanceof THREE.SphereGeometry) {
            obj.geometry.computeBoundingSphere();
            shape = obj.geometry.boundingSphere;
          } else {
            obj.geometry.computeBoundingBox();
            shape = obj.geometry.boundingBox;
          }
        } else if (obj instanceof THREE.SPRITE) {
          const sx = obj.scale.x / 2;
          const sy = obj.scale.y / 2;
          shape = new THREE.Box3(
            new THREE.Vector3(-sx, -sy, -sx),
            new THREE.Vector3(sx, sy, -sx)
          );
        }
        return shape;
      }
      objectShapeTransformed(obj) {
        const shape = this.objectShape(obj);
        if (!shape) return null;
        const worldPos = obj.getWorldPosition(new THREE.Vector3());
        if (shape instanceof THREE.Box3) {
          shape.min.multiply(obj.scale);
          shape.min.add(worldPos);
          shape.max.multiply(obj.scale);
          shape.max.add(worldPos);
        } else if (shape instanceof THREE.Sphere) {
          shape.radius *= Math.max(obj.scale.x, obj.scale.y, obj.scale.z);
          shape.center.add(worldPos);
        }
        return shape;
      }
      touching3D(objA, objB) {
        const shapeA = this.objectShapeTransformed(objA);
        const shapeB = this.objectShapeTransformed(objB);
        if (!shapeA || !shapeB) return false;
        const nameB = shapeB instanceof THREE.Sphere ? "Sphere" : "Box";
        const func = shapeA["intersects" + nameB];
        if (!func) return false;
        return func.call(shapeA, shapeB);
      }
      /// MENUS
      // originally from clones plus: https://extensions.turbowarp.org/Lily/ClonesPlus.js
      getSprites() {
        let spriteNames = [];
        const targets = runtime.targets;
        for (let index = 1; index < targets.length; index++) {
          const curTarget = targets[index].sprite;
          if (targets[index].isOriginal) {
            const jsonOBJ = {
              text: curTarget.name,
              value: curTarget.name
            };
            spriteNames.push(jsonOBJ);
          }
        }
        if (spriteNames.length > 0) {
          return spriteNames;
        } else {
          return [{ text: "", value: 0 }];
        }
      }
      ///
      /// DRAWABLE STUFF ///
      // thanks stackoverflow
      // https://stackoverflow.com/a/18804083
      getCanvasFromTexture(gl, texture, width, height) {
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          texture,
          0
        );
        const data = new Uint8Array(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
        gl.deleteFramebuffer(framebuffer);
        const imageData = new ImageData(width, height);
        imageData.data.set(data);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.putImageData(imageData, 0, 0);
        return canvas;
      }
      getCanvasFromSkin(skin) {
        const emptyCanvas = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 1;
          canvas.height = 1;
          return canvas;
        };
        switch (skin.constructor) {
          case renderer.exports.BitmapSkin: {
            if (skin._textureSize[0] < 1 || skin._textureSize[1] < 1)
              return emptyCanvas();
            return this.getCanvasFromTexture(
              renderer.gl,
              skin.getTexture(),
              skin._textureSize[0],
              skin._textureSize[1]
            );
          }
          case renderer.exports.SVGSkin: {
            const INDEX_OFFSET = 8;
            const textureScale = 200;
            const scaleMax = textureScale ? Math.max(Math.abs(textureScale), Math.abs(textureScale)) : 100;
            const requestedScale = Math.min(scaleMax / 100, skin._maxTextureScale);
            const mipLevel = Math.max(
              Math.ceil(Math.log2(requestedScale)) + INDEX_OFFSET,
              0
            );
            const mipScale = Math.pow(2, mipLevel - INDEX_OFFSET);
            const sizeX = Math.ceil(skin._size[0] * mipScale);
            const sizeY = Math.ceil(skin._size[1] * mipScale);
            if (sizeX < 1 || sizeY < 1) return emptyCanvas();
            return this.getCanvasFromTexture(
              renderer.gl,
              skin.getTexture([textureScale, textureScale]),
              sizeX,
              sizeY
            );
          }
          default:
            console.error("Could not get skin image data:", skin);
            throw new TypeError("Could not get skin image data");
        }
      }
      getSizeFromSkin(skin) {
        switch (skin.constructor) {
          case renderer.exports.BitmapSkin: {
            return [skin._textureSize[0], skin._textureSize[1]];
          }
          case renderer.exports.SVGSkin: {
            return skin._size;
          }
          default:
            console.error("Could not get skin size:", skin);
            throw new TypeError("Could not get skin size");
        }
      }
      enable3DForDrawable(drawableID, type = "flat") {
        const dr = renderer._allDrawables[drawableID];
        if (dr[IN_3D]) return;
        dr[IN_3D] = true;
        let obj;
        if (type === "sprite") {
          obj = new THREE.Sprite();
        } else {
          obj = new THREE.Mesh();
        }
        dr[OBJECT] = obj;
        this.updateMeshForDrawable(drawableID, type);
        if (!(YAW in dr)) dr[YAW] = 0;
        if (!(PITCH in dr)) dr[PITCH] = 0;
        if (!(ROLL in dr)) dr[ROLL] = 0;
        if (!(Z_POS in dr)) dr[Z_POS] = 0;
        this.scene.add(obj);
        this.updateAttachment(dr);
        this.updateRenderer();
      }
      updateMeshForDrawable(drawableID, type) {
        const dr = renderer._allDrawables[drawableID];
        if (!dr[IN_3D]) return;
        const obj = dr[OBJECT];
        if (obj.isSprite) {
          if (obj.material) obj.material.dispose();
          obj.material = new THREE.SpriteMaterial();
          try {
            const size = this.getSizeFromSkin(dr.skin);
            obj._sizeX = size[0];
            obj._sizeY = size[1];
            obj._sizeZ = size[0];
          } catch (e) {
            console.error(e);
            obj._sizeX = 0;
            obj._sizeY = 0;
            obj._sizeZ = 0;
          }
        } else {
          obj.material = new THREE.MeshPhongMaterial();
          switch (type) {
            case "flat":
              obj.geometry = new THREE.PlaneGeometry(
                dr.skin.size[0],
                dr.skin.size[1]
              );
              break;
            case "flat triangle":
              {
                const geometry = new THREE.BufferGeometry();
                const w = dr.skin.size[0] / 2;
                const h = dr.skin.size[1] / 2;
                const vertices = new Float32Array([
                  -w,
                  -h,
                  0,
                  w,
                  -h,
                  0,
                  -w,
                  h,
                  0
                ]);
                const uvs = new Float32Array([0, 0, 1, 0, 0, 1]);
                geometry.setIndex([0, 1, 2]);
                geometry.setAttribute(
                  "position",
                  new THREE.BufferAttribute(vertices, 3)
                );
                geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
                obj.geometry = geometry;
              }
              break;
            case "cube":
              obj.geometry = new THREE.BoxGeometry(
                dr.skin.size[0],
                dr.skin.size[1],
                dr.skin.size[0]
              );
              break;
            case "sphere":
              obj.geometry = new THREE.SphereGeometry(
                Math.max(dr.skin.size[0], dr.skin.size[1]) / 2,
                24,
                12
              );
              break;
            case "low-poly sphere":
              obj.geometry = new THREE.SphereGeometry(
                Math.max(dr.skin.size[0], dr.skin.size[1]) / 2,
                8,
                6
              );
              break;
          }
          obj._sizeX = 1;
          obj._sizeY = 1;
          obj._sizeZ = 1;
        }
        if (obj?.material?.map) obj?.material?.map?.dispose();
        const texture = this.getThreeTextureFromSkin(dr.skin);
        if (dr[OBJECT] && Array.isArray(dr[OBJECT].material)) {
          dr[OBJECT].material.forEach((material) => {
            material.map = texture;
            texture.colorSpace = THREE.SRGBColorSpace;
            material.alphaTest = 0.01;
          });
        } else {
          obj.material.map = texture;
          texture.colorSpace = THREE.SRGBColorSpace;
          obj.material.alphaTest = 0.01;
        }
        this.updateMaterialForDrawable(drawableID);
        dr.updateScale(dr.scale);
      }
      updateMaterialForDrawable(drawableID) {
        const dr = renderer._allDrawables[drawableID];
        if (!dr[IN_3D]) return;
        const obj = dr[OBJECT];
        if (!(SIDE_MODE in dr)) dr[SIDE_MODE] = THREE.DoubleSide;
        if (!(TEX_FILTER in dr)) dr[TEX_FILTER] = THREE.LinearMipmapLinearFilter;
        let texture = null;
        if (dr[OBJECT] && Array.isArray(dr[OBJECT].material)) {
          dr[OBJECT].material.forEach((material) => {
            material.side = dr[SIDE_MODE];
            texture = material.map;
            texture.minFilter = dr[TEX_FILTER];
            texture.magFilter = dr[TEX_FILTER];
            if (texture.magFilter === THREE.LinearMipmapLinearFilter)
              texture.magFilter = THREE.LinearFilter;
            material.transparent = true;
          });
        } else {
          obj.material.side = dr[SIDE_MODE];
          texture = obj.material.map;
          texture.minFilter = dr[TEX_FILTER];
          texture.magFilter = dr[TEX_FILTER];
          if (texture.magFilter === THREE.LinearMipmapLinearFilter)
            texture.magFilter = THREE.LinearFilter;
          obj.material.transparent = true;
        }
      }
      disable3DForDrawable(drawableID) {
        const dr = renderer._allDrawables[drawableID];
        if (!dr[IN_3D]) return;
        dr[IN_3D] = false;
        dr[Z_POS] = dr[OBJECT].position.z;
        dr[OBJECT].removeFromParent();
        if (Array.isArray(dr[OBJECT].material)) {
          dr[OBJECT].material.forEach((material) => {
            material.map.dispose();
          });
        } else {
          dr[OBJECT].material.dispose();
          if (dr[OBJECT].material.map) dr[OBJECT].material.map.dispose();
        }
        dr[OBJECT].geometry.dispose();
        dr[OBJECT] = null;
        this.updateRenderer();
      }
      /// BLOCKS ///
      setMode({ MODE }, util) {
        if (util.target.isStage) return;
        this.init();
        switch (MODE) {
          case "disabled":
            this.disable3DForDrawable(util.target.drawableID);
            break;
          case "flat":
          case "flat triangle":
          case "sprite":
          case "cube":
          case "sphere":
          case "low-poly sphere":
            this.disable3DForDrawable(util.target.drawableID);
            this.enable3DForDrawable(util.target.drawableID, MODE);
            if (util.target.renderer) {
              this.refreshThreeDrawable(util.target);
            }
            break;
        }
      }
      refreshThreeDrawable(target) {
        const { direction, scale } = target._getRenderedDirectionAndScale();
        const dr = target.renderer._allDrawables[target.drawableID];
        dr.updatePosition([target.x, target.y]);
        dr.updateDirection(direction);
        dr.updateScale(scale);
        dr.updateVisible(target.visible);
        if (dr[OBJECT]) {
          dr[OBJECT].position.z = dr[Z_POS];
        }
        this.updateSpriteAngle({ target });
      }
      setZ({ Z }, util) {
        if (util.target.isStage) return;
        const dr = renderer._allDrawables[util.target.drawableID];
        if (!dr[IN_3D]) return;
        dr[OBJECT].position.z = Scratch2.Cast.toNumber(Z);
        this.updateRenderer();
      }
      changeZ({ Z }, util) {
        if (util.target.isStage) return;
        const dr = renderer._allDrawables[util.target.drawableID];
        if (!dr[IN_3D]) return;
        const z = Scratch2.Cast.toNumber(Z);
        dr[OBJECT].position.z += z;
        this.updateRenderer();
      }
      getZ(args, util) {
        if (util.target.isStage) return 0;
        const dr = renderer._allDrawables[util.target.drawableID];
        if (!dr[OBJECT]) return 0;
        return dr[OBJECT].position.z;
      }
      mod(n, modulus) {
        let result = n % modulus;
        if (result / modulus < 0) result += modulus;
        return result;
      }
      wrapClamp(n, min, max) {
        const offset = n - min;
        const range = max - min;
        return min + this.mod(offset, range);
      }
      updateSpriteAngle(util) {
        let dr;
        if (util?.target) {
          if (util.target.isStage) return;
          dr = renderer._allDrawables[util.target.drawableID];
        } else {
          dr = util;
        }
        if (!dr[IN_3D]) return;
        const obj = dr[OBJECT];
        obj.rotation.x = 0;
        obj.rotation.y = 0;
        obj.rotation.z = 0;
        const WRAP_MIN = THREE.MathUtils.degToRad(-180);
        const WRAP_MAX = THREE.MathUtils.degToRad(180);
        dr[YAW] = this.wrapClamp(dr[YAW], WRAP_MIN, WRAP_MAX);
        dr[PITCH] = this.wrapClamp(dr[PITCH], WRAP_MIN, WRAP_MAX);
        dr[ROLL] = this.wrapClamp(dr[ROLL], WRAP_MIN, WRAP_MAX);
        obj.rotation.y = dr[YAW];
        obj.rotateOnAxis(new THREE.Vector3(1, 0, 0), dr[PITCH]);
        obj.rotateOnAxis(
          new THREE.Vector3(0, 0, 1),
          THREE.MathUtils.degToRad(90) - dr[ROLL]
        );
      }
      set3DPos({ X, Y, Z }, util) {
        if (util.target.isStage) return;
        X = Scratch2.Cast.toNumber(X);
        Y = Scratch2.Cast.toNumber(Y);
        util.target.setXY(X, Y);
        this.setZ({ Z }, util);
      }
      change3DPos({ X, Y, Z }, util) {
        if (util.target.isStage) return;
        const dx = Scratch2.Cast.toNumber(X);
        const dy = Scratch2.Cast.toNumber(Y);
        util.target.setXY(util.target.x + dx, util.target.y + dy);
        this.changeZ({ Z }, util);
      }
      moveSteps({ STEPS }, util) {
        if (util.target.isStage) return;
        const dr = renderer._allDrawables[util.target.drawableID];
        if (!dr[IN_3D]) return;
        const add = new THREE.Vector3(0, 0, 1).applyQuaternion(dr[OBJECT].quaternion).multiplyScalar(-Scratch2.Cast.toNumber(STEPS));
        util.target.setXY(util.target.x + add.x, util.target.y + add.y);
        this.changeZ({ Z: add.z }, util);
        this.updateRenderer();
      }
      rotate3D({ DIRECTION, DEGREES }, util) {
        if (util.target.isStage) return;
        const dr = renderer._allDrawables[util.target.drawableID];
        if (!dr[IN_3D]) return;
        if (!isFinite(DEGREES)) return;
        DEGREES = Scratch2.Cast.toNumber(DEGREES) * (DIRECTION === "left" || DIRECTION === "down" || DIRECTION === "ccw" ? -1 : 1);
        switch (DIRECTION) {
          case "left":
          case "right":
            dr[YAW] -= THREE.MathUtils.degToRad(DEGREES);
            break;
          case "up":
          case "down":
            dr[PITCH] += THREE.MathUtils.degToRad(DEGREES);
            break;
          case "cw":
          case "ccw":
            util.target.setDirection(util.target.direction + DEGREES);
            break;
        }
        this.updateSpriteAngle(util);
        this.updateRenderer();
      }
      set3DDir({ DIRECTION, DEGREES }, util) {
        if (util.target.isStage) return;
        const dr = renderer._allDrawables[util.target.drawableID];
        if (!dr[IN_3D]) return;
        DEGREES = Scratch2.Cast.toNumber(DEGREES);
        if (!isFinite(DEGREES)) return;
        switch (DIRECTION) {
          case "y":
          case "angle":
            dr[YAW] = -THREE.MathUtils.degToRad(DEGREES);
            break;
          case "x":
          case "aim":
            dr[PITCH] = THREE.MathUtils.degToRad(DEGREES);
            break;
          case "z":
          case "roll":
            util.target.setDirection(DEGREES + 90);
            break;
        }
        this.updateSpriteAngle(util);
        this.updateRenderer();
      }
      direction3D({ DIRECTION }, util) {
        if (util.target.isStage) return 0;
        const dr = renderer._allDrawables[util.target.drawableID];
        if (!dr[IN_3D]) return 0;
        switch (DIRECTION) {
          case "y":
          case "angle":
            return -THREE.MathUtils.radToDeg(dr[YAW]);
          case "x":
          case "aim":
            return THREE.MathUtils.radToDeg(dr[PITCH]);
          case "z":
          case "roll":
            return THREE.MathUtils.radToDeg(dr[ROLL]) - 90;
          default:
            return 0;
        }
      }
      setSideMode({ SIDE }, util) {
        if (util.target.isStage) return;
        const dr = renderer._allDrawables[util.target.drawableID];
        this.init();
        const sides = Object.assign(/* @__PURE__ */ Object.create(null), {
          front: THREE.FrontSide,
          back: THREE.BackSide,
          both: THREE.DoubleSide
        });
        if (!(SIDE in sides)) return;
        dr[SIDE_MODE] = sides[SIDE];
        if (dr[OBJECT] && Array.isArray(dr[OBJECT].material)) {
          dr[OBJECT].material.forEach((material) => {
            material.side = sides[SIDE];
          });
          this.updateRenderer();
          return;
        }
        if (dr[OBJECT] && dr[OBJECT].material) {
          dr[OBJECT].material.side = sides[SIDE];
          this.updateRenderer();
          return;
        }
      }
      updateAttachment(dr) {
        if (!this.scene) return;
        if (dr[IN_3D]) {
          const newParent = dr[ATTACHED_TO]?.[OBJECT] || this.scene;
          if (dr[OBJECT].parent !== newParent) {
            dr[OBJECT].removeFromParent();
            newParent.add(dr[OBJECT]);
            this.updateRenderer();
          }
        }
      }
      attach({ TARGET }, util) {
        if (util.target.isStage) return;
        const targetObj = runtime.getSpriteTargetByName(Scratch2.Cast.toString(TARGET));
        if (!targetObj) return;
        const dr = renderer._allDrawables[util.target.drawableID];
        const targetDr = renderer._allDrawables[targetObj.drawableID];
        if (dr === targetDr) return;
        dr[ATTACHED_TO] = targetDr;
        this.updateAttachment(dr);
      }
      attachVar({ VARIABLE, VALUE }, util) {
        if (util.target.isStage) return;
        VARIABLE = Scratch2.Cast.toString(VARIABLE);
        VALUE = Scratch2.Cast.toString(VALUE);
        const dr = renderer._allDrawables[util.target.drawableID];
        let targetDr = void 0;
        for (const target of runtime.targets) {
          const variable = target.lookupVariableByNameAndType(VARIABLE, "", true);
          if (variable && Scratch2.Cast.toString(variable?.value) === VALUE) {
            targetDr = target.isStage ? null : renderer._allDrawables[target.drawableID];
            break;
          }
        }
        if (targetDr === void 0) return;
        if (dr === targetDr) return;
        dr[ATTACHED_TO] = targetDr;
        this.updateAttachment(dr);
      }
      detach(args, util) {
        if (util.target.isStage) return;
        const dr = renderer._allDrawables[util.target.drawableID];
        dr[ATTACHED_TO] = null;
        this.updateAttachment(dr);
      }
      getAttachedSprite(dr) {
        if (!dr[IN_3D] || !dr[ATTACHED_TO]) return null;
        const attachedId = dr[ATTACHED_TO].id;
        const attachedSprite = runtime.targets.find((target) => target.drawableID === attachedId);
        if (!attachedSprite) return null;
        return attachedSprite;
      }
      attachedSprite(args, util) {
        if (util.target.isStage) return "";
        const attachedSprite = this.getAttachedSprite(renderer._allDrawables[util.target.drawableID]);
        if (!attachedSprite) return "";
        return attachedSprite.sprite.name;
      }
      attachedSpriteVar({ VARIABLE }, util) {
        if (util.target.isStage) return "";
        const attachedSprite = this.getAttachedSprite(renderer._allDrawables[util.target.drawableID]);
        if (!attachedSprite) return "";
        VARIABLE = Scratch2.Cast.toString(VARIABLE);
        return attachedSprite.lookupVariableByNameAndType(VARIABLE, "", true)?.value ?? "";
      }
      setCubeTexture({ RIGHT, LEFT, TOP, BOTTOM, FRONT, BACK }, util) {
        if (util.target.isStage) return;
        const dr = renderer._allDrawables[util.target.drawableID];
        this.init();
        const loader = new THREE.TextureLoader();
        const right = util.target.getCostumeIndexByName(RIGHT);
        if (right === -1) return;
        const rightURL = util.target.sprite.costumes[right].asset.encodeDataURI();
        const rightMaterial = new THREE.MeshPhongMaterial({ map: loader.load(rightURL), transparent: true });
        rightMaterial.alphaTest = 0.01;
        const left = util.target.getCostumeIndexByName(LEFT);
        if (left === -1) return;
        const leftURL = util.target.sprite.costumes[left].asset.encodeDataURI();
        const leftMaterial = new THREE.MeshPhongMaterial({ map: loader.load(leftURL), transparent: true });
        leftMaterial.alphaTest = 0.01;
        const top = util.target.getCostumeIndexByName(TOP);
        if (top === -1) return;
        const topURL = util.target.sprite.costumes[top].asset.encodeDataURI();
        const topMaterial = new THREE.MeshPhongMaterial({ map: loader.load(topURL), transparent: true });
        topMaterial.alphaTest = 0.01;
        const bottom = util.target.getCostumeIndexByName(BOTTOM);
        if (bottom === -1) return;
        const bottomURL = util.target.sprite.costumes[bottom].asset.encodeDataURI();
        const bottomMaterial = new THREE.MeshPhongMaterial({ map: loader.load(bottomURL), transparent: true });
        bottomMaterial.alphaTest = 0.01;
        const front = util.target.getCostumeIndexByName(FRONT);
        if (front === -1) return;
        const frontURL = util.target.sprite.costumes[front].asset.encodeDataURI();
        const frontMaterial = new THREE.MeshPhongMaterial({ map: loader.load(frontURL), transparent: true });
        frontMaterial.alphaTest = 0.01;
        const back = util.target.getCostumeIndexByName(BACK);
        if (back === -1) return;
        const backURL = util.target.sprite.costumes[back].asset.encodeDataURI();
        const backMaterial = new THREE.MeshPhongMaterial({ map: loader.load(backURL), transparent: true });
        backMaterial.alphaTest = 0.01;
        const object = dr[OBJECT];
        if (object && object.geometry instanceof THREE.BoxGeometry) {
          if (object && Array.isArray(object.material)) {
            object.material.forEach((material) => {
              material.map.dispose();
              material.needsUpdate = true;
            });
          } else {
            object.material.map.dispose();
            object.material.needsUpdate = true;
          }
          const cubeMaterials = [
            rightMaterial,
            //right side
            leftMaterial,
            //left side
            topMaterial,
            //top side
            bottomMaterial,
            //bottom side
            frontMaterial,
            //front side
            backMaterial
            //back side
          ];
          object.material = cubeMaterials;
          object.material.needsUpdate = true;
          this.updateMaterialForDrawable(util.target.drawableID);
          dr.updateScale(dr.scale);
          this.updateRenderer();
        }
      }
      setTexFilter({ FILTER }, util) {
        if (util.target.isStage) return;
        const dr = renderer._allDrawables[util.target.drawableID];
        this.init();
        const filters = Object.assign(/* @__PURE__ */ Object.create(null), {
          nearest: THREE.NearestFilter,
          linear: THREE.LinearMipmapLinearFilter
        });
        if (!(FILTER in filters)) return;
        dr[TEX_FILTER] = filters[FILTER];
        if (dr[OBJECT] && Array.isArray(dr[OBJECT].material)) {
          dr[OBJECT].material.forEach((material) => {
            const cloned = material.map.clone();
            material.map.dispose();
            cloned.colorSpace = THREE.SRGBColorSpace;
            material.map = cloned;
            cloned.needsUpdate = true;
          });
          this.updateMaterialForDrawable(util.target.drawableID);
          this.updateRenderer();
          return;
        }
        if (dr[OBJECT] && dr[OBJECT].material?.map) {
          const cloned = dr[OBJECT].material.map.clone();
          dr[OBJECT].material.map.dispose();
          dr[OBJECT].material.map = cloned;
          cloned.needsUpdate = true;
          this.updateMaterialForDrawable(util.target.drawableID);
          this.updateRenderer();
          return;
        }
      }
      preUpdateCameraAngle() {
        if (!(YAW in this.camera)) this.camera[YAW] = 0;
        if (!(PITCH in this.camera)) this.camera[PITCH] = 0;
        if (!(ROLL in this.camera)) this.camera[ROLL] = 0;
      }
      updateCameraAngle() {
        this.camera.rotation.x = 0;
        this.camera.rotation.y = 0;
        this.camera.rotation.z = 0;
        const WRAP_MIN = THREE.MathUtils.degToRad(-180);
        const WRAP_MAX = THREE.MathUtils.degToRad(180);
        this.camera[YAW] = this.wrapClamp(this.camera[YAW], WRAP_MIN, WRAP_MAX);
        this.camera[PITCH] = this.wrapClamp(this.camera[PITCH], WRAP_MIN, WRAP_MAX);
        this.camera[ROLL] = this.wrapClamp(this.camera[ROLL], WRAP_MIN, WRAP_MAX);
        this.camera.rotation.y = this.camera[YAW];
        this.camera.rotateOnAxis(new THREE.Vector3(1, 0, 0), this.camera[PITCH]);
        this.camera.rotateOnAxis(new THREE.Vector3(0, 0, 1), this.camera[ROLL]);
      }
      setCam({ X, Y, Z }) {
        this.init();
        const x = Scratch2.Cast.toNumber(X);
        const y = Scratch2.Cast.toNumber(Y);
        const z = Scratch2.Cast.toNumber(Z);
        this.camera.position.set(x, y, z);
        this.updateRenderer();
      }
      changeCam({ X, Y, Z }) {
        this.init();
        const x = Scratch2.Cast.toNumber(X);
        const y = Scratch2.Cast.toNumber(Y);
        const z = Scratch2.Cast.toNumber(Z);
        const pos = this.camera.position;
        pos.set(pos.x + x, pos.y + y, pos.z + z);
        this.updateRenderer();
      }
      camX() {
        this.init();
        return this.camera.position.x;
      }
      camY() {
        this.init();
        return this.camera.position.y;
      }
      camZ() {
        this.init();
        return this.camera.position.z;
      }
      moveCamSteps({ STEPS }) {
        this.init();
        this.camera.position.add(
          new THREE.Vector3(0, 0, 1).applyQuaternion(this.camera.quaternion).multiplyScalar(-Scratch2.Cast.toNumber(STEPS))
        );
        this.updateRenderer();
      }
      rotateCam({ DIRECTION, DEGREES }) {
        this.init();
        DEGREES = Scratch2.Cast.toNumber(DEGREES) * (DIRECTION === "left" || DIRECTION === "down" || DIRECTION === "ccw" ? -1 : 1);
        this.preUpdateCameraAngle();
        switch (DIRECTION) {
          case "left":
          case "right":
            this.camera[YAW] -= THREE.MathUtils.degToRad(DEGREES);
            break;
          case "up":
          case "down":
            this.camera[PITCH] += THREE.MathUtils.degToRad(DEGREES);
            break;
          case "cw":
          case "ccw":
            this.camera[ROLL] += THREE.MathUtils.degToRad(DEGREES);
            break;
        }
        this.updateCameraAngle();
        this.updateRenderer();
      }
      setCamDir({ DEGREES, DIRECTION }) {
        this.init();
        DEGREES = Scratch2.Cast.toNumber(DEGREES);
        this.preUpdateCameraAngle();
        switch (DIRECTION) {
          case "y":
          case "angle":
            this.camera[YAW] = -THREE.MathUtils.degToRad(DEGREES);
            break;
          case "x":
          case "aim":
            this.camera[PITCH] = THREE.MathUtils.degToRad(DEGREES);
            break;
          case "z":
          case "roll":
            this.camera[ROLL] = THREE.MathUtils.degToRad(DEGREES);
            break;
        }
        this.updateCameraAngle();
        this.updateRenderer();
      }
      camDir({ DIRECTION }) {
        this.init();
        this.preUpdateCameraAngle();
        switch (DIRECTION) {
          case "y":
          case "angle":
            return -THREE.MathUtils.radToDeg(this.camera[YAW]);
          case "x":
          case "aim":
            return THREE.MathUtils.radToDeg(this.camera[PITCH]);
          case "z":
          case "roll":
            return THREE.MathUtils.radToDeg(this.camera[ROLL]);
          default:
            return 0;
        }
      }
      setCameraParam({ PARAM, VALUE }) {
        this.init();
        PARAM = Scratch2.Cast.toString(PARAM);
        switch (PARAM) {
          case "minimum render distance":
            VALUE = Math.max(Scratch2.Cast.toNumber(VALUE), 0.1);
            this.camera.near = VALUE;
            break;
          case "maximum render distance":
            VALUE = Math.min(Scratch2.Cast.toNumber(VALUE), 48e5);
            this.camera.far = VALUE;
            break;
          case "vertical FOV":
            VALUE = Math.min(Math.max(Scratch2.Cast.toNumber(VALUE), 1e-3), 36e3);
            this.camera.fov = VALUE;
            break;
          default:
            return;
        }
        this.camera.updateProjectionMatrix();
        this.updateRenderer();
      }
      getCameraParam({ PARAM }) {
        this.init();
        PARAM = Scratch2.Cast.toString(PARAM);
        switch (PARAM) {
          case "minimum render distance":
            return this.camera.near;
          case "maximum render distance":
            return this.camera.far;
          case "vertical FOV":
            return this.camera.fov;
        }
        return "";
      }
      setFog({ n, f, color }) {
        this.scene.fog = new THREE.Fog(this.hexToNumber(color), n, f);
        this.updateRenderer();
      }
      setFogAtt({ att, v }) {
        switch (att) {
          case "near":
            this.scene.fog.near = v;
            break;
          case "far":
            this.scene.fog.far = v;
            break;
        }
        this.updateRenderer();
      }
      clearFog() {
        this.scene.fog = null;
        this.updateRenderer();
      }
      newLight({ name, typ, color }) {
        if (LIGHTS[name]) {
          this.deleteLight({ name });
        }
        let l = null;
        let col = this.hexToNumber(color);
        switch (typ) {
          case "point":
            l = new THREE.PointLight(col, 1 * Math.PI, 500);
            l.position.set(0, 0, 0);
            break;
          case "spotlight":
            l = new THREE.SpotLight(col);
            l.position.set(0, 0, 0);
            break;
          case "hemisphere":
            l = new THREE.HemisphereLight(col, col, 1 * Math.PI);
            l.position.set(0, 300, 0);
            break;
        }
        if (l) {
          l.intensity = 1;
          LIGHTS[name] = l;
          this.scene.add(l);
          this.updateRenderer();
        }
      }
      setLightIntensity({ name, v }) {
        LIGHTS[name].intensity = v * Math.PI * 100;
      }
      setLightDistance({ name, v }) {
        LIGHTS[name].distance = v;
      }
      setLightPos({ name, x, y, z }) {
        LIGHTS[name].position.set(x, y, z);
        this.updateRenderer();
      }
      changeLightPos({ name, x, y, z }) {
        let l = LIGHTS[name];
        l.position.set(
          l.position["x"] + x,
          l.position["y"] + y,
          l.position["z"] + z
        );
        this.updateRenderer();
      }
      setLightDir({ name, DIRECTION, DEGREES }) {
        const light = LIGHTS[name];
        if (light instanceof THREE.SpotLight) {
          switch (DIRECTION) {
            case "y":
            case "angle":
              light.target.position.set(
                light.target.position.x,
                -DEGREES,
                DEGREES
              );
              break;
            case "x":
            case "aim":
              light.target.position.set(
                -DEGREES,
                light.target.position.y,
                DEGREES
              );
              break;
            case "z":
            case "roll":
              light.target.position.set(
                -DEGREES,
                DEGREES,
                light.target.position.z
              );
              break;
            default:
              console.warn(
                `Direction '${DIRECTION}' is not valid. Use 'x', 'y', or 'z'.`
              );
              return;
          }
          light.target.updateMatrixWorld();
        }
      }
      changeLightDir({ name, DIRECTION, DEGREES }) {
        const light = LIGHTS[name];
        if (light instanceof THREE.SpotLight) {
          switch (DIRECTION) {
            case "y":
            case "angle":
              light.target.position.set(
                light.target.position.x,
                light.target.position.y + -DEGREES,
                light.target.position.z + DEGREES
              );
              break;
            case "x":
            case "aim":
              light.target.position.set(
                light.target.position.x + -DEGREES,
                light.target.position.y,
                light.target.position.z + DEGREES
              );
              break;
            case "z":
            case "roll":
              light.target.position.set(
                light.target.position.x + -DEGREES,
                light.target.position.y + DEGREES,
                light.target.position.z
              );
              break;
            default:
              console.warn(
                `Direction '${DIRECTION}' is not valid. Use 'x', 'y', or 'z'.`
              );
              return;
          }
          light.target.updateMatrixWorld();
        }
      }
      deleteLight({ name }) {
        this.scene.remove(LIGHTS[name]);
        delete LIGHTS[name];
        this.updateRenderer();
      }
      deleteLights() {
        console.log(LIGHTS);
        for (let name in LIGHTS) {
          this.scene.remove(LIGHTS[name]);
          delete LIGHTS[name];
        }
        this.updateRenderer();
      }
      getLightPos({ pos, name }) {
        let l = LIGHTS[name];
        if (!l) return;
        switch (pos) {
          case "x": {
            return l.position["x"];
          }
          case "y": {
            return l.position["y"];
          }
          case "z": {
            return l.position["z"];
          }
        }
      }
    }
    Scratch2.extensions.register(new ThreeD());
  })(Scratch);
})();
