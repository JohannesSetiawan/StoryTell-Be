import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Parse CSV file and extract table name, columns, and values
 */
function parseCsvFile(csvContent: string, fileName: string): { table: string; columns: string[]; values: string[][] } | null {
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    return null;
  }
  
  // Extract table name from filename (e.g., "Chapter_rows.csv" -> "Chapter")
  const tableName = fileName.replace('_rows.csv', '');
  
  // Parse header (first line)
  const headers = lines[0].split(',').map(col => col.trim().replace(/"/g, ''));
  
  // Parse data rows
  const dataRows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = [];
    let currentValue = '';
    let inQuote = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        if (inQuote && j + 1 < line.length && line[j + 1] === '"') {
          // Escaped quote
          currentValue += '"';
          j++;
        } else {
          // Toggle quote mode
          inQuote = !inQuote;
        }
      } else if (char === ',' && !inQuote) {
        // End of value
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Add last value
    values.push(currentValue);
    
    // Clean up values - remove surrounding quotes if present
    const cleanedValues = values.map(v => {
      v = v.trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        return v.substring(1, v.length - 1);
      }
      return v;
    });
    
    dataRows.push(cleanedValues);
  }
  
  return {
    table: tableName,
    columns: headers,
    values: dataRows,
  };
}

/**
 * Parse SQL INSERT statement and extract individual row values
 */
function parseInsertStatement(sqlContent: string): Array<{ table: string; columns: string[]; values: string[][] }> {
  const results = [];
  
  // Match INSERT statements with table name, columns, and values
  const insertRegex = /INSERT\s+INTO\s+"?(\w+)"?\.?"?(\w+)"?\s*\(([^)]+)\)\s*VALUES\s*(.+?);/gis;
  
  let match;
  while ((match = insertRegex.exec(sqlContent)) !== null) {
    const tableName = match[2]; // Get table name (second capture group)
    const columnsStr = match[3];
    const valuesStr = match[4];
    
    // Parse column names
    const columns = columnsStr
      .split(',')
      .map(col => col.trim().replace(/"/g, ''));
    
    // Parse value rows - split by '), (' pattern
    const valueRows = valuesStr
      .trim()
      .split(/\),\s*\(/g)
      .map(row => {
        // Clean up the row
        let cleanRow = row.trim();
        if (cleanRow.startsWith('(')) cleanRow = cleanRow.substring(1);
        if (cleanRow.endsWith(')')) cleanRow = cleanRow.substring(0, cleanRow.length - 1);
        
        // Split values carefully, respecting quoted strings
        const values = [];
        let currentValue = '';
        let inQuote = false;
        let quoteChar = '';
        
        for (let i = 0; i < cleanRow.length; i++) {
          const char = cleanRow[i];
          const prevChar = i > 0 ? cleanRow[i - 1] : '';
          
          if ((char === "'" || char === '"') && prevChar !== '\\') {
            if (!inQuote) {
              inQuote = true;
              quoteChar = char;
            } else if (char === quoteChar) {
              // Check if it's an escaped quote (doubled quote)
              if (i + 1 < cleanRow.length && cleanRow[i + 1] === quoteChar) {
                currentValue += char;
                i++; // Skip next quote
              } else {
                inQuote = false;
              }
            }
            currentValue += char;
          } else if (char === ',' && !inQuote) {
            values.push(currentValue.trim());
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        
        // Add last value
        if (currentValue.trim()) {
          values.push(currentValue.trim());
        }
        
        return values;
      });
    
    results.push({
      table: tableName,
      columns,
      values: valueRows,
    });
  }
  
  return results;
}

/**
 * Convert SQL/CSV value to proper format for parameterized query
 */
function convertSqlValue(value: string): any {
  value = value.trim();
  
  // NULL or empty
  if (value.toLowerCase() === 'null' || value === '') {
    return null;
  }
  
  // Boolean
  if (value === "'true'" || value === "'false'" || value === 'true' || value === 'false') {
    return value.replace(/'/g, '') === 'true';
  }
  
  // Remove quotes from strings
  if ((value.startsWith("'") && value.endsWith("'")) || 
      (value.startsWith('"') && value.endsWith('"'))) {
    return value.substring(1, value.length - 1).replace(/''/g, "'");
  }
  
  return value;
}

/**
 * Insert data from parsed SQL with error handling
 */
async function insertDataFromSql(client: any, tableName: string, columns: string[], values: string[][]) {
  let successCount = 0;
  let skipCount = 0;
  
  console.log(`\n📦 Seeding table: ${tableName} (${values.length} rows)`);
  
  for (let i = 0; i < values.length; i++) {
    try {
      const row = values[i];
      const convertedValues = row.map(convertSqlValue);
      
      // Create parameterized query
      const placeholders = convertedValues.map((_, idx) => `$${idx + 1}`).join(', ');
      const columnNames = columns.map(col => `"${col}"`).join(', ');
      const query = `INSERT INTO "${tableName}" (${columnNames}) VALUES (${placeholders})`;
      
      await client.query(query, convertedValues);
      successCount++;
    } catch (error) {
      skipCount++;
      // Silently skip errors (duplicates, constraint violations, etc.)
      if (process.env.SEED_VERBOSE === 'true') {
        console.log(`   ⚠️  Skipped row ${i + 1}: ${error.message}`);
      }
    }
  }
  
  console.log(`   ✅ Inserted: ${successCount} | ⏭️  Skipped: ${skipCount}`);
}

/**
 * Process SQL file and insert data
 */
async function processSqlFile(client: any, filePath: string) {
  const fileName = path.basename(filePath);
  console.log(`\n📄 Processing: ${fileName}`);
  
  const sqlContent = fs.readFileSync(filePath, 'utf-8');
  const parsedData = parseInsertStatement(sqlContent);
  
  if (parsedData.length === 0) {
    console.log('   ⚠️  No INSERT statements found');
    return;
  }
  
  for (const data of parsedData) {
    await insertDataFromSql(client, data.table, data.columns, data.values);
  }
}

/**
 * Process CSV file and insert data
 */
async function processCsvFile(client: any, filePath: string) {
  const fileName = path.basename(filePath);
  console.log(`\n📄 Processing: ${fileName}`);
  
  const csvContent = fs.readFileSync(filePath, 'utf-8');
  const parsedData = parseCsvFile(csvContent, fileName);
  
  if (!parsedData) {
    console.log('   ⚠️  Invalid CSV format');
    return;
  }
  
  await insertDataFromSql(client, parsedData.table, parsedData.columns, parsedData.values);
}

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Starting database seeding...\n');
    console.log('='.repeat(50));

    // 1. Seed initial admin user
    console.log('\n👤 Seeding initial admin user...');
    const adminUsername = 'admin';
    const adminPassword = 'adminpassword';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    const query = `
      INSERT INTO "User" (username, password, "isAdmin")
      VALUES ($1, $2, $3)
      ON CONFLICT (username) DO NOTHING;
    `;
    await client.query(query, [adminUsername, hashedPassword, true]);
    console.log(`   ✅ Admin user created`);
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Password: ${adminPassword}`);

    // 2. Process SQL and CSV files in correct order (respecting foreign key constraints)
    const rootDir = path.join(__dirname, '..');
    const seedFiles = [
      { name: 'User_rows.sql', type: 'sql' },
      { name: 'Story_rows.sql', type: 'sql' },
      { name: 'Chapter_rows.sql', type: 'sql' },
      { name: 'Chapter_rows.csv', type: 'csv' },
      { name: 'StoryComment_rows.sql', type: 'sql' },
      { name: 'ReadHistory_rows.sql', type: 'sql' },
    ];

    console.log('\n='.repeat(50));
    console.log('📚 Processing seed files...');

    for (const seedFile of seedFiles) {
      const filePath = path.join(rootDir, seedFile.name);
      
      if (fs.existsSync(filePath)) {
        if (seedFile.type === 'sql') {
          await processSqlFile(client, filePath);
        } else if (seedFile.type === 'csv') {
          await processCsvFile(client, filePath);
        }
      } else {
        console.log(`\n⚠️  File not found: ${seedFile.name}`);
      }
    }

    console.log('\n='.repeat(50));
    console.log('\n✅ Database seeding completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
