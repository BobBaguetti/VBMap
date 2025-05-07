// @file: src/index.js
// Application entrypoint

import "./appInit.js";          // map & Firebase setup
import { handleAuth } from "./authHandler.js";

handleAuth();                   // starts auth flow & UI bootstrap
