// Direct Supabase Migration Runner
// Connects to Supabase and executes migration SQL

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://kdqkquhyumqoolvhfzwq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkcWtxdWh5dW1xb29sdmhmendhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0NzU5MTEsImV4cCI6MjA0ODA1MTkxMX0.8j5cYWdGGIV4N_Lx3fYOlEOvKwO8QcVs5UW6eDdgr-E';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🍄 GeoForge - Running Supabase Migration\n');
console.log('═══════════════════════════════════════\n');

async function runMigration() {
  try {
    // Read migration file
    console.log('📋 Reading migration file...');
    const migration = readFileSync('./migrations/001_geological_core_schema.sql', 'utf8');
    console.log(`   Lines: ${migration.split('\n').length}`);
    console.log('');
    
    // Test connection first
    console.log('🔌 Testing connection...');
    const { error: connError } = await supabase.from('exploration_projects').select('count').limit(1);
    
    if (connError && !connError.message.includes('does not exist')) {
      console.log('❌ Connection error:', connError.message);
      return;
    }
    
    console.log('✅ Connected to Supabase');
    console.log('');
    
    // Execute migration using RPC
    console.log('🚀 Executing migration...');
    console.log('   (This may take 5-10 seconds)');
    console.log('');
    
    // Split into individual statements and execute
    const statements = migration
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`   Found ${statements.length} SQL statements`);
    console.log('');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip comments and empty lines
      if (statement.trim().startsWith('--') || statement.trim() === ';') {
        continue;
      }
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Check if it's a "already exists" error (which is OK)
          if (error.message.includes('already exists')) {
            process.stdout.write('.');
            successCount++;
          } else {
            console.log(`\n   ⚠️  Statement ${i + 1}: ${error.message.substring(0, 50)}...`);
            errorCount++;
          }
        } else {
          process.stdout.write('✓');
          successCount++;
        }
        
        if ((i + 1) % 50 === 0) {
          console.log(`  [${i + 1}/${statements.length}]`);
        }
      } catch (err) {
        console.log(`\n   ❌ Statement ${i + 1} failed:`, err.message);
        errorCount++;
      }
    }
    
    console.log('\n');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Success: ${successCount} statements`);
    if (errorCount > 0) {
      console.log(`⚠️  Errors: ${errorCount} statements`);
    }
    console.log('');
    
    // Verify tables exist
    console.log('🔍 Verifying tables...');
    const tables = [
      'exploration_projects',
      'drill_holes',
      'core_logs',
      'field_samples',
      'assay_results'
    ];
    
    for (const table of tables) {
      const { error } = await supabase.from(table).select('count').limit(1);
      console.log(`   ${error ? '❌' : '✅'} ${table}`);
    }
    
    console.log('');
    console.log('🎉 Migration complete!');
    console.log('');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.error('📌 Try running manually in Supabase Dashboard:');
    console.error('   https://supabase.com/dashboard/project/kdqkquhyumqoolvhfzwq/sql/new');
  }
}

runMigration();

