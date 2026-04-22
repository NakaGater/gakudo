-- RPC function: returns anonymous attendance summary counts for today
-- Accessible by any authenticated user (parents can see how many children are present)
CREATE OR REPLACE FUNCTION get_attendance_summary()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_children INT;
  entered_count INT;
  exited_count INT;
  jst_start TIMESTAMPTZ;
  jst_end TIMESTAMPTZ;
BEGIN
  -- Calculate today's range in JST (UTC+9)
  jst_start := date_trunc('day', now() AT TIME ZONE 'Asia/Tokyo') AT TIME ZONE 'Asia/Tokyo';
  jst_end := jst_start + interval '1 day';

  SELECT COUNT(*) INTO total_children FROM children;

  -- Get latest attendance type per child today
  WITH latest AS (
    SELECT DISTINCT ON (child_id) child_id, type
    FROM attendances
    WHERE recorded_at >= jst_start AND recorded_at < jst_end
    ORDER BY child_id, recorded_at DESC
  )
  SELECT
    COUNT(*) FILTER (WHERE type = 'enter'),
    COUNT(*) FILTER (WHERE type = 'exit')
  INTO entered_count, exited_count
  FROM latest;

  RETURN json_build_object(
    'total', total_children,
    'entered', COALESCE(entered_count, 0),
    'exited', COALESCE(exited_count, 0),
    'none', total_children - COALESCE(entered_count, 0) - COALESCE(exited_count, 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_attendance_summary() TO authenticated;
