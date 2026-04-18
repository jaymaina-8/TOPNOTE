-- Exact dashboard analytics aggregates (GROUP BY in Postgres — no app-side row sampling).

CREATE OR REPLACE FUNCTION public.dashboard_top_products_by_events(limit_n integer)
RETURNS TABLE (source_product_id uuid, event_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT ce.source_product_id, COUNT(*)::bigint AS event_count
  FROM public.conversion_events ce
  WHERE ce.source_product_id IS NOT NULL
  GROUP BY ce.source_product_id
  ORDER BY COUNT(*) DESC, ce.source_product_id ASC
  LIMIT GREATEST(COALESCE(limit_n, 0), 0);
$$;

CREATE OR REPLACE FUNCTION public.dashboard_top_products_by_inquiries(limit_n integer)
RETURNS TABLE (source_product_id uuid, inquiry_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT i.source_product_id, COUNT(*)::bigint AS inquiry_count
  FROM public.inquiries i
  WHERE i.source_product_id IS NOT NULL
  GROUP BY i.source_product_id
  ORDER BY COUNT(*) DESC, i.source_product_id ASC
  LIMIT GREATEST(COALESCE(limit_n, 0), 0);
$$;

CREATE OR REPLACE FUNCTION public.dashboard_source_page_breakdown(limit_n integer)
RETURNS TABLE (source_page text, event_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    COALESCE(NULLIF(TRIM(BOTH FROM COALESCE(ce.source_page, '')), ''), '(none)') AS sp,
    COUNT(*)::bigint AS event_count
  FROM public.conversion_events ce
  GROUP BY 1
  ORDER BY COUNT(*) DESC, sp ASC
  LIMIT GREATEST(COALESCE(limit_n, 0), 0);
$$;

REVOKE ALL ON FUNCTION public.dashboard_top_products_by_events(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.dashboard_top_products_by_inquiries(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.dashboard_source_page_breakdown(integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.dashboard_top_products_by_events(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.dashboard_top_products_by_inquiries(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.dashboard_source_page_breakdown(integer) TO service_role;
