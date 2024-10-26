import * as THREE from 'three'

/*
MODIFIED BY @deniskincses
	FIXED FOR PENGUINMOD (nem megy a "Hide/Show Vanilla Blocks")
	to do:
		add spotlight direction
		add light rasterization
		maybe even add 3d sprite (xyz) stretching 
*/

/*
MODIFIED BY @fath11
	to do:
		make variable names, argument ids, and block ids not painful to read
    merge lights with sprites?
*/

/* 
	Lighting test from @foil12 
  info
  Added linear fog
  Added lighting support (Point, Spot, Hemisphere)
  Scene may be black if you didin't add a light yet
  Lighting may be buggy
*/

// Special thanks to Drago NrxThulitech Cuven for finding lots of bugs

/*
  TODO:
  - bugs
  
  - model support???
    - "load (OBJ/MTL/GLTF) (text/data: URL) [] into model []"
    - "set 3d mode to model []"
    - collision support unlikely (if it did happen it would probably be very laggy)

  - materials/textures
    - "set material [0] texture to [current costume]"
    - "set material [0] color to ()"?
    - built-in shape materials would be in docs because docs will exist (they are essential)

  - 3d stamping
    - "3d stamp named []" block that copies the current 3d object
    - "duplicate 3d stamp [] as []"
    - "move 3d stamp [] to myself"
    - "delete 3d stamp []"
    - "erase all 3d stamps"
  
  - lighting
    - could be in the set 3d mode block, as in "set 3d mode to (point/spotlight)"
    - spotlights point in the direction the sprite is pointing
    - light color/intensity blocks
    - glow?
    - world light blocks (direction/disable/flat/color/intensity)
*/
;(function (Scratch) {
  'use strict'

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('3D must be run unsandboxed')
  }

  const IN_3D = 'threed.in3d'
  const OBJECT = 'threed.object'
  const THREED_DIRTY = 'threed.dirty'
  const SIDE_MODE = 'threed.sidemode'
  const TEX_FILTER = 'threed.texfilter'
  const Z_POS = 'threed.zpos'
  let LIGHTS = {}

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('3D must be run unsandboxed')
  }

  const PATCHES_ID = '__patches_cst12293d'
  const patch = (obj, functions) => {
    if (obj[PATCHES_ID]) return
    obj[PATCHES_ID] = {}
    for (const name in functions) {
      const original = obj[name]
      obj[PATCHES_ID][name] = obj[name]
      if (original) {
        obj[name] = function (...args) {
          const callOriginal = (...ogArgs) => original.call(this, ...ogArgs)
          return functions[name].call(this, callOriginal, ...args)
        }
      } else {
        obj[name] = function (...args) {
          return functions[name].call(this, () => {}, ...args)
        }
      }
    }
  }

  const unpatch = obj => {
    // eslint-disable-line @typescript-eslint/no-unused-vars
    if (!obj[PATCHES_ID]) return
    for (const name in obj[PATCHES_ID]) {
      obj[name] = obj[PATCHES_ID][name]
    }
    delete obj[PATCHES_ID]
  }

  const Skin = Scratch.renderer.exports.Skin

  // this class was originally made by Vadik1
  class SimpleSkin extends Skin {
    constructor(id, renderer) {
      super(id, renderer)
      const gl = renderer.gl
      const texture = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,255,0,255]));
      this._texture = texture
      this._rotationCenter = [240, 180]
      this._size = [480, 360]
    }
    dispose() {
      if (this._texture) {
        this._renderer.gl.deleteTexture(this._texture)
        this._texture = null
      }
      super.dispose()
    }
    set size(value) {
      this._size = value
      this._rotationCenter = [value[0] / 2, value[1] / 2]
    }
    get size() {
      return this._size
    }
    getTexture() {
      return this._texture || super.getTexture()
    }
    setContent(textureData) {
      const gl = this._renderer.gl
      gl.bindTexture(gl.TEXTURE_2D, this._texture)
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        textureData
      )
      this.emitWasAltered()
    }
  }

  const extId = 'cst12293d'

  class ThreeD {
    constructor(runtime) {
      this.runtime = runtime
    }
    getInfo() {
      return {
        id: extId,
        name: 'CST 3D',

        color1: '#2a47e8',
        color2: '#2439ad',
        color3: '#1b2d94',

        blocks: [
          {
            blockType: Scratch.BlockType.BUTTON,
            text: 'Open Documentation',
            func: 'viewDocs'
          },
          '---',
          {
            opcode: 'setMode',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set 3D mode to [MODE]',
            arguments: {
              MODE: {
                type: Scratch.ArgumentType.MENU,
                menu: 'MODE_MENU',
                defaultValue: 'flat'
              }
            }
          },
          '---',
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
            opcode: 'setZ',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set z to [Z]',
            arguments: {
              Z: {
                type: Scratch.ArgumentType.NUMBER,
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
            opcode: 'changeZ',
            blockType: Scratch.BlockType.COMMAND,
            text: 'change z by [Z]',
            arguments: {
              Z: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 10
              }
            }
          },
          this.vanillaBlock(`
            <block type="motion_xposition"></block>
            <block type="motion_yposition"></block>
          `),
          {
            opcode: 'getZ',
            blockType: Scratch.BlockType.REPORTER,
            text: 'z position'
          },
          {
            opcode: 'set3DPos',
            blockType: Scratch.BlockType.COMMAND,
            text: 'go to x: [X] y: [Y] z: [Z]',
            arguments: {
              X: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              },
              Y: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              },
              Z: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              }
            }
          },
          {
            opcode: 'change3DPos',
            blockType: Scratch.BlockType.COMMAND,
            text: 'change position by x: [X] y: [Y] z: [Z]',
            arguments: {
              X: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 10
              },
              Y: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              },
              Z: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              }
            }
          },
          '---',
          {
            opcode: 'moveSteps',
            blockType: Scratch.BlockType.COMMAND,
            text: 'move [STEPS] steps in 3D',
            arguments: {
              STEPS: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: '10'
              }
            }
          },
          {
            opcode: 'set3DDir',
            blockType: Scratch.BlockType.COMMAND,
            text: 'point in [DIRECTION] [DEGREES]',
            arguments: {
              DIRECTION: {
                type: Scratch.ArgumentType.STRING,
                menu: 'direction',
                defaultValue: 'y'
              },
              DEGREES: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              }
            }
          },
          {
            opcode: 'rotate3D',
            blockType: Scratch.BlockType.COMMAND,
            text: 'turn [DIRECTION] [DEGREES] degrees',
            arguments: {
              DIRECTION: {
                type: Scratch.ArgumentType.STRING,
                menu: 'turnDirection',
                defaultValue: 'right'
              },
              DEGREES: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 15
              }
            }
          },
          {
            opcode: 'direction3D',
            blockType: Scratch.BlockType.REPORTER,
            text: 'direction around [DIRECTION]',
            arguments: {
              DIRECTION: {
                type: Scratch.ArgumentType.MENU,
                menu: 'direction',
                defaultValue: 'y'
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
          '---',
          {
            opcode: 'setTexFilter',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set texture filter to [FILTER]',
            arguments: {
              FILTER: {
                type: Scratch.ArgumentType.STRING,
                menu: 'texFilter',
                defaultValue: 'nearest'
              }
            }
          },
          {
            opcode: 'setSideMode',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set shown faces to [SIDE]',
            arguments: {
              SIDE: {
                type: Scratch.ArgumentType.STRING,
                menu: 'side',
                defaultValue: 'both'
              }
            }
          },
          '---',
          {
            opcode: 'setCam',
            blockType: Scratch.BlockType.COMMAND,
            text: 'move camera to x: [X] y: [Y] z: [Z]',
            arguments: {
              X: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              },
              Y: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              },
              Z: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              }
            }
          },
          {
            opcode: 'changeCam',
            blockType: Scratch.BlockType.COMMAND,
            text: 'change camera by x: [X] y: [Y] z: [Z]',
            arguments: {
              X: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 10
              },
              Y: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              },
              Z: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              }
            }
          },
          {
            opcode: 'camX',
            blockType: Scratch.BlockType.REPORTER,
            text: 'camera x'
          },
          {
            opcode: 'camY',
            blockType: Scratch.BlockType.REPORTER,
            text: 'camera y'
          },
          {
            opcode: 'camZ',
            blockType: Scratch.BlockType.REPORTER,
            text: 'camera z'
          },
          '---',
          {
            opcode: 'moveCamSteps',
            blockType: Scratch.BlockType.COMMAND,
            text: 'move camera [STEPS] steps',
            arguments: {
              STEPS: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: '10'
              }
            }
          },
          {
            opcode: 'setCamDir',
            blockType: Scratch.BlockType.COMMAND,
            text: 'point camera in [DIRECTION] [DEGREES]',
            arguments: {
              DIRECTION: {
                type: Scratch.ArgumentType.STRING,
                menu: 'direction',
                defaultValue: 'y'
              },
              DEGREES: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              }
            }
          },
          {
            opcode: 'rotateCam',
            blockType: Scratch.BlockType.COMMAND,
            text: 'turn camera [DIRECTION] [DEGREES] degrees',
            arguments: {
              DIRECTION: {
                type: Scratch.ArgumentType.STRING,
                menu: 'turnDirection',
                defaultValue: 'right'
              },
              DEGREES: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 15
              }
            }
          },
          {
            opcode: 'camDir',
            blockType: Scratch.BlockType.REPORTER,
            text: 'camera direction around [DIRECTION]',
            arguments: {
              DIRECTION: {
                type: Scratch.ArgumentType.MENU,
                menu: 'direction',
                defaultValue: 'y'
              }
            }
          },
          '---',
          {
            opcode: 'setCameraParam',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set camera [PARAM] to [VALUE]',
            arguments: {
              PARAM: {
                type: Scratch.ArgumentType.STRING,
                menu: 'cameraParam',
                defaultValue: 'vertical FOV'
              },
              VALUE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: '50'
              }
            }
          },
          {
            opcode: 'getCameraParam',
            blockType: Scratch.BlockType.REPORTER,
            text: 'camera [PARAM]',
            arguments: {
              PARAM: {
                type: Scratch.ArgumentType.STRING,
                menu: 'cameraParam',
                defaultValue: 'vertical FOV'
              }
            }
          },
          {
            blockType: Scratch.BlockType.LABEL,
            text: 'Fog'
          },
          {
            opcode: 'setFog',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set fog near: [n] far: [f] color: [color]',
            arguments: {
              n: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 700
              },
              f: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 800
              },
              color: {
                type: Scratch.ArgumentType.COLOR,
                defaultValue: '#ffffff'
              }
            }
          },
          {
            opcode: 'setFogAtt',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set fog [att] to [v]',
            arguments: {
              att: {
                type: Scratch.ArgumentType.STRING,
                menu: 'fogAtt'
              },
              v: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              }
            }
          },

          {
            opcode: 'clearFog',
            blockType: Scratch.BlockType.COMMAND,
            text: 'reset fog'
          },
          {
            blockType: Scratch.BlockType.LABEL,
            text: 'Lighting'
          },
          {
            opcode: 'newLight',
            blockType: Scratch.BlockType.COMMAND,
            text: 'create light named [name] with type: [typ] color: [color]',
            arguments: {
              name: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'light'
              },
              typ: {
                type: Scratch.ArgumentType.STRING,
                menu: 'lightType'
              },
              color: {
                type: Scratch.ArgumentType.COLOR,
                defaultValue: '#ffffff'
              }
            }
          },
          {
            opcode: 'setLightIntensity',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set light [name] intensity to [v]',
            arguments: {
              name: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'light'
              },
              v: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1
              }
            }
          },
          {
            opcode: 'setLightDistance',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set light [name] max distance to [v]',
            arguments: {
              name: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'light'
              },
              v: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              }
            }
          },
          {
            opcode: 'setLightPos',
            blockType: Scratch.BlockType.COMMAND,
            text: 'move light [name] to x: [x] y: [y] z: [z]',
            arguments: {
              name: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'light'
              },
              x: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              },
              y: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              },
              z: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              }
            }
          },
          {
            opcode: 'changeLightPos',
            blockType: Scratch.BlockType.COMMAND,
            text: 'change light [name] by x: [x] y: [y] z: [z]',
            arguments: {
              name: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'light'
              },
              x: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              },
              y: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              },
              z: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              }
            }
          },
          {
            opcode: 'setLightDir',
            blockType: Scratch.BlockType.COMMAND,
            text: 'point light [name] in [direction] [degrees]',
            arguments: {
              name: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'light'
              },
              direction: {
                type: Scratch.ArgumentType.STRING,
                menu: 'direction',
                defaultValue: 'y'
              },
              degrees: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              }
            }
          },
          {
            opcode: 'changeLightDir',
            blockType: Scratch.BlockType.COMMAND,
            text: 'turn light [name] [DIRECTION] [DEGREES] degrees',
            arguments: {
              name: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'light'
              },
              DIRECTION: {
                type: Scratch.ArgumentType.STRING,
                menu: 'turnDirection',
                defaultValue: 'right'
              },
              DEGREES: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 15
              }
            }
          },
          {
            opcode: 'setLightRst',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set light [name] rasterization [raster]',
            arguments: {
              name: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'light'
              },
              raster: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: '25' // 0 to 100? i think
              }
            }
          },
          {
            opcode: 'deleteLight',
            blockType: Scratch.BlockType.COMMAND,
            text: 'delete light [name]',
            arguments: {
              name: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'light'
              }
            }
          },
          {
            opcode: 'deleteLights',
            blockType: Scratch.BlockType.COMMAND,
            text: 'delete all lights',
            arguments: {}
          },
          {
            opcode: 'getLightPos',
            blockType: Scratch.BlockType.REPORTER,
            text: '[pos] position of light [name]',
            arguments: {
              pos: {
                type: Scratch.ArgumentType.NUMBER,
                menu: 'axis'
              },
              name: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'light'
              }
            }
          }
        ],
        menus: {
          MODE_MENU: {
            acceptReporters: true,
            items: [
              'disabled',
              'flat',
              'flat triangle',
              'sprite',
              'cube',
              'sphere',
              'low-poly sphere'
            ]
          },
          turnDirection: {
            acceptReporters: false,
            items: [
              'left',
              'right',
              'up',
              'down',
              {
                text: '⟲',
                value: 'ccw'
              },
              {
                text: '⟳',
                value: 'cw'
              }
            ]
          },
          direction: {
            acceptReporters: true,
            items: [
              { value: 'y', text: 'y (yaw)' },
              { value: 'x', text: 'x (pitch)' },
              { value: 'z', text: 'z (roll)' }
            ]
          },
          cameraParam: {
            acceptReporters: true,
            items: [
              'vertical FOV',
              'minimum render distance',
              'maximum render distance'
            ]
          },
          side: {
            acceptReporters: true,
            items: ['both', 'front', 'back']
          },
          texFilter: {
            acceptReporters: true,
            items: ['nearest', 'linear', '']
          },
          fogAtt: {
            acceptReporters: true,
            items: ['near', 'far']
          },
          lightType: {
            acceptReporters: true,
            items: ['point', 'spotlight', 'hemisphere']
          },
          axis: {
            acceptReporters: true,
            items: ['x', 'y', 'z']
          }
        }
      }
    }

    viewDocs() {
      alert(`This extension also makes many other vanilla blocks (e.g most of Motion) work with 3D sprites, try them out!
Default camera position: x0, y0, z200.
Default camera parameters: vertical FOV 60, min render distance 0.5, max render distance 4800.

More things will be added here as things that need explaining are added.
If I ever decide to release this extension on the gallery, this will be replaced with an actual docs page.`)
    }

    toggleVanillaBlocks() {
      this.hideVanillaBlocks = !this.hideVanillaBlocks
      if (!Scratch.vm.runtime.extensionStorage[extId]) {
        Scratch.vm.runtime.extensionStorage[extId] = {}
      }
      Scratch.vm.runtime.extensionStorage[extId].hideVanillaBlocks =
        this.hideVanillaBlocks
      Scratch.vm.extensionManager.refreshBlocks()
    }

    vanillaBlock(xml) {
      return {
        blockType: Scratch.BlockType.XML,
        xml,
        hideFromPalette: this.hideVanillaBlocks
      }
    }

    init() {
      if (this.scene) return

      // create everything
      this.scene = new THREE.Scene()
      this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000)
      this.camera.position.set(0, 0, 200)
      this.camera.lookAt(0, 0, 0)
      this.camera.near = 0.5
      this.camera.far = 4800

      this.renderer = new THREE.WebGLRenderer()
      this.renderer.setClearAlpha(0)
      // create the scratch stuff
      this.threeSkinId = Scratch.renderer._nextSkinId++
      Scratch.renderer._allSkins[this.threeSkinId] = new SimpleSkin(
        this.threeSkinId,
        Scratch.renderer
      )
      this.threeDrawableId = Scratch.renderer.createDrawable('pen')
      Scratch.renderer._allDrawables[this.threeDrawableId].customDrawableName =
        'CST 3D Layer'
      Scratch.renderer.updateDrawableSkinId(
        this.threeDrawableId,
        this.threeSkinId
      )

      this.stageSizeEvent = (() => {
        this.updateScale()
      }).bind(this)
      Scratch.vm.on('STAGE_SIZE_CHANGED', this.stageSizeEvent)

      this.stampRenderTarget = new THREE.WebGLRenderTarget()

      this.raycaster = new THREE.Raycaster()

      this.applyPatches()
      this.updateScale()
    }

    uninit() {
      // delete everything
      for (const dr of Scratch.renderer._allDrawables) {
        if (!dr) continue
        this.disable3DForDrawable(dr.id)
        delete dr[IN_3D]
        delete dr[OBJECT]
      }
      if (this.scene) this.scene.clear()
      this.scene = undefined
      this.camera = undefined
      if (this.renderer) this.renderer.dispose()
      this.renderer = undefined
      if (this.threeSkinId)
        Scratch.renderer._allSkins[this.threeSkinId].dispose()
      this.threeSkinId = undefined
      if (this.threeDrawableId)
        Scratch.renderer._allDrawables[this.threeDrawableId].dispose()
      this.threeDrawableId = undefined
      if (this.stageSizeEvent)
        Scratch.vm.off('STAGE_SIZE_CHANGED', this.stageSizeEvent)
      this.stageSizeEvent = undefined
      if (this.stampRenderTarget) this.stampRenderTarget.dispose()
      this.stampRenderTarget = undefined

      Scratch.vm.runtime.requestRedraw()
    }

    // call when the native size of the canvas changes
    updateScale() {
      const w = Scratch.vm.runtime.stageWidth || 480
      const h = Scratch.vm.runtime.stageHeight || 360

      Scratch.renderer._allSkins[this.threeSkinId].size = [w, h]

      this.camera.aspect = w / h
      this.renderer.setSize(w, h)
      this.stampRenderTarget.setSize(w, h)
      this.camera.updateProjectionMatrix()

      this.updateRenderer()
    }

    // patches for stuff
    applyPatches() {
      const Drawable = Scratch.renderer.exports.Drawable

      Drawable.threed = this
      patch(Drawable.prototype, {
        getVisible(og) {
          if (this[IN_3D]) return false
          return og()
        },
        updateVisible(og, value) {
          if (this[IN_3D]) {
            const o = this[OBJECT]
            if (o.visible !== value) {
              o.visible = value
              Drawable.threed.updateRenderer()
            }
          }
          return og(value)
        },
        updatePosition(og, position) {
          if (this[IN_3D]) {
            const o = this[OBJECT]
            o.position.x = position[0]
            o.position.y = position[1]
            Drawable.threed.updateRenderer()
          }
          return og(position)
        },
        updateDirection(og, direction) {
          if (this[IN_3D]) {
            this._roll = THREE.MathUtils.degToRad(direction)
            Drawable.threed.updateSpriteAngle(this)
            Drawable.threed.updateRenderer()
          }
          return og(direction)
        },
        updateScale(og, scale) {
          if (this[IN_3D]) {
            const obj = this[OBJECT]
            obj.scale.x = ((obj._sizeX ?? 100) / 100) * scale[0]
            obj.scale.y = ((obj._sizeY ?? 100) / 100) * scale[1]
            obj.scale.z = ((obj._sizeZ ?? 100) / 100) * scale[0]
            Drawable.threed.updateRenderer()
          }
          return og(scale)
        },
        dispose(og) {
          if (this[OBJECT]) {
            this[OBJECT].removeFromParent()
            this[OBJECT].material.dispose()
            if (this[OBJECT].material.map) this[OBJECT].material.map.dispose()
            this[OBJECT].geometry.dispose()
            this[OBJECT] = null
            Drawable.threed.updateRenderer()
          }
          return og()
        },
        _skinWasAltered(og) {
          og()
          if (this[IN_3D]) {
            Drawable.threed.updateDrawableSkin(this)
            Drawable.threed.updateRenderer()
          }
        }
      })

      Scratch.renderer.threed = this
      patch(Scratch.renderer, {
        draw(og) {
          if (this[THREED_DIRTY]) {
            // Do a 3D redraw
            Drawable.threed.doUpdateRenderer()
            this[THREED_DIRTY] = false
          }
          return og()
        },

        isTouchingDrawables(og, drawableID, candidateIDs = this._drawList) {
          const dr = this._allDrawables[drawableID]

          if (dr[IN_3D]) {
            // 3D sprites can't collide with 2D
            const candidates = candidateIDs.filter(
              id => this._allDrawables[id][IN_3D]
            )
            for (const candidate of candidates) {
              if (
                Drawable.threed.touching3D(
                  dr[OBJECT],
                  this._allDrawables[candidate][OBJECT]
                )
              )
                return true
            }
            return false
          }

          return og(
            drawableID,
            candidateIDs.filter(id => !this._allDrawables[id][IN_3D])
          )
        },

        penStamp(og, penSkinID, stampID) {
          const dr = this._allDrawables[stampID]
          if (!dr) return
          if (dr[IN_3D]) {
            // Draw the sprite to the 3D drawable then stamp it
            const threed = Drawable.threed
            threed.renderer.render(dr[OBJECT], threed.camera)
            this._allSkins[threed.threeSkinId].setContent(
              threed.renderer.domElement
            )
            og(penSkinID, threed.threeDrawableId)
            threed.updateRenderer()
            return
          }
          return og(penSkinID, stampID)
        },

        pick(og, centerX, centerY, touchWidth, touchHeight, candidateIDs) {
          const pick2d = og(
            centerX,
            centerY,
            touchWidth,
            touchHeight,
            candidateIDs
          )
          if (pick2d !== -1) return pick2d

          const threed = Drawable.threed
          if (!threed.raycaster) return false

          const bounds = this.clientSpaceToScratchBounds(
            centerX,
            centerY,
            touchWidth,
            touchHeight
          )
          if (bounds.left === -Infinity || bounds.bottom === -Infinity) {
            return false
          }

          const candidates = (candidateIDs || this._drawList)
            .map(id => this._allDrawables[id])
            .filter(dr => dr[IN_3D])
          if (candidates.length <= 0) return -1

          const scratchCenterX =
            (bounds.left + bounds.right) / this._gl.canvas.clientWidth
          const scratchCenterY =
            (bounds.top + bounds.bottom) / this._gl.canvas.clientHeight
          threed.raycaster.setFromCamera(
            new THREE.Vector2(scratchCenterX, scratchCenterY),
            threed.camera
          )

          const object = threed.raycaster.intersectObject(threed.scene, true)[0]
            ?.object
          if (!object) return -1
          const drawable = candidates.find(
            c => c[IN_3D] && c[OBJECT] === object
          )
          if (!drawable) return -1
          return drawable._id
        },
        drawableTouching(
          og,
          drawableID,
          centerX,
          centerY,
          touchWidth,
          touchHeight
        ) {
          const drawable = this._allDrawables[drawableID]
          if (!drawable) {
            return false
          }
          if (!drawable[IN_3D]) {
            return og(drawableID, centerX, centerY, touchWidth, touchHeight)
          }

          const threed = Drawable.threed
          if (!threed.raycaster) return false

          const bounds = this.clientSpaceToScratchBounds(
            centerX,
            centerY,
            touchWidth,
            touchHeight
          )
          const scratchCenterX =
            (bounds.left + bounds.right) / this._gl.canvas.clientWidth
          const scratchCenterY =
            (bounds.top + bounds.bottom) / this._gl.canvas.clientHeight
          threed.raycaster.setFromCamera(
            new THREE.Vector2(scratchCenterX, scratchCenterY),
            threed.camera
          )

          const intersect = threed.raycaster.intersectObject(threed.scene, true)
          const object = intersect[0]?.object
          return object === drawable[OBJECT]
        },
        extractDrawableScreenSpace(og, drawableID) {
          const drawable = this._allDrawables[drawableID]
          if (!drawable)
            throw new Error(
              `Could not extract drawable with ID ${drawableID}; it does not exist`
            )
          if (!drawable[IN_3D]) return og(drawableID)

          // Draw the sprite to the 3D drawable then extract it
          const threed = Drawable.threed
          threed.renderer.render(drawable[OBJECT], threed.camera)
          this._allSkins[threed.threeSkinId].setContent(
            threed.renderer.domElement
          )
          const extracted = og(threed.threeDrawableId)
          threed.updateRenderer()
          return extracted
        }
      })
      patch(Scratch.renderer.exports.Skin, {
        dispose(og) {
          if (this._3dCachedTexture) this._3dCachedTexture.dispose()
          og()
        },
        _setTexture(og, textureData) {
          if (this._3dCachedTexture) {
            this._3dCachedTexture.dispose()
            this._3dCachedTexture = null
            const returnValue = og(textureData)
            Drawable.threed.getThreeTextureFromSkin(this)
            return returnValue
          }
          return og(textureData)
        }
      })
    }

    updateRenderer() {
      // Schedule a 3D redraw
      Scratch.renderer[THREED_DIRTY] = true
      Scratch.vm.runtime.requestRedraw()
    }

    // pushes the current 3ds render state into the drawable
    doUpdateRenderer() {
      this.init()
      this.renderer.render(this.scene, this.camera)

      if (!this.threeSkinId) return

      Scratch.renderer._allSkins[this.threeSkinId].setContent(
        this.renderer.domElement
      )
    }

    updateDrawableSkin(drawable) {
      if (drawable[OBJECT] && drawable[OBJECT].material) {
        drawable[OBJECT].material.map = this.getThreeTextureFromSkin(
          drawable.skin
        )
      }
    }

    /// GENERAL UTILS ///

    hexToNumber(hex) {
      return parseInt(hex.slice(1), 16)

      // Converts hex to a number
      // "#ffffff"
      // "ffffff"
      // "0xffffff"
      // 0xffffff
      // 16777215
    }

    /// MISC OBJECT UTILS ////

    getThreeTextureFromSkin(skin) {
      if (skin._3dCachedTexture) return skin._3dCachedTexture
      skin._3dCachedTexture = new THREE.CanvasTexture(
        this.getCanvasFromSkin(skin)
      )
      return skin._3dCachedTexture
    }

    objectShape(obj) {
      let shape = null
      if (obj.geometry) {
        if (obj.geometry instanceof THREE.SphereGeometry) {
          obj.geometry.computeBoundingSphere()
          shape = obj.geometry.boundingSphere
        } else {
          obj.geometry.computeBoundingBox()
          shape = obj.geometry.boundingBox
        }
      } else if (obj instanceof THREE.SPRITE) {
        const sx = obj.scale.x / 2
        const sy = obj.scale.y / 2

        shape = new THREE.Box3(
          new THREE.Vector3(-sx, -sy, -sx),
          new THREE.Vector3(sx, sy, -sx)
        )
      }
      return shape
    }

    objectShapeTransformed(obj) {
      const shape = this.objectShape(obj)
      if (!shape) return null
      const worldPos = obj.getWorldPosition(new THREE.Vector3())
      if (shape instanceof THREE.Box3) {
        shape.min.multiply(obj.scale)
        shape.min.add(worldPos)
        shape.max.multiply(obj.scale)
        shape.max.add(worldPos)
      } else if (shape instanceof THREE.Sphere) {
        shape.radius *= Math.max(obj.scale.x, obj.scale.y, obj.scale.z)
        shape.center.add(worldPos)
      }
      return shape
    }

    touching3D(objA, objB) {
      const shapeA = this.objectShapeTransformed(objA)
      const shapeB = this.objectShapeTransformed(objB)
      if (!shapeA || !shapeB) return false
      const nameB = shapeB instanceof THREE.Sphere ? 'Sphere' : 'Box'
      const func = shapeA['intersects' + nameB]
      if (!func) return false
      return func.call(shapeA, shapeB)
    }

    /// DRAWABLE STUFF ///

    // thanks stackoverflow
    // https://stackoverflow.com/a/18804083
    getCanvasFromTexture(gl, texture, width, height) {
      const framebuffer = gl.createFramebuffer()
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texture,
        0
      )

      const data = new Uint8Array(width * height * 4)
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data)

      gl.deleteFramebuffer(framebuffer)

      const imageData = new ImageData(width, height)
      imageData.data.set(data)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')

      context.putImageData(imageData, 0, 0)

      return canvas
    }

    getCanvasFromSkin(skin) {
      const emptyCanvas = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 1
        canvas.height = 1
        return canvas
      }

      switch (skin.constructor) {
        case Scratch.renderer.exports.BitmapSkin: {
          if (skin._textureSize[0] < 1 || skin._textureSize[1] < 1)
            return emptyCanvas()
          return this.getCanvasFromTexture(
            Scratch.renderer.gl,
            skin.getTexture(),
            skin._textureSize[0],
            skin._textureSize[1]
          )
        }
        case Scratch.renderer.exports.SVGSkin: {
          // code copy-pasted from scratch-render
          const INDEX_OFFSET = 8

          const textureScale = 200

          const scaleMax = textureScale
            ? Math.max(Math.abs(textureScale), Math.abs(textureScale))
            : 100
          const requestedScale = Math.min(scaleMax / 100, skin._maxTextureScale)
          const mipLevel = Math.max(
            Math.ceil(Math.log2(requestedScale)) + INDEX_OFFSET,
            0
          )
          const mipScale = Math.pow(2, mipLevel - INDEX_OFFSET)

          const sizeX = Math.ceil(skin._size[0] * mipScale)
          const sizeY = Math.ceil(skin._size[1] * mipScale)
          if (sizeX < 1 || sizeY < 1) return emptyCanvas()

          return this.getCanvasFromTexture(
            Scratch.renderer.gl,
            skin.getTexture([textureScale, textureScale]),
            sizeX,
            sizeY
          )
        }
        default:
          console.error('Could not get skin image data:', skin)
          throw new TypeError('Could not get skin image data')
      }
    }

    getSizeFromSkin(skin) {
      switch (skin.constructor) {
        case Scratch.renderer.exports.BitmapSkin: {
          return [skin._textureSize[0], skin._textureSize[1]]
        }
        case Scratch.renderer.exports.SVGSkin: {
          return skin._size
        }
        default:
          console.error('Could not get skin size:', skin)
          throw new TypeError('Could not get skin size')
      }
    }

    enable3DForDrawable(drawableID, type = 'flat') {
      const dr = Scratch.renderer._allDrawables[drawableID]
      if (dr[IN_3D]) return

      dr[IN_3D] = true

      let obj
      if (type === 'sprite') {
        obj = new THREE.Sprite()
      } else {
        obj = new THREE.Mesh()
      }
      dr[OBJECT] = obj
      this.updateMeshForDrawable(drawableID, type)

      if (!('_yaw' in dr)) dr._yaw = 0
      if (!('_pitch' in dr)) dr._pitch = 0
      if (!('_roll' in dr)) dr._roll = 0
      if (!(Z_POS in dr)) dr[Z_POS] = 0

      this.scene.add(obj)
      this.updateRenderer()
    }

    updateMeshForDrawable(drawableID, type) {
      const dr = Scratch.renderer._allDrawables[drawableID]
      if (!dr[IN_3D]) return
      const obj = dr[OBJECT]

      if (obj.isSprite) {
        if (obj.material) obj.material.dispose()
        obj.material = new THREE.SpriteMaterial()
        try {
          const size = this.getSizeFromSkin(dr.skin)
          obj._sizeX = size[0]
          obj._sizeY = size[1]
          obj._sizeZ = size[0]
        } catch (e) {
          console.error(e)
          obj._sizeX = 0
          obj._sizeY = 0
          obj._sizeZ = 0
        }
      } else {
        obj.material = new THREE.MeshPhongMaterial()
        switch (type) {
          case 'flat':
            obj.geometry = new THREE.PlaneGeometry(
              dr.skin.size[0],
              dr.skin.size[1]
            )
            break
          case 'flat triangle':
            {
              const geometry = new THREE.BufferGeometry()
              const w = dr.skin.size[0] / 2
              const h = dr.skin.size[1] / 2

              const vertices = new Float32Array([
                -w,
                -h,
                0.0,
                w,
                -h,
                0.0,
                -w,
                h,
                0.0
              ])
              const uvs = new Float32Array([0, 0, 1, 0, 0, 1])
              geometry.setIndex([0, 1, 2])
              geometry.setAttribute(
                'position',
                new THREE.BufferAttribute(vertices, 3)
              )
              geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
              obj.geometry = geometry
            }
            break
          case 'cube':
            obj.geometry = new THREE.BoxGeometry(
              dr.skin.size[0],
              dr.skin.size[1],
              dr.skin.size[0]
            )
            break
          case 'sphere':
            obj.geometry = new THREE.SphereGeometry(
              Math.max(dr.skin.size[0], dr.skin.size[1]) / 2,
              24,
              12
            )
            break
          case 'low-poly sphere':
            obj.geometry = new THREE.SphereGeometry(
              Math.max(dr.skin.size[0], dr.skin.size[1]) / 2,
              8,
              6
            )
            break
        }
        obj._sizeX = 1
        obj._sizeY = 1
        obj._sizeZ = 1
      }

      if (obj?.material?.map) obj?.material?.map?.dispose()
      const texture = this.getThreeTextureFromSkin(dr.skin)
      obj.material.map = texture
      obj.material.alphaTest = 0.01

      this.updateMaterialForDrawable(drawableID)

      dr.updateScale(dr.scale)
    }

    updateMaterialForDrawable(drawableID) {
      const dr = Scratch.renderer._allDrawables[drawableID]
      if (!dr[IN_3D]) return
      const obj = dr[OBJECT]

      if (!(SIDE_MODE in dr)) dr[SIDE_MODE] = THREE.DoubleSide
      if (!(TEX_FILTER in dr)) dr[TEX_FILTER] = THREE.LinearMipmapLinearFilter

      obj.material.side = dr[SIDE_MODE]

      const texture = obj.material.map
      texture.minFilter = dr[TEX_FILTER]
      texture.magFilter = dr[TEX_FILTER]
      if (texture.magFilter === THREE.LinearMipmapLinearFilter)
        texture.magFilter = THREE.LinearFilter

      obj.material.transparent = true
    }

    disable3DForDrawable(drawableID) {
      const dr = Scratch.renderer._allDrawables[drawableID]
      if (!dr[IN_3D]) return

      dr[IN_3D] = false

      dr[Z_POS] = dr[OBJECT].position.z

      dr[OBJECT].removeFromParent()
      dr[OBJECT].material.dispose()
      if (dr[OBJECT].material.map) dr[OBJECT].material.map.dispose()
      dr[OBJECT].geometry.dispose()
      dr[OBJECT] = null
      this.updateRenderer()
    }

    /// BLOCKS ///

    setMode({ MODE }, util) {
      if (util.target.isStage) return

      this.init()
      switch (MODE) {
        case 'disabled':
          this.disable3DForDrawable(util.target.drawableID)
          break
        case 'flat':
        case 'flat triangle':
        case 'sprite':
        case 'cube':
        case 'sphere':
        case 'low-poly sphere':
          this.disable3DForDrawable(util.target.drawableID)
          this.enable3DForDrawable(util.target.drawableID, MODE)
          if (util.target.renderer) {
            // Update properties
            this.refreshThreeDrawable(util.target)
          }
          break
      }
    }

    refreshThreeDrawable(target) {
      const { direction, scale } = target._getRenderedDirectionAndScale()
      const dr = target.renderer._allDrawables[target.drawableID]
      dr.updatePosition([target.x, target.y])
      dr.updateDirection(direction)
      dr.updateScale(scale)
      dr.updateVisible(target.visible)
      if (dr[OBJECT]) {
        dr[OBJECT].position.z = dr[Z_POS]
      }
      this.updateSpriteAngle({ target })
    }

    setZ({ Z }, util) {
      if (util.target.isStage) return

      const dr = Scratch.renderer._allDrawables[util.target.drawableID]
      if (!dr[IN_3D]) return

      dr[OBJECT].position.z = Scratch.Cast.toNumber(Z)
      this.updateRenderer()
    }

    changeZ({ Z }, util) {
      if (util.target.isStage) return

      const dr = Scratch.renderer._allDrawables[util.target.drawableID]
      if (!dr[IN_3D]) return

      const z = Scratch.Cast.toNumber(Z)
      dr[OBJECT].position.z += z
      this.updateRenderer()
    }

    getZ(args, util) {
      if (util.target.isStage) return 0

      const dr = Scratch.renderer._allDrawables[util.target.drawableID]
      if (!dr[OBJECT]) return 0
      return dr[OBJECT].position.z
    }

    mod(n, modulus) {
      let result = n % modulus
      // Scratch mod uses floored division instead of truncated division.
      if (result / modulus < 0) result += modulus
      return result
    }

    wrapClamp(n, min, max) {
      const offset = n - min
      const range = max - min
      return min + this.mod(offset, range)
    }

    updateSpriteAngle(util) {
      let dr
      if (util?.target) {
        if (util.target.isStage) return
        dr = Scratch.renderer._allDrawables[util.target.drawableID]
      } else {
        dr = util
      }

      if (!dr[IN_3D]) return
      const obj = dr[OBJECT]

      obj.rotation.x = 0
      obj.rotation.y = 0
      obj.rotation.z = 0

      const WRAP_MIN = THREE.MathUtils.degToRad(-180)
      const WRAP_MAX = THREE.MathUtils.degToRad(180)
      dr._yaw = this.wrapClamp(dr._yaw, WRAP_MIN, WRAP_MAX)
      dr._pitch = this.wrapClamp(dr._pitch, WRAP_MIN, WRAP_MAX)
      dr._roll = this.wrapClamp(dr._roll, WRAP_MIN, WRAP_MAX)

      obj.rotation.y = dr._yaw
      obj.rotateOnAxis(new THREE.Vector3(1, 0, 0), dr._pitch)
      obj.rotateOnAxis(
        new THREE.Vector3(0, 0, 1),
        THREE.MathUtils.degToRad(90) - dr._roll
      )
    }

    set3DPos({ X, Y, Z }, util) {
      if (util.target.isStage) return

      X = Scratch.Cast.toNumber(X)
      Y = Scratch.Cast.toNumber(Y)
      util.target.setXY(X, Y)
      this.setZ({ Z }, util)
    }

    change3DPos({ X, Y, Z }, util) {
      if (util.target.isStage) return
      const dx = Scratch.Cast.toNumber(X)
      const dy = Scratch.Cast.toNumber(Y)
      util.target.setXY(util.target.x + dx, util.target.y + dy)

      this.changeZ({ Z }, util)
    }

    moveSteps({ STEPS }, util) {
      if (util.target.isStage) return
      const dr = Scratch.renderer._allDrawables[util.target.drawableID]
      if (!dr[IN_3D]) return

      const add = new THREE.Vector3(0, 0, 1)
        .applyQuaternion(dr[OBJECT].quaternion)
        .multiplyScalar(-Scratch.Cast.toNumber(STEPS))

      util.target.setXY(util.target.x + add.x, util.target.y + add.y)
      this.changeZ({ Z: add.z }, util)

      this.updateRenderer()
    }

    rotate3D({ DIRECTION, DEGREES }, util) {
      if (util.target.isStage) return
      const dr = Scratch.renderer._allDrawables[util.target.drawableID]

      if (!dr[IN_3D]) return

      if (!isFinite(DEGREES)) return

      DEGREES =
        Scratch.Cast.toNumber(DEGREES) *
        (DIRECTION === 'left' || DIRECTION === 'down' || DIRECTION === 'ccw'
          ? -1
          : 1)

      switch (DIRECTION) {
        case 'left':
        case 'right':
          dr._yaw -= THREE.MathUtils.degToRad(DEGREES)
          break
        case 'up':
        case 'down':
          dr._pitch += THREE.MathUtils.degToRad(DEGREES)
          break
        case 'cw':
        case 'ccw':
          util.target.setDirection(util.target.direction + DEGREES)
          break
      }
      this.updateSpriteAngle(util)
      this.updateRenderer()
    }

    set3DDir({ DIRECTION, DEGREES }, util) {
      if (util.target.isStage) return
      const dr = Scratch.renderer._allDrawables[util.target.drawableID]

      if (!dr[IN_3D]) return

      DEGREES = Scratch.Cast.toNumber(DEGREES)

      if (!isFinite(DEGREES)) return

      switch (DIRECTION) {
        case 'y':
        case 'angle': // Old versions of the extension used angle/aim/roll instead of rotation around Y/X/Z
          dr._yaw = -THREE.MathUtils.degToRad(DEGREES)
          break
        case 'x':
        case 'aim':
          dr._pitch = THREE.MathUtils.degToRad(DEGREES)
          break
        case 'z':
        case 'roll':
          util.target.setDirection(DEGREES + 90)
          break
      }
      this.updateSpriteAngle(util)
      this.updateRenderer()
    }

    direction3D({ DIRECTION }, util) {
      if (util.target.isStage) return 0
      const dr = Scratch.renderer._allDrawables[util.target.drawableID]
      if (!dr[IN_3D]) return 0

      switch (DIRECTION) {
        case 'y':
        case 'angle':
          return -THREE.MathUtils.radToDeg(dr._yaw)
        case 'x':
        case 'aim':
          return THREE.MathUtils.radToDeg(dr._pitch)
        case 'z':
        case 'roll':
          return THREE.MathUtils.radToDeg(dr._roll) - 90
        default:
          return 0
      }
    }

    setSideMode({ SIDE }, util) {
      if (util.target.isStage) return
      const dr = Scratch.renderer._allDrawables[util.target.drawableID]

      this.init()

      const sides = Object.assign(Object.create(null), {
        front: THREE.FrontSide,
        back: THREE.BackSide,
        both: THREE.DoubleSide
      })
      if (!(SIDE in sides)) return
      dr[SIDE_MODE] = sides[SIDE]
      if (dr[OBJECT] && dr[OBJECT].material) {
        dr[OBJECT].material.side = sides[SIDE]
        this.updateRenderer()
      }
    }

    setTexFilter({ FILTER }, util) {
      if (util.target.isStage) return
      const dr = Scratch.renderer._allDrawables[util.target.drawableID]

      this.init()

      const filters = Object.assign(Object.create(null), {
        nearest: THREE.NearestFilter,
        linear: THREE.LinearMipmapLinearFilter
      })
      if (!(FILTER in filters)) return
      dr[TEX_FILTER] = filters[FILTER]
      if (dr[OBJECT] && dr[OBJECT].material?.map) {
        // i think for some reason you need to create a new texture
        const cloned = dr[OBJECT].material.map.clone()
        dr[OBJECT].material.map.dispose()
        dr[OBJECT].material.map = cloned
        cloned.needsUpdate = true
        this.updateMaterialForDrawable(util.target.drawableID)
        this.updateRenderer()
      }
    }

    preUpdateCameraAngle() {
      if (!('_yaw' in this.camera)) this.camera._yaw = 0
      if (!('_pitch' in this.camera)) this.camera._pitch = 0
      if (!('_roll' in this.camera)) this.camera._roll = 0
    }

    updateCameraAngle() {
      this.camera.rotation.x = 0
      this.camera.rotation.y = 0
      this.camera.rotation.z = 0

      const WRAP_MIN = THREE.MathUtils.degToRad(-180)
      const WRAP_MAX = THREE.MathUtils.degToRad(180)
      this.camera._yaw = this.wrapClamp(this.camera._yaw, WRAP_MIN, WRAP_MAX)
      this.camera._pitch = this.wrapClamp(
        this.camera._pitch,
        WRAP_MIN,
        WRAP_MAX
      )
      this.camera._roll = this.wrapClamp(this.camera._roll, WRAP_MIN, WRAP_MAX)

      this.camera.rotation.y = this.camera._yaw
      this.camera.rotateOnAxis(new THREE.Vector3(1, 0, 0), this.camera._pitch)
      this.camera.rotateOnAxis(new THREE.Vector3(0, 0, 1), this.camera._roll)
    }

    setCam({ X, Y, Z }) {
      this.init()

      const x = Scratch.Cast.toNumber(X)
      const y = Scratch.Cast.toNumber(Y)
      const z = Scratch.Cast.toNumber(Z)
      this.camera.position.set(x, y, z)
      this.updateRenderer()
    }
    changeCam({ X, Y, Z }) {
      this.init()

      const x = Scratch.Cast.toNumber(X)
      const y = Scratch.Cast.toNumber(Y)
      const z = Scratch.Cast.toNumber(Z)
      const pos = this.camera.position
      pos.set(pos.x + x, pos.y + y, pos.z + z)
      this.updateRenderer()
    }
    camX() {
      this.init()
      return this.camera.position.x
    }
    camY() {
      this.init()
      return this.camera.position.y
    }
    camZ() {
      this.init()
      return this.camera.position.z
    }

    moveCamSteps({ STEPS }) {
      this.init()

      this.camera.position.add(
        new THREE.Vector3(0, 0, 1)
          .applyQuaternion(this.camera.quaternion)
          .multiplyScalar(-Scratch.Cast.toNumber(STEPS))
      )
      this.updateRenderer()
    }

    rotateCam({ DIRECTION, DEGREES }) {
      this.init()

      DEGREES =
        Scratch.Cast.toNumber(DEGREES) *
        (DIRECTION === 'left' || DIRECTION === 'down' || DIRECTION === 'ccw'
          ? -1
          : 1)

      this.preUpdateCameraAngle()
      switch (DIRECTION) {
        case 'left':
        case 'right':
          this.camera._yaw -= THREE.MathUtils.degToRad(DEGREES)
          break
        case 'up':
        case 'down':
          this.camera._pitch += THREE.MathUtils.degToRad(DEGREES)
          break
        case 'cw':
        case 'ccw':
          this.camera._roll += THREE.MathUtils.degToRad(DEGREES)
          break
      }
      this.updateCameraAngle()
      this.updateRenderer()
    }
    setCamDir({ DEGREES, DIRECTION }) {
      this.init()

      DEGREES = Scratch.Cast.toNumber(DEGREES)

      this.preUpdateCameraAngle()
      switch (DIRECTION) {
        case 'y':
        case 'angle':
          this.camera._yaw = -THREE.MathUtils.degToRad(DEGREES)
          break
        case 'x':
        case 'aim':
          this.camera._pitch = THREE.MathUtils.degToRad(DEGREES)
          break
        case 'z':
        case 'roll':
          this.camera._roll = THREE.MathUtils.degToRad(DEGREES)
          break
      }
      this.updateCameraAngle()

      this.updateRenderer()
    }
    camDir({ DIRECTION }) {
      this.init()

      this.preUpdateCameraAngle()
      switch (DIRECTION) {
        case 'y':
        case 'angle':
          return -THREE.MathUtils.radToDeg(this.camera._yaw)
        case 'x':
        case 'aim':
          return THREE.MathUtils.radToDeg(this.camera._pitch)
        case 'z':
        case 'roll':
          return THREE.MathUtils.radToDeg(this.camera._roll)
        default:
          return 0
      }
    }

    setCameraParam({ PARAM, VALUE }) {
      this.init()

      PARAM = Scratch.Cast.toString(PARAM)
      switch (PARAM) {
        case 'minimum render distance':
          VALUE = Math.max(Scratch.Cast.toNumber(VALUE), 0.1)
          this.camera.near = VALUE
          break
        case 'maximum render distance':
          VALUE = Math.min(Scratch.Cast.toNumber(VALUE), 4800000)
          this.camera.far = VALUE
          break
        case 'vertical FOV':
          VALUE = Math.min(Math.max(Scratch.Cast.toNumber(VALUE), 0.001), 36000)
          this.camera.fov = VALUE
          break
        default:
          return
      }

      this.camera.updateProjectionMatrix()
      this.updateRenderer()
    }

    getCameraParam({ PARAM }) {
      this.init()

      PARAM = Scratch.Cast.toString(PARAM)
      switch (PARAM) {
        case 'minimum render distance':
          return this.camera.near
        case 'maximum render distance':
          return this.camera.far
        case 'vertical FOV':
          return this.camera.fov
      }
      return ''
    }

    setFog({ n, f, color }) {
      this.scene.fog = new THREE.Fog(this.hexToNumber(color), n, f)
      this.updateRenderer()
    }
    setFogAtt({ att, v }) {
      switch (att) {
        case 'near':
          this.scene.fog.near = v
          break
        case 'far':
          this.scene.fog.far = v
          break
      }
      this.updateRenderer()
    }
    clearFog() {
      this.scene.fog = null
      this.updateRenderer()
    }
    newLight({ name, typ, color }) {
      if (LIGHTS[name]) {
        this.deleteLight({ name })
      }

      let l = null
      let col = this.hexToNumber(color)
      switch (typ) {
        case 'point':
          l = new THREE.PointLight(col, 1, 0)
          l.position.set(0, 0, 0)
          break
        case 'spotlight':
          l = new THREE.SpotLight(col)
          l.position.set(0, 0, 0)
          break
        case 'hemisphere':
          l = new THREE.HemisphereLight(col, col, 1)
          l.position.set(0, 300, 0)
          break
      }

      if (l) {
        l.intensity = 1
        LIGHTS[name] = l
        this.scene.add(l)
        this.updateRenderer()
      }
    }
    setLightIntensity({ name, v }) {
      LIGHTS[name].intensity = v
    }
    setLightDistance({ name, v }) {
      LIGHTS[name].distance = v
    }
    setLightPos({ name, x, y, z }) {
      LIGHTS[name].position.set(x, y, z)
      this.updateRenderer()
    }
    changeLightPos({ name, x, y, z }) {
      let l = LIGHTS[name]
      l.position.set(
        l.position['x'] + x,
        l.position['y'] + y,
        l.position['z'] + z
      )
      this.updateRenderer()
    }
    setLightDir({ name, DIRECTION, DEGREES }) {
      const light = LIGHTS[name]

      // Ensure the light is a SpotLight to adjust its direction
      if (light instanceof THREE.SpotLight) {
        // Convert degrees to radians for three.js

        // Adjust the target position based on the specified direction
        switch (DIRECTION) {
          case 'y':
          case 'angle':
            light.target.position.set(
              light.target.position.x,
              -DEGREES,
              DEGREES
            )
            break
          case 'x':
          case 'aim':
            light.target.position.set(
              -DEGREES,
              light.target.position.y,
              DEGREES
            )
            break
          case 'z':
          case 'roll':
            light.target.position.set(
              -DEGREES,
              DEGREES,
              light.target.position.z
            )
            break
          default:
            console.warn(
              `Direction '${DIRECTION}' is not valid. Use 'x', 'y', or 'z'.`
            )
            return
        }
        // Update the spotlight's target matrix
        light.target.updateMatrixWorld()
      }
    }
    changeLightDir({ name, DIRECTION, DEGREES }) {
      const light = LIGHTS[name]

      // Ensure the light is a SpotLight to adjust its direction
      if (light instanceof THREE.SpotLight) {
        // Convert degrees to radians for three.js

        // Adjust the target position based on the specified direction
        switch (DIRECTION) {
          case 'y':
          case 'angle':
            light.target.position.set(
              light.target.position.x,
              -DEGREES,
              DEGREES
            )
            break
          case 'x':
          case 'aim':
            light.target.position.set(
              -DEGREES,
              light.target.position.y,
              DEGREES
            )
            break
          case 'z':
          case 'roll':
            light.target.position.set(
              -DEGREES,
              DEGREES,
              light.target.position.z
            )
            break
          default:
            console.warn(
              `Direction '${DIRECTION}' is not valid. Use 'x', 'y', or 'z'.`
            )
            return
        }
        // Update the spotlight's target matrix
        light.target.updateMatrixWorld()
      }
    }
    // remove eslint disable later
    setLightRst({ name, raster }) {
      // eslint-disable-line @typescript-eslint/no-unused-vars
    }
    deleteLight({ name }) {
      this.scene.remove(LIGHTS[name])
      delete LIGHTS[name]
      this.updateRenderer()
    }
    deleteLights() {
      console.log(LIGHTS)
      for (let name in LIGHTS) {
        this.scene.remove(LIGHTS[name])
        delete LIGHTS[name]
      }
      this.updateRenderer()
    }
    getLightPos({ pos, name }) {
      let l = LIGHTS[name]
      if (!l) return

      switch (pos) {
        case 'x': {
          return l.position['x']
        }
        case 'y': {
          return l.position['y']
        }
        case 'z': {
          return l.position['z']
        }
      }
    }
  }

  Scratch.extensions.register(new ThreeD(Scratch.runtime))
})(Scratch) // eslint-disable-line no-undef
