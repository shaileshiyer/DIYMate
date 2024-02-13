import { DIYMateApp } from "./diymate-app";
import { diymateCore } from "@core/diymate_core";

import { makeServiceProvider } from "./service_provider";
import { ModelService } from "@core/services/model_service";
import { OpenAIModel } from "@models/openai";
import { OpenAIDialogModel } from "@models/openai/dialog";

diymateCore.initialize(makeServiceProvider);

const modelService = diymateCore.getService(ModelService);

modelService.useModel(OpenAIModel);
modelService.useDialogModel(OpenAIDialogModel);

window.addEventListener('load', () => {
    const appComponent = new DIYMateApp();
    document.body.appendChild(appComponent);
  });
  