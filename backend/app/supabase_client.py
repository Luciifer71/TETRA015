import os
from supabase import create_client, Client
from app.config import settings

# Initialize Supabase client
supabase_url = settings.SUPABASE_URL
supabase_key = settings.SUPABASE_KEY

if not supabase_url or not supabase_key:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in environment variables")

supabase: Client = create_client(supabase_url, supabase_key)

def get_supabase() -> Client:
    return supabase
