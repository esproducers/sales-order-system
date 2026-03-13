import XLSX from 'xlsx';
import fs from 'fs';

const workbook = XLSX.readFile('C:\\Users\\User\\Downloads\\item.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

const output = [];
output.push(`Sheet Name: ${sheetName}`);
output.push(`Number of rows: ${data.length}`);

const rowsWithPrice = data.filter(row => row[2] !== null && row[2] !== undefined && typeof row[2] === 'number');
output.push(`Rows with price: ${rowsWithPrice.length}`);

if (rowsWithPrice.length > 0) {
    output.push('First row with price:');
    output.push(JSON.stringify(rowsWithPrice[0]));
} else {
    output.push('No rows have a numeric price in column 2');
    output.push('Sample row 1: ' + JSON.stringify(data[1]));
}

fs.writeFileSync('tmp_excel_info.txt', output.join('\n'));
console.log('Results written to tmp_excel_info.txt');
