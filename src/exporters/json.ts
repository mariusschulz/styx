export { exportAsJson };

import { exportAsObject } from "./object";
import { FlowProgram } from "../flow";

const REPLACER: any = null;
const INDENTATION_STRING = "  ";

function exportAsJson(
  flowProgram: FlowProgram,
  { pretty = true }: { pretty?: boolean } = { pretty: true }
): string {
  let exportedObject = exportAsObject(flowProgram);

  return pretty
    ? JSON.stringify(exportedObject, REPLACER, INDENTATION_STRING)
    : JSON.stringify(exportedObject);
}
