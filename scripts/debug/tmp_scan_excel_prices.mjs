import XLSX from 'xlsx';
import fs from 'fs';

const workbook = XLSX.readFile('C:\\Users\\User\\Downloads\\item.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

const output = [];
for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const price = row[2];
    if (price !== null && price !== undefined && price !== '') {
        output.push(`Row ${i} has price: ${price} (type: ${typeof price})`);
    }
}

if (output.length === 0) {
    output.push('NO PRICES FOUND IN COLUMN 2 FOR ANY ROW');
    output.push('Sample row 1 columns 0-10: ' + JSON.stringify(data[1].slice(0, 10)));
}

fs.writeFileSync('tmp_excel_prices.txt', output.join('\n'));
console.log('Results written to tmp_excel_prices.txt');
