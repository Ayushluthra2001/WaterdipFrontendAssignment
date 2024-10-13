declare module 'xlsx' {
    export function read(data: any, options?: any): any;
    export function readFile(filename: string, options?: any): any;
    export function writeFile(workbook: any, filename: string, options?: any): void;

    export const utils: {
        sheet_to_json(sheet: any, options?: any): any;
        json_to_sheet(json: any, options?: any): any;
    };

    export const version: string;
}
