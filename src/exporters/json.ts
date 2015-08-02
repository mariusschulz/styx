export { exportAsJson };

import { exportAsObject } from "./object";
import { FlowProgram } from "../flow";

const REPLACER: any = null;
const INDENTATION_STRING = "  ";

function exportAsJson(flowProgram: FlowProgram) {
    let exportedObject = exportAsObject(flowProgram);

    return JSON.stringify(exportedObject, REPLACER, INDENTATION_STRING);
}
