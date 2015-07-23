import { exportDot } from "./exporters/dot";
import { exportJson } from "./exporters/json";

import { FlowProgram } from "./flow";

export function exportProgram(program: FlowProgram, format: string): string {
    if (!format) {
        throw Error('Please specify a format ("json" or "dot")');
    }

    switch (format.trim().toLowerCase()) {
        case "dot":
            return exportDot(program);

        case "json":
            return exportJson(program);

        default:
            throw Error(`The format "${format}" is not supported`);
    }
}
