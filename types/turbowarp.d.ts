/// <reference path="../node_modules/@turbowarp/types/index.d.ts" />
/// <reference path="../node_modules/@turbowarp/types/types/scratch-vm-extension.d.ts" />

declare namespace Scratch {
  const runtime: VM.Runtime
}

interface ArgumentType {
  MENU: "string"
}
