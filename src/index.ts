import { DIYMateApp } from "./diymate-app";
import { diymateCore } from "@core/diymate_core";

import { makeServiceProvider } from "./service_provider";

diymateCore.initialize(makeServiceProvider);

window.addEventListener('load', () => {
    const appComponent = new DIYMateApp();
    document.body.appendChild(appComponent);
  });
  