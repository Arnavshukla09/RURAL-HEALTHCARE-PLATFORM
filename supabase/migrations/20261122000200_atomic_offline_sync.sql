-- Apply only to a disposable local test stack during development.
-- The owner applies this forward migration to the deployment; never reset production.
ALTER TABLE public.processed_client_ops ADD COLUMN IF NOT EXISTS operation_hash TEXT;

CREATE OR REPLACE FUNCTION public.apply_offline_operation(
  p_client_op_id UUID, p_table TEXT, p_operation TEXT,
  p_entity_id UUID, p_payload JSONB
) RETURNS JSONB
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_patient UUID;
  v_role TEXT;
  v_payload JSONB := COALESCE(p_payload, '{}'::jsonb);
  v_allowed TEXT[];
  v_columns TEXT;
  v_values TEXT;
  v_assignments TEXT;
  v_hash TEXT;
  v_claim UUID;
  v_existing public.processed_client_ops%ROWTYPE;
  v_rows BIGINT;
  v_status TEXT;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501'; END IF;
  SELECT id, role INTO v_patient, v_role FROM public.patients WHERE user_id = v_user LIMIT 1;
  IF v_patient IS NULL THEN RAISE EXCEPTION 'Patient profile required' USING ERRCODE = '42501'; END IF;
  IF p_client_op_id IS NULL OR p_entity_id IS NULL OR jsonb_typeof(v_payload) <> 'object' OR octet_length(v_payload::text) > 64000 THEN
    RAISE EXCEPTION 'Invalid offline operation' USING ERRCODE = '22023';
  END IF;

  IF p_operation = 'INSERT' THEN
    CASE p_table
      WHEN 'appointments' THEN v_allowed := ARRAY['id','patient_id','provider_id','appointment_date','duration_minutes','notes','consultation_type','teleconsult_room_id','status'];
      WHEN 'medical_records' THEN v_allowed := ARRAY['id','patient_id','record_type','content','file_url','provider_id'];
      WHEN 'health_data' THEN v_allowed := ARRAY['id','patient_id','data_type','value','unit','notes','blood_pressure','temperature','pulse_rate','blood_sugar','spo2','weight','recorded_at'];
      WHEN 'clinical_encounters' THEN v_allowed := ARRAY['id','patient_id','provider_id','encounter_type','status','chief_complaint','clinical_notes','media_urls','audio_note_url'];
      WHEN 'clinical_observations' THEN v_allowed := ARRAY['id','patient_id','encounter_id','code','code_system','display','value_numeric','value_text','unit','interpretation'];
      ELSE RAISE EXCEPTION 'INSERT table is not permitted' USING ERRCODE = '42501';
    END CASE;
  ELSIF p_operation = 'UPDATE' THEN
    CASE p_table
      WHEN 'appointments' THEN v_allowed := ARRAY['status','notes'];
      WHEN 'notifications' THEN v_allowed := ARRAY['is_read'];
      ELSE RAISE EXCEPTION 'UPDATE table is not permitted' USING ERRCODE = '42501';
    END CASE;
  ELSIF p_operation = 'DELETE' AND p_table = 'health_data' THEN
    v_allowed := ARRAY[]::TEXT[];
  ELSE RAISE EXCEPTION 'Operation is not permitted' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_object_keys(v_payload) key WHERE NOT (key = ANY(v_allowed))) THEN
    RAISE EXCEPTION 'Payload contains an unsupported column' USING ERRCODE = '22023';
  END IF;

  v_hash := encode(sha256(convert_to(jsonb_build_object('table',p_table,'operation',p_operation,'entity_id',p_entity_id,'payload',v_payload)::text, 'UTF8')), 'hex');
  -- Unique claim serializes concurrent requests. Any later exception rolls back this claim too.
  INSERT INTO public.processed_client_ops(user_id,client_op_id,table_name,operation_hash)
    VALUES (v_user,p_client_op_id,p_table,v_hash)
    ON CONFLICT (user_id,client_op_id) DO NOTHING RETURNING client_op_id INTO v_claim;
  IF v_claim IS NULL THEN
    SELECT * INTO v_existing FROM public.processed_client_ops WHERE user_id = v_user AND client_op_id = p_client_op_id;
    IF v_existing.table_name IS DISTINCT FROM p_table OR (v_existing.operation_hash IS NOT NULL AND v_existing.operation_hash IS DISTINCT FROM v_hash) THEN
      RAISE EXCEPTION 'Operation ID reused with a different payload' USING ERRCODE = '22023';
    END IF;
    RETURN jsonb_build_object('status','duplicate','entity_id',p_entity_id);
  END IF;

  IF p_operation = 'INSERT' THEN
    v_payload := v_payload || jsonb_build_object('id',p_entity_id,'patient_id',v_patient);
    IF p_table = 'appointments' THEN
      v_payload := v_payload || jsonb_build_object('status','scheduled');
      IF NOT EXISTS (SELECT 1 FROM public.healthcare_providers WHERE id = (v_payload->>'provider_id')::UUID AND is_verified = TRUE) THEN
        RAISE EXCEPTION 'Verified provider required' USING ERRCODE = '42501';
      END IF;
    ELSIF p_table = 'clinical_observations' THEN
      IF NOT EXISTS (SELECT 1 FROM public.clinical_encounters WHERE id = (v_payload->>'encounter_id')::UUID AND patient_id = v_patient) THEN
        RAISE EXCEPTION 'Observation encounter must belong to the same patient' USING ERRCODE = '42501';
      END IF;
    END IF;
    SELECT string_agg(format('%I', key), ',' ORDER BY key), string_agg(format('r.%I', key), ',' ORDER BY key)
      INTO v_columns, v_values FROM jsonb_object_keys(v_payload) key;
    EXECUTE format('INSERT INTO public.%I (%s) SELECT %s FROM jsonb_populate_record(NULL::public.%I, $1) r', p_table,v_columns,v_values,p_table) USING v_payload;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
  ELSIF p_operation = 'UPDATE' THEN
    IF p_table = 'appointments' THEN
      -- Lock and re-check terminal state in the same transaction as the ledger and update.
      SELECT status INTO v_status FROM public.appointments WHERE id = p_entity_id FOR UPDATE;
      IF v_status IS NULL THEN RAISE EXCEPTION 'Appointment not visible' USING ERRCODE = '42501'; END IF;
      IF v_status <> 'scheduled' THEN RAISE EXCEPTION 'Appointment is terminal' USING ERRCODE = '22023'; END IF;
      IF v_role = 'patient' AND v_payload ? 'status' AND v_payload->>'status' <> 'cancelled' THEN
        RAISE EXCEPTION 'Patients may only cancel appointments' USING ERRCODE = '42501';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM public.appointments WHERE id = p_entity_id AND (patient_id = v_patient OR v_role IN ('doctor','admin'))) THEN
        RAISE EXCEPTION 'Appointment ownership required' USING ERRCODE = '42501';
      END IF;
    ELSIF NOT EXISTS (SELECT 1 FROM public.notifications WHERE id = p_entity_id AND recipient_type = 'individual' AND recipient_id = v_patient) THEN
      RAISE EXCEPTION 'Notification ownership required' USING ERRCODE = '42501';
    END IF;
    IF v_payload = '{}'::jsonb THEN RAISE EXCEPTION 'Empty update' USING ERRCODE = '22023'; END IF;
    SELECT string_agg(format('%I = r.%I', key,key), ',' ORDER BY key) INTO v_assignments FROM jsonb_object_keys(v_payload) key;
    EXECUTE format('UPDATE public.%I t SET %s FROM jsonb_populate_record(NULL::public.%I,$1) r WHERE t.id = $2',p_table,v_assignments,p_table) USING v_payload,p_entity_id;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
  ELSE
    DELETE FROM public.health_data WHERE id = p_entity_id AND patient_id = v_patient;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
  END IF;
  IF v_rows <> 1 THEN RAISE EXCEPTION 'Operation did not affect one authorized record' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.offline_sync_log(user_id,table_name,operation,client_op_id,status)
    VALUES (v_user,p_table,p_operation,p_client_op_id,'ok');
  RETURN jsonb_build_object('status','ok','entity_id',p_entity_id);
END;
$$;
REVOKE ALL ON FUNCTION public.apply_offline_operation(UUID,TEXT,TEXT,UUID,JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_offline_operation(UUID,TEXT,TEXT,UUID,JSONB) TO authenticated;
