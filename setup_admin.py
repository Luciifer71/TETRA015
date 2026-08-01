#!/usr/bin/env python3
"""
Admin Setup Script - Direct
Creates admin user in Supabase Auth
"""

import requests
import json
import os
from pathlib import Path

SUPABASE_URL = 'https://lujjfxzmswxiihksssyc.supabase.co'
SUPABASE_ANON_KEY = 'sb_publishable_JWmkaGZKby7OaMwk-M-jTw_-58ttYDz'

ADMIN_EMAIL = 'admin@invoiceguard.com'
ADMIN_PASSWORD = 'SecureAdminPass123!'
ADMIN_NAME = 'System Administrator'

def create_admin_user():
    """Create admin user in Supabase Auth"""
    print('\n' + '='*70)
    print('STEP 1: Creating Admin User in Supabase Auth')
    print('='*70)
    
    try:
        print(f'\nEmail: {ADMIN_EMAIL}')
        print(f'Name: {ADMIN_NAME}')
        
        url = f'{SUPABASE_URL}/auth/v1/signup'
        headers = {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY
        }
        
        data = {
            'email': ADMIN_EMAIL,
            'password': ADMIN_PASSWORD
        }
        
        response = requests.post(url, json=data, headers=headers, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print('✅ Admin user created in Supabase Auth')
            print(f"   User ID: {result.get('user', {}).get('id', 'N/A')}")
            return {
                'success': True,
                'user_id': result.get('user', {}).get('id'),
                'email': ADMIN_EMAIL
            }
        elif response.status_code == 422:
            print('⚠️  User already exists')
            print(f"   Message: {response.json().get('message', 'Unknown error')}")
            # Try to extract user ID if it exists
            return {
                'exists': True,
                'email': ADMIN_EMAIL
            }
        else:
            print(f'❌ Error: {response.status_code}')
            print(f'   Response: {response.text}')
            return {'error': response.text}
            
    except Exception as e:
        print(f'❌ Error creating admin: {str(e)}')
        return {'error': str(e)}

def save_credentials(user_id, email):
    """Save admin credentials to file"""
    print('\n' + '='*70)
    print('STEP 2: Saving Credentials')
    print('='*70)
    
    try:
        creds_file = Path(__file__).parent / '.admin-credentials'
        
        credentials = {
            'userId': user_id,
            'email': ADMIN_EMAIL,
            'password': ADMIN_PASSWORD,
            'name': ADMIN_NAME,
            'createdAt': str(Path.ctime(Path(__file__)))
        }
        
        with open(creds_file, 'w') as f:
            json.dump(credentials, f, indent=2)
        
        print(f'\n✅ Credentials saved to .admin-credentials')
        print('   ⚠️  This file contains sensitive information')
        print('   Move it to a secure location and delete from repo')
        
        return {'success': True}
    except Exception as e:
        print(f'❌ Error saving credentials: {str(e)}')
        return {'error': str(e)}

def display_summary(result):
    """Display setup summary"""
    print('\n' + '='*70)
    print('SETUP SUMMARY')
    print('='*70)
    
    if result.get('error'):
        print('\n❌ Setup Failed')
        print(f"   Error: {result['error']}")
        return False
    
    if result.get('exists'):
        print('\n⚠️  User already exists, but was not created fresh')
        print(f"   Email: {ADMIN_EMAIL}")
    else:
        print('\n✅ Admin Setup Complete!')
        print(f'\nAdmin Account:')
        print(f'   Email: {ADMIN_EMAIL}')
        print(f'   Password: {ADMIN_PASSWORD}')
        print(f"   User ID: {result.get('user_id', 'N/A')}")
    
    print(f'\nNext Steps:')
    print(f'1. Next, run SQL setup in Supabase to create users_roles table:')
    print(f'   - Go to: https://app.supabase.com')
    print(f'   - Project: lujjfxzmswxiihksssyc')
    print(f'   - SQL Editor → New Query')
    print(f'   - Copy supabase/run_setup.sql and Run')
    print(f'\n2. Set ENABLE_SETUP_ADMIN=false in backend/.env')
    print(f'3. Restart backend: cd backend && npm start')
    print(f'4. Start frontend: cd frontend && npm run dev')
    print(f'5. Visit http://localhost:3000/login')
    print(f'6. Login with admin credentials')
    
    return True

def main():
    print('\n╔═══════════════════════════════════════════════════════════════════╗')
    print('║          INVOICE GUARD - ADMIN SETUP                              ║')
    print('╚═══════════════════════════════════════════════════════════════════╝')
    
    # Create admin user
    create_result = create_admin_user()
    
    if create_result.get('error'):
        display_summary(create_result)
        exit(1)
    
    # Save credentials
    user_id = create_result.get('user_id')
    save_result = save_credentials(user_id, ADMIN_EMAIL)
    
    # Display summary
    final_result = {**create_result, **save_result}
    success = display_summary(final_result)
    
    print('\n' + '='*70 + '\n')
    exit(0 if success else 1)

if __name__ == '__main__':
    main()
