import XLSX from 'xlsx';
import fs from 'fs';

const workbook = XLSX.readFile('C:\\Users\\User\\Downloads\\item.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

const output = [];
const firstRow = data[1];
if (firstRow) {
    output.push('Detailed view of Row 1:');
    firstRow.forEach((val, i) => {
        output.push(`  Col ${i}: ${JSON.stringify(val)} (${typeof val})`);
    });
}

fs.writeFileSync('tmp_row_detail.txt', output.join('\n'));
console.log('Results written to tmp_row_detail.txt');
