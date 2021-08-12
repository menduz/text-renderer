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
  console.log("Listening")
})

type Message = {
  type: string
  // JSON
  payload: string
}

wss.on("connection", (socket) => {
  console.log("> new connection")

  socket.on("message", (message) => {
    const msg: Message = JSON.parse(Buffer.from(message as any).toString())
    console.log(msg.type)
  })
})
