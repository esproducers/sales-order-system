import XLSX from 'xlsx';
import fs from 'fs';

const workbook = XLSX.readFile('C:\\Users\\User\\Downloads\\item.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

const output = [];
output.push('Header Row (Row 0):');
output.push(JSON.stringify(data[0]));
output.push('\nFirst Data Row (Row 1):');
data[1].forEach((val, i) => {
    output.push(`  Col ${i}: ${JSON.stringify(val)} (${typeof val})`);
});
output.push('\nSecond Data Row (Row 2):');
data[2].forEach((val, i) => {
    output.push(`  Col ${i}: ${JSON.stringify(val)} (${typeof val})`);
});

fs.writeFileSync('tmp_row_detail_v2.txt', output.join('\n'));
console.log('Results written to tmp_row_detail_v2.txt');
