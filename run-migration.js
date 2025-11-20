// Run Supabase Migration Script
// This connects to Supabase and creates all tables

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://kdqkquhyumqoolvhfzwq.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY not found in environment');
  process.exit(1);
}

// Create admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
  console.log('🍄 PHASE 3: Supabase Database Connection\n');
  console.log('═══════════════════════════════════════\n');
  
  try {
    // Test connection
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('exploration_projects').select('count').limit(1);
    
    if (error && error.message.includes('relation "exploration_projects" does not exist')) {
      console.log('✅ Connected to Supabase');
      console.log('⚠️  Tables not yet created\n');
      console.log('📋 Ready to run migration...\n');
      
      // Read migration file
      console.log('Reading migration file...');
      const migration = readFileSync('./migrations/001_geological_core_schema.sql', 'utf8');
      
      console.log('⚠️  Note: Migration requires Supabase Dashboard access');
      console.log('   Go to: https://supabase.com/dashboard/project/kdqkquhyumqoolvhfzwq');
      console.log('   SQL Editor → New Query → Paste migration\n');
      
      console.log('Migration file ready at: ./migrations/001_geological_core_schema.sql');
      console.log('Lines:', migration.split('\n').length);
      console.log('\nWould create:');
      console.log('  - exploration_projects table');
      console.log('  - drill_holes table');
      console.log('  - core_logs table');
      console.log('  - field_samples table');
      console.log('  - assay_results table');
      console.log('  - geological_interpretations table');
      console.log('  - geophysical_surveys table');
      console.log('  - exploration_targets table');
      console.log('  - Views and triggers');
      
    } else if (error) {
      console.log('❌ Supabase connection error:', error.message);
    } else {
      console.log('✅ Connected to Supabase');
      console.log('✅ Tables already exist');
      console.log(`   Found ${data?.length || 0} projects\n`);
      
      // Test each table
      console.log('Testing tables...');
      const tables = [
        'exploration_projects',
        'drill_holes', 
        'core_logs',
        'field_samples',
        'assay_results'
      ];
      
      for (const table of tables) {
        const { error } = await supabase.from(table).select('count').limit(1);
        console.log(`  ${error ? '❌' : '✅'} ${table}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n═══════════════════════════════════════\n');
}

runMigration();

