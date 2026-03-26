-- =============================================
-- 011: Fix Finance One auth user
-- Clean up all orphaned auth records and let GoTrue handle creation
-- =============================================

-- Remove ALL traces of this email from auth schema
DELETE FROM auth.mfa_factors WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'sajid.fense@financeone.com.au');
DELETE FROM auth.sessions WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'sajid.fense@financeone.com.au');
DELETE FROM auth.refresh_tokens WHERE user_id::text IN (SELECT id::text FROM auth.users WHERE email = 'sajid.fense@financeone.com.au');
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'sajid.fense@financeone.com.au');
DELETE FROM auth.identities WHERE identity_data ->> 'email' = 'sajid.fense@financeone.com.au';
DELETE FROM auth.users WHERE email = 'sajid.fense@financeone.com.au';

-- Also clean up the public.users and org linkage (will be recreated by admin API)
DELETE FROM public.organization_users WHERE user_id = 'a489a74c-34c2-414e-9815-89e83ea9be49';
DELETE FROM public.users WHERE id = 'a489a74c-34c2-414e-9815-89e83ea9be49';
