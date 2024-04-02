import { DIYMateApp } from "./diymate-app";
import { diymateCore } from "@core/diymate_core";

import { makeServiceProvider } from "./service_provider";
import { ModelService } from "@core/services/model_service";
import { OpenAIModel } from "@models/openai";
import { OpenAIDialogModel } from "@models/openai/dialog";
import { OperationsService } from "@core/services/operations_service";
import * as Operations from '@core/operations';

diymateCore.initialize(makeServiceProvider);


const operationService = diymateCore.getService(OperationsService);
operationService.registerOperations(
  Operations.ContinueOperation,
  Operations.NextSentenceOperation,
  Operations.ElaborationOperation,
  Operations.FreeFormOperation,
  Operations.ReplaceOperation,
  Operations.RewriteSelectionOperation,
  Operations.RewriteSentenceOperation,
  Operations.GenerateIntroductionOperation,
  Operations.GenerateConclusionOperation,
  Operations.ReviewDIYOperation,
  Operations.ReviewDIYSelectionOperation,
)


const modelService = diymateCore.getService(ModelService);

modelService.useModel(OpenAIModel);
modelService.useDialogModel(OpenAIDialogModel);

window.addEventListener('load', () => {
    const appComponent = new DIYMateApp();
    document.body.appendChild(appComponent);
  });
  