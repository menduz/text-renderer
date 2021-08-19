import { Server } from "ws"

// after starting a session in DCL, append &ws=ws://0.0.0.0:7666 to the query parameters

// https://play.decentraland.org/?ws=ws%3A%2F%2F127.0.0.1%3A7666

const wss = new Server({
  port: 7666,
  perMessageDeflate: {
    zlibDeflateOptions: {
      // See zlib defaults.
      chunkSize: 1024,
      memLevel: 7,
      level: 3,
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024,
    },
    // Other options settable:
    clientNoContextTakeover: true, // Defaults to negotiated value.
    serverNoContextTakeover: true, // Defaults to negotiated value.
    serverMaxWindowBits: 10, // Defaults to negotiated value.
    // Below options specified as default values.
    concurrencyLimit: 10, // Limits zlib concurrency for perf.
    threshold: 1024, // Size (in bytes) below which messages
    // should not be compressed.
  },
})

wss.on("listening", () => {
  console.log(
    "Listening\n",
    "  for full DCL navigate to https://play.decentraland.zone/?DEBUG_MESSAGES&FORCE_SEND_MESSAGE&DEBUG_REDUX&TRACE_RENDERER=350&position=0%2C0&realm=fenrir-amber&ws=ws%3A%2F%2F127.0.0.1%3A7666\n",
    "  for preview navigate to http://127.0.0.1:8000/?DEBUG_MESSAGES&FORCE_SEND_MESSAGE&DEBUG_REDUX&TRACE_RENDERER=350&position=0%2C0&realm=fenrir-amber&ws=ws%3A%2F%2F127.0.0.1%3A7666\n"
  )
})

type Message = {
  type: string
  // JSON
  payload: string
}

wss.on("connection", (socket) => {
  console.log("new connection")
  function send(type: string, payload: any) {
    const msg = {
      type,
      payload: JSON.stringify(payload),
    }
    console.log(">>> send", msg)
    socket.send(JSON.stringify(msg))
  }

  send("SystemInfoReport", {
    graphicsDeviceName: "Mocked",
    graphicsDeviceVersion: "Mocked",
    graphicsMemorySize: 512,
    processorType: "n/a",
    processorCount: 1,
    systemMemorySize: 256,
  })
  send("AllScenesEvent", { eventType: "cameraModeChanged", payload: { cameraMode: 0 } })
  send("SetBaseResolution", { baseResolution: 1080 })
  send("ApplySettings", { voiceChatVolume: 1.0, voiceChatAllowCategory: 0 })
  socket.on("message", (message) => {
    const msg: Message = JSON.parse(Buffer.from(message as any).toString())
    console.log("<<< recv", msg.type)

    switch (msg.type) {
      case "LoadParcelScenes":
      case "CreateGlobalScene": {
        // Fool the kernel telling it we have a scene ready to be used
        const payload = JSON.parse(msg.payload)
        console.log("  Creating local scene", payload.id)
        send("ControlEvent", { eventType: "SceneReady", payload: { sceneId: payload.id } })
        break
      }
      case "ActivateRendering": {
        send("ControlEvent", { eventType: "ActivateRenderingACK" })
        break
      }
      case "SendSceneMessage": {
        // these are the entity messages from the scenes:
        msg.payload.split(/\n/g).forEach((base64Message) => {
          console.dir(base64Message)
        })
        break
      }
      default:
      // console.log("receive", msg)
    }
  })
})
