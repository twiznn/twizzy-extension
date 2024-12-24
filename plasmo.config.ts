// plasmo.config.ts
export default {
  contentScript: {
    matches: ["https://neo.bullx.io/*"],
    runAt: "document_start",
  },
  web_accessible_resources: ['assets/injectedScript.js']
  
};
