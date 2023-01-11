declare global {
    namespace NodeJS {
      interface ProcessEnv {
        WS_URL: string
      }
    }
  }

 export {}