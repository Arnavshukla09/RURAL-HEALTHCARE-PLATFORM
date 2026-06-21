-- Auto-create patient profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_patient()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.patients (id, user_id, first_name, last_name, email)
  VALUES (
    gen_random_uuid(),
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
    new.email
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_patient ON auth.users;
CREATE TRIGGER on_auth_user_created_patient
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_patient();
